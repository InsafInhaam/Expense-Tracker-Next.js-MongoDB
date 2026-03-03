import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { image, mimeType } = await request.json();

    if (!image) {
      return NextResponse.json({ error: "Image is required" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key not configured" },
        { status: 500 },
      );
    }

    // Call Gemini Vision API
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
                  text: `Analyze this receipt image and extract transaction information. Return ONLY a valid JSON object with no additional text or markdown formatting.

Categories for expense: Food & Dining, Transport, Shopping, Bills & Utilities, Entertainment, Healthcare, Education, Groceries, Other
Categories for income: Salary, Freelance, Investment, Business, Gift, Refund, Other

Rules:
- Extract the total amount (just the number, no currency symbols)
- Identify the merchant/vendor name
- Extract the date (return in YYYY-MM-DD format, if not visible use today's date)
- Determine transaction type (receipts are usually "expense", but check context)
- Suggest the most appropriate category from the lists above
- Add any relevant notes (items purchased, additional context)

Return ONLY this JSON structure (no markdown, no code blocks):
{
  "type": "expense",
  "amount": number,
  "category": "exact category name from the list",
  "merchant": "merchant/vendor name",
  "date": "YYYY-MM-DD",
  "note": "relevant details from receipt"
}`,
                },
                {
                  inline_data: {
                    mime_type: mimeType || "image/jpeg",
                    data: image,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            topK: 1,
            topP: 1,
            maxOutputTokens: 512,
          },
        }),
      },
    );

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.json();
      console.error("Gemini API error:", errorData);
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
    if (!parsed.amount || !parsed.category || !parsed.date) {
      throw new Error("Invalid parsed data - missing required fields");
    }

    // Ensure type is valid
    if (!parsed.type) {
      parsed.type = "expense"; // Default to expense for receipts
    }
    if (parsed.type !== "income" && parsed.type !== "expense") {
      throw new Error("Invalid transaction type");
    }

    // Ensure amount is positive
    if (typeof parsed.amount !== "number" || parsed.amount <= 0) {
      throw new Error("Invalid amount");
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(parsed.date)) {
      // If invalid format, use today's date
      parsed.date = new Date().toISOString().split("T")[0];
    }

    return NextResponse.json({
      success: true,
      data: {
        type: parsed.type,
        amount: parsed.amount,
        category: parsed.category,
        merchant: parsed.merchant || "Unknown",
        date: parsed.date,
        note: parsed.note || "",
        source: "receipt",
      },
    });
  } catch (error: any) {
    console.error("Parse receipt error:", error);
    return NextResponse.json(
      {
        error: "Failed to parse receipt",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
