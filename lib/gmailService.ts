import { google } from "googleapis";
import { encrypt, decrypt } from "./encryption";

const GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
];

/**
 * Creates OAuth2 client for Gmail API
 */
export function getGmailOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.NEXTAUTH_URL + "/api/gmail/callback",
  );
}

/**
 * Generates Gmail OAuth authorization URL
 */
export function getGmailAuthUrl(): string {
  const oauth2Client = getGmailOAuthClient();

  return oauth2Client.generateAuthUrl({
    access_type: "offline", // Get refresh token
    scope: GMAIL_SCOPES,
    prompt: "consent", // Force consent screen to always get refresh token
  });
}

/**
 * Exchanges authorization code for tokens
 */
export async function getGmailTokensFromCode(code: string) {
  const oauth2Client = getGmailOAuthClient();
  const { tokens } = await oauth2Client.getToken(code);

  return {
    accessToken: tokens.access_token!,
    refreshToken: tokens.refresh_token!,
    expiry: tokens.expiry_date ? new Date(tokens.expiry_date) : new Date(),
  };
}

/**
 * Refreshes access token using refresh token
 */
export async function refreshGmailAccessToken(encryptedRefreshToken: string) {
  const refreshToken = decrypt(encryptedRefreshToken);
  const oauth2Client = getGmailOAuthClient();

  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  });

  const { credentials } = await oauth2Client.refreshAccessToken();

  return {
    accessToken: credentials.access_token!,
    expiry: credentials.expiry_date
      ? new Date(credentials.expiry_date)
      : new Date(),
  };
}

/**
 * Gets authenticated Gmail client
 */
export async function getAuthenticatedGmailClient(
  encryptedAccessToken: string,
  encryptedRefreshToken: string,
  tokenExpiry: Date,
) {
  console.log("🔐 Creating authenticated Gmail client...", {
    hasAccessToken: !!encryptedAccessToken,
    hasRefreshToken: !!encryptedRefreshToken,
    tokenExpiry: tokenExpiry?.toISOString(),
  });

  const oauth2Client = getGmailOAuthClient();

  // Decrypt tokens
  let accessToken = decrypt(encryptedAccessToken);
  let refreshToken = decrypt(encryptedRefreshToken);

  console.log("🔑 Token decryption:", {
    accessTokenLength: accessToken?.length,
    refreshTokenLength: refreshToken?.length,
  });

  if (!accessToken) {
    throw new Error("Failed to decrypt access token");
  }

  // Check if token is expired and refresh if needed
  const now = new Date();
  if (now >= tokenExpiry && refreshToken) {
    console.log("🔄 Token expired, refreshing...");
    try {
      const refreshed = await refreshGmailAccessToken(encryptedRefreshToken);
      accessToken = refreshed.accessToken;
      console.log("✅ Token refreshed successfully");
    } catch (error) {
      console.error("⚠️  Token refresh failed:", error);
      // Continue with old token, might still be valid
    }
  }

  // Set credentials on OAuth client
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
    expiry_date: tokenExpiry?.getTime(),
  });

  console.log("✅ OAuth2 client configured with credentials");

  return google.gmail({ version: "v1", auth: oauth2Client });
}

/**
 * Fetches messages from Gmail since last sync
 */
export async function fetchGmailMessages(
  gmail: any,
  lastSyncAt?: Date,
  maxResults: number = 50,
) {
  // Get date filter - default last 30 days
  const afterDate = lastSyncAt
    ? Math.floor(lastSyncAt.getTime() / 1000)
    : Math.floor(Date.now() / 1000) - 86400 * 30;

  // Simpler Gmail query - just get recent emails with financial keywords
  // Gmail API is very restrictive with complex syntax, so we keep it simple
  const query = `has:attachment newer_than:30d (receipt OR payment OR bill OR subscription OR invoice OR charge OR "order confirmation") OR from:(noreply@* OR billing OR payments OR subscriptions OR support)`;

  console.log("📧 Gmail query:", query);

  try {
    const response = await gmail.users.messages.list({
      userId: "me",
      q: query,
      maxResults,
    });

    const messages = response.data.messages || [];
    console.log(`📨 Found ${messages.length} emails matching query`);

    return messages;
  } catch (error: any) {
    console.error("❌ Error fetching Gmail messages:", error.message);
    // If query fails, try ultra-simple query - just get recent emails
    try {
      console.log("🔄 Retrying with simpler query...");
      const fallbackResponse = await gmail.users.messages.list({
        userId: "me",
        q: `newer_than:30d`,
        maxResults,
      });
      const messages = fallbackResponse.data.messages || [];
      console.log(`📨 Fallback: Found ${messages.length} recent emails`);
      return messages;
    } catch (fallbackError) {
      console.error("❌ Fallback query also failed:", fallbackError);
      return [];
    }
  }
}

/**
 * Gets full email details including body
 */
export async function getGmailMessageDetails(gmail: any, messageId: string) {
  const response = await gmail.users.messages.get({
    userId: "me",
    id: messageId,
    format: "full",
  });

  const message = response.data;
  const headers = message.payload.headers;

  // Extract headers
  const subject = headers.find((h: any) => h.name === "Subject")?.value || "";
  const from = headers.find((h: any) => h.name === "From")?.value || "";
  const date = headers.find((h: any) => h.name === "Date")?.value || "";

  // Extract body (handle both plain text and HTML)
  let body = "";

  if (message.payload.parts) {
    // Multi-part email
    const textPart = message.payload.parts.find(
      (part: any) => part.mimeType === "text/plain",
    );
    if (textPart && textPart.body.data) {
      body = Buffer.from(textPart.body.data, "base64").toString("utf-8");
    }
  } else if (message.payload.body?.data) {
    // Single-part email
    body = Buffer.from(message.payload.body.data, "base64").toString("utf-8");
  }

  return {
    id: message.id,
    threadId: message.threadId,
    subject,
    from,
    date: new Date(date),
    body: body.slice(0, 5000), // Limit body size for AI processing
    snippet: message.snippet,
  };
}
