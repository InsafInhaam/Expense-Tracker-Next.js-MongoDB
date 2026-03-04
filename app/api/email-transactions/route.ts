import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

interface GmailMessage {
  id: string;
  snippet?: string;
  payload?: {
    mimeType?: string;
    body?: { data?: string };
    headers?: Array<{ name: string; value: string }>;
    parts?: GmailMessage["payload"][];
  };
}

function decodeBase64Url(data?: string): string {
  if (!data) return "";
  const normalized = data.replace(/-/g, "+").replace(/_/g, "/");
  const pad = normalized.length % 4;
  const padded = normalized + (pad ? "=".repeat(4 - pad) : "");
  return Buffer.from(padded, "base64").toString("utf-8");
}

function stripHtml(input: string): string {
  return input
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTextFromPayload(payload?: GmailMessage["payload"]): string {
  if (!payload) return "";

  const mimeType = payload.mimeType || "";

  if (mimeType.includes("text/plain")) {
    return decodeBase64Url(payload.body?.data);
  }

  if (mimeType.includes("text/html")) {
    return stripHtml(decodeBase64Url(payload.body?.data));
  }

  if (payload.parts?.length) {
    for (const part of payload.parts) {
      const text = extractTextFromPayload(part);
      if (text) return text;
    }
  }

  return "";
}

function cleanJsonString(raw: string): string {
  return raw
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!session.accessToken) {
      return NextResponse.json(
        {
          error:
            "Gmail access token missing. Please sign out and sign in again to grant Gmail permission.",
        },
        { status: 400 },
      );
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      return NextResponse.json(
        { error: "Gemini API key not configured" },
        { status: 500 },
      );
    }

    const query = encodeURIComponent(
      "newer_than:30d (payment OR paid OR credited OR debited OR transaction OR invoice OR receipt OR order)",
    );

    const listResp = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=12&q=${query}`,
      {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
        cache: "no-store",
      },
    );

    if (!listResp.ok) {
      const details = await listResp.text();
      return NextResponse.json(
        { error: "Failed to fetch Gmail messages", details },
        { status: 500 },
      );
    }

    const listData = await listResp.json();
    const messages: Array<{ id: string }> = listData.messages || [];

    if (messages.length === 0) {
      return NextResponse.json({ detectedTransactions: [] });
    }

    const detailedMessages = await Promise.all(
      messages.map(async (msg) => {
        const msgResp = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
          {
            headers: {
              Authorization: `Bearer ${session.accessToken}`,
            },
            cache: "no-store",
          },
        );

        if (!msgResp.ok) {
          return null;
        }

        const fullMsg: GmailMessage = await msgResp.json();
        const headers = fullMsg.payload?.headers || [];
        const subject =
          headers.find((h) => h.name.toLowerCase() === "subject")?.value || "";
        const from =
          headers.find((h) => h.name.toLowerCase() === "from")?.value || "";
        const date =
          headers.find((h) => h.name.toLowerCase() === "date")?.value || "";

        const bodyText =
          extractTextFromPayload(fullMsg.payload) || fullMsg.snippet || "";

        return {
          id: fullMsg.id,
          subject,
          from,
          date,
          body: bodyText.slice(0, 3000),
        };
      }),
    );

    const usableEmails = detailedMessages.filter(Boolean);

    if (usableEmails.length === 0) {
      return NextResponse.json({ detectedTransactions: [] });
    }

    const geminiResp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${geminiApiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are extracting financial transactions from email content. Return ONLY valid JSON (no markdown, no pretty-printing, compact single-line format).

Required JSON shape:
{"transactions":[{"emailId":"id","type":"income"|"expense","amount":number,"category":"Category","date":"YYYY-MM-DD","merchant":"name","note":"text","confidence":0.75}]}

Rules:
- Only include real completed transactions.
- confidence is 0..1 (typical: 0.5-0.9).
- If amount missing/uncertain, skip entry.
- Categories: Salary, Freelance, Investment, Business, Gift, Refund, Other (income) OR Food & Dining, Transport, Shopping, Bills & Utilities, Entertainment, Healthcare, Education, Groceries, Other (expense)
- date from transaction; fallback to email date.
- note: concise summary.
- Return ONLY valid JSON, NO additional text, NO code blocks, NOT pretty-printed.

Emails:
${JSON.stringify(usableEmails)}`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          },
        }),
      },
    );

    if (!geminiResp.ok) {
      const details = await geminiResp.text();
      return NextResponse.json(
        { error: "Gemini parsing failed", details },
        { status: 500 },
      );
    }

    const geminiData = await geminiResp.json();
    const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      return NextResponse.json({ detectedTransactions: [] });
    }

    // Parse JSON with robust error handling
    let parsed;
    let cleanedRaw = cleanJsonString(rawText);

    // Remove escaped quotes if present
    if (cleanedRaw.startsWith('"') && cleanedRaw.endsWith('"')) {
      cleanedRaw = cleanedRaw.slice(1, -1);
    }
    cleanedRaw = cleanedRaw.replace(/\\"/g, '"');

    try {
      parsed = JSON.parse(cleanedRaw);
    } catch (parseError) {
      // Try to extract JSON object from the text
      let jsonMatch = cleanedRaw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch {
          // Try unescaping
          let unescaped = jsonMatch[0].replace(/\\"/g, '"');
          try {
            parsed = JSON.parse(unescaped);
          } catch {
            console.error(
              "Email transaction JSON parsing failed:",
              cleanedRaw.substring(0, 300),
            );
            // Return empty array on parse failure
            return NextResponse.json({ detectedTransactions: [] });
          }
        }
      } else {
        return NextResponse.json({ detectedTransactions: [] });
      }
    }

    const transactions = Array.isArray(parsed?.transactions)
      ? parsed.transactions
      : [];

    const detectedTransactions = transactions
      .filter(
        (item: any) =>
          item &&
          (item.type === "income" || item.type === "expense") &&
          typeof item.amount === "number" &&
          item.amount > 0 &&
          item.category &&
          item.date,
      )
      .map((item: any) => ({
        type: item.type,
        amount: item.amount,
        category: item.category,
        date: item.date,
        merchant: item.merchant || undefined,
        note: item.note || "Detected from Gmail",
        confidence:
          typeof item.confidence === "number"
            ? Math.max(0, Math.min(1, item.confidence))
            : 0.6,
        source: "email",
        emailId: item.emailId || undefined,
      }));

    return NextResponse.json({ detectedTransactions });
  } catch (error: any) {
    console.error("Email transaction detection error:", error);
    return NextResponse.json(
      {
        error: "Failed to detect transactions from Gmail",
        details: error?.message,
      },
      { status: 500 },
    );
  }
}
