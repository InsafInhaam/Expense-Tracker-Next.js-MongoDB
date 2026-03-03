import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { text } = await request.json();

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key not configured" },
        { status: 500 },
      );
    }

    // Call Gemini API
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
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
                  text: `Parse the following transaction statement and extract the information in valid JSON format. Return ONLY a valid JSON object with no additional text or markdown formatting.

Categories for income: Salary, Freelance, Investment, Business, Gift, Refund, Other
Categories for expense: Food & Dining, Transport, Shopping, Bills & Utilities, Entertainment, Healthcare, Education, Groceries, Other

Rules:
- Determine if it's "income" or "expense" based on context (spent/paid = expense, earned/received = income)
- Extract amount as a number (remove currency symbols)
- Map the category to one of the predefined categories above (use closest match)
- Parse date: "yesterday" = 1 day ago, "today" = current date, day names = most recent occurrence, specific dates = use that date
- Return date in ISO format (YYYY-MM-DD)
- Add a note field with any additional context from the original text

Statement: "${text}"

Return ONLY this JSON structure (no markdown, no code blocks):
{
  "type": "income" or "expense",
  "amount": number,
  "category": "exact category name from the list above",
  "date": "YYYY-MM-DD",
  "note": "original statement or relevant context"
}`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            topK: 1,
            topP: 1,
            maxOutputTokens: 256,
          },
        }),
      },
    );

    if (!geminiResponse.ok) {
      throw new Error("Gemini API request failed");
    }

    const geminiData = await geminiResponse.json();
    const generatedText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      throw new Error("No response from Gemini");
    }

    // Clean up response - remove markdown code blocks if present
    let cleanedText = generatedText.trim();
    cleanedText = cleanedText.replace(/```json\n?/g, "");
    cleanedText = cleanedText.replace(/```\n?/g, "");
    cleanedText = cleanedText.trim();

    // Parse the JSON response
    const parsed = JSON.parse(cleanedText);

    // Validate required fields
    if (!parsed.type || !parsed.amount || !parsed.category || !parsed.date) {
      throw new Error("Invalid parsed data");
    }

    // Ensure type is valid
    if (parsed.type !== "income" && parsed.type !== "expense") {
      throw new Error("Invalid transaction type");
    }

    // Ensure amount is positive
    if (typeof parsed.amount !== "number" || parsed.amount <= 0) {
      throw new Error("Invalid amount");
    }

    return NextResponse.json({
      success: true,
      data: {
        type: parsed.type,
        amount: parsed.amount,
        category: parsed.category,
        date: parsed.date,
        note: parsed.note || text,
        source: "voice",
      },
    });
  } catch (error: any) {
    console.error("Parse transaction error:", error);
    return NextResponse.json(
      {
        error: "Failed to parse transaction",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
