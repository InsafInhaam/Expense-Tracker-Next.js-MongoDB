import { GoogleGenerativeAI } from "@google/generative-ai";
import connectToDatabase from "./mongodb";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import {
  getAuthenticatedGmailClient,
  fetchGmailMessages,
  getGmailMessageDetails,
} from "./gmailService";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

interface ParsedEmailTransaction {
  amount: number;
  merchant: string;
  date: string;
  category: string;
  type: "income" | "expense";
  isSubscription: boolean;
  confidence: number; // 0-100
  rawText?: string;
}

/**
 * Parse email content using Gemini AI
 */
async function parseEmailWithAI(
  emailData: any,
): Promise<ParsedEmailTransaction | null> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const prompt = `You are a financial transaction parser. Analyze this email and extract transaction details if it contains a bill payment, subscription charge, or purchase receipt.

Email Subject: ${emailData.subject}
Email From: ${emailData.from}
Email Date: ${emailData.date}
Email Body: ${emailData.body}

Extract the following information:
- amount: The monetary amount (number only, no currency symbols)
- merchant: The company/merchant name
- date: Transaction date in YYYY-MM-DD format (use email date if not specified)
- category: One of [Food & Dining, Transport, Shopping, Bills & Utilities, Entertainment, Healthcare, Education, Groceries, Subscription, Software, Streaming]
- type: Either "income" or "expense"
- isSubscription: true if this is a recurring subscription/membership charge (Netflix, Spotify, YouTube Premium, Canva, etc.)
- confidence: Your confidence level 0-100 based on how clear the transaction info is

Return ONLY a JSON object with these fields. If no clear transaction is found, return: {"amount": 0, "confidence": 0}

Examples of subscriptions: YouTube Premium, Netflix, Spotify, Canva, Adobe, Microsoft 365, ChatGPT Plus, GitHub Copilot, etc.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    console.log("🤖 Gemini raw response:", responseText.substring(0, 200));

    // Clean and parse JSON
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.log("❌ No JSON found in Gemini response");
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]);
    console.log("📊 Parsed transaction:", parsed);

    // Validate parsed data
    if (!parsed.amount || parsed.amount <= 0) {
      console.log("❌ Invalid amount:", parsed.amount);
      return null;
    }

    if (parsed.confidence < 50) {
      console.log(`⚠️  Confidence too low: ${parsed.confidence}% (need ≥50%)`);
      return null;
    }

    console.log(
      `✅ Valid transaction: ${parsed.merchant} - $${parsed.amount} (confidence: ${parsed.confidence}%)`,
    );

    return {
      amount: parsed.amount,
      merchant: parsed.merchant || "Unknown",
      date: parsed.date || new Date().toISOString().split("T")[0],
      category: parsed.category || "Bills & Utilities",
      type: parsed.type || "expense",
      isSubscription: parsed.isSubscription || false,
      confidence: parsed.confidence || 0,
      rawText: emailData.body.slice(0, 500),
    };
  } catch (error) {
    console.error("❌ Error parsing email with AI:", error);
    return null;
  }
}

/**
 * Main Gmail sync function
 */
export async function syncGmailTransactions(userId: string) {
  try {
    await connectToDatabase();

    // Get user with tokens
    const user = await User.findById(userId).select(
      "+gmailAccessToken +gmailRefreshToken",
    );

    if (!user || !user.gmailConnected) {
      throw new Error("Gmail not connected for this user");
    }

    console.log("🔄 Starting Gmail sync for:", user.email);
    console.log("📋 User sync state:", {
      gmailConnected: user.gmailConnected,
      hasAccessToken: !!user.gmailAccessToken,
      hasRefreshToken: !!user.gmailRefreshToken,
      tokenExpiry: user.gmailTokenExpiry?.toISOString(),
    });

    if (!user.gmailAccessToken || !user.gmailRefreshToken) {
      throw new Error(
        "Gmail tokens missing. Please reconnect Gmail in profile settings.",
      );
    }

    // Update sync status
    await User.findByIdAndUpdate(userId, {
      $set: { "gmailSyncState.lastSyncStatus": "in-progress" },
    });

    // Get authenticated Gmail client
    const gmail = await getAuthenticatedGmailClient(
      user.gmailAccessToken,
      user.gmailRefreshToken,
      user.gmailTokenExpiry || new Date(),
    );

    // Fetch new messages
    const lastSyncAt = user.gmailSyncState?.lastSyncAt;
    const messages = await fetchGmailMessages(gmail, lastSyncAt);

    console.log(`📧 Found ${messages.length} new emails to process`);

    let processedCount = 0;
    let savedCount = 0;
    const newMessageIds: string[] = [];

    for (const message of messages) {
      try {
        // Check if already processed
        const alreadyProcessed =
          user.gmailSyncState?.processedMessageIds?.includes(message.id);

        if (alreadyProcessed) {
          console.log("⏭️  Skipping already processed message:", message.id);
          continue;
        }

        console.log(`\n📩 Processing new message: ${message.id}`);

        // Get full message details
        const emailData = await getGmailMessageDetails(gmail, message.id);
        console.log(`📝 Email subject: "${emailData.subject}"`);

        // Parse with AI
        const parsedTransaction = await parseEmailWithAI(emailData);

        if (parsedTransaction && parsedTransaction.confidence >= 50) {
          // Check for duplicate by merchant + amount + date
          const existingTransaction = await Transaction.findOne({
            userId: user._id,
            amount: parsedTransaction.amount,
            category: parsedTransaction.category,
            date: new Date(parsedTransaction.date),
            source: "gmail",
          });

          if (existingTransaction) {
            console.log("⏭️  Duplicate transaction found, skipping");
          } else {
            // Save new transaction
            const transaction = new Transaction({
              userId: user._id,
              type: parsedTransaction.type,
              amount: parsedTransaction.amount,
              category: parsedTransaction.category,
              note: `From ${parsedTransaction.merchant} (Gmail: ${emailData.subject})`,
              date: new Date(parsedTransaction.date),
              source: "gmail",
            });

            await transaction.save();
            savedCount++;
            console.log(
              "✅ Saved transaction:",
              parsedTransaction.merchant,
              parsedTransaction.amount,
            );
          }
        }

        newMessageIds.push(message.id);
        processedCount++;

        // Rate limiting: small delay between API calls
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        console.error("Error processing message:", message.id, error);
        // Continue with next message
      }
    }

    // Update sync state
    await User.findByIdAndUpdate(userId, {
      $set: {
        "gmailSyncState.lastSyncAt": new Date(),
        "gmailSyncState.lastSyncStatus": "success",
        "gmailSyncState.totalEmailsProcessed":
          (user.gmailSyncState?.totalEmailsProcessed || 0) + processedCount,
      },
      $addToSet: {
        "gmailSyncState.processedMessageIds": { $each: newMessageIds },
      },
    });

    console.log(
      `✅ Gmail sync complete: ${processedCount} processed, ${savedCount} saved`,
    );

    return {
      success: true,
      processedCount,
      savedCount,
    };
  } catch (error: any) {
    console.error("Gmail sync error:", error);

    // Update error status
    await User.findByIdAndUpdate(userId, {
      $set: {
        "gmailSyncState.lastSyncStatus": "error",
        "gmailSyncState.lastSyncError": error.message,
      },
    });

    throw error;
  }
}
