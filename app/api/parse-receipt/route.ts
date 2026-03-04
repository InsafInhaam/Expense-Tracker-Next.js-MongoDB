import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  resolveAllowedCategory,
} from "@/lib/categories";

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
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
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
                  text: `Analyze this receipt image and extract transaction information. Return ONLY a valid JSON object with NO additional text, NO markdown, NO code blocks, and NO pretty-printing.

Categories for expense: ${EXPENSE_CATEGORIES.join(", ")}
Categories for income: ${INCOME_CATEGORIES.join(", ")}

Rules:
- Extract the total amount (just the number, no currency symbols, no non-numeric except decimal point)
- Identify the merchant/vendor name
- Extract the date (return in YYYY-MM-DD format, if not visible use today's date)
- Determine transaction type (receipts are usually "expense", but check context)
- Suggest the most appropriate category from the lists above
- Add any relevant notes (items purchased, additional context)
- Return ONLY valid JSON on a single line

Return ONLY this exact JSON format (compact, single line):
{"type":"expense"|"income","amount":number,"category":"exact category name","merchant":"vendor name","date":"YYYY-MM-DD","note":"details"}`,
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
            topK: 40,
            topP: 0.95,
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

    // Remove escaped quotes if present (e.g., from JSON-in-JSON responses)
    if (cleanedText.startsWith('"') && cleanedText.endsWith('"')) {
      cleanedText = cleanedText.slice(1, -1);
    }
    cleanedText = cleanedText.replace(/\\"/g, '"');

    cleanedText = cleanedText.replace(/```json\n?/g, "");
    cleanedText = cleanedText.replace(/```\n?/g, "");
    cleanedText = cleanedText.trim();

    // Try to extract JSON if it's embedded in other text
    let parsed;
    try {
      parsed = JSON.parse(cleanedText);
    } catch (parseError) {
      // Try to extract JSON object from the text - handle prettified JSON
      let jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch (extractError) {
          console.error("JSON parsing failed:", {
            input: cleanedText.substring(0, 500),
            error:
              extractError instanceof Error
                ? extractError.message
                : String(extractError),
          });
          // Try to find and fix common issues
          let fixedJson = jsonMatch[0];
          // Remove trailing commas
          fixedJson = fixedJson.replace(/,\s*\}/g, "}").replace(/,\s*\]/g, "]");
          try {
            parsed = JSON.parse(fixedJson);
          } catch {
            throw new Error(
              `Failed to parse JSON from Gemini response. Original: ${cleanedText.substring(0, 200)}`,
            );
          }
        }
      } else {
        console.error(
          "No JSON found in response:",
          cleanedText.substring(0, 300),
        );
        throw new Error(
          `Gemini did not return valid JSON. Response: ${cleanedText.substring(0, 150)}`,
        );
      }
    }

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

    const resolvedCategory = resolveAllowedCategory(
      parsed.type,
      parsed.category,
    );
    if (!resolvedCategory) {
      throw new Error(
        `Invalid category. Allowed categories for ${parsed.type}: ${
          parsed.type === "income"
            ? INCOME_CATEGORIES.join(", ")
            : EXPENSE_CATEGORIES.join(", ")
        }`,
      );
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
        category: resolvedCategory,
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
