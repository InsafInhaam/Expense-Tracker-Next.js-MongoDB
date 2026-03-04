import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import User from "@/models/User";
import {
  formatAllowedCategories,
  resolveAllowedCategory,
  type TransactionType,
} from "@/lib/categories";

async function classifyCategoryWithGemini(
  type: TransactionType,
  description: string,
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API key not configured");
  }

  const allowedCategories = formatAllowedCategories(type);

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
                text: `Classify this ${type} transaction into exactly one category from the allowed list.

Allowed categories: ${allowedCategories}

Transaction description: "${description}"

Rules:
- Return ONLY the exact category name from the allowed list.
- Do not return explanations, JSON, markdown, or any additional text.
- If uncertain, return "Other".`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          topK: 1,
          topP: 1,
          maxOutputTokens: 32,
        },
      }),
    },
  );

  if (!geminiResponse.ok) {
    throw new Error("Gemini category classification failed");
  }

  const geminiData = await geminiResponse.json();
  const generatedText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!generatedText) {
    throw new Error("No category returned from Gemini");
  }

  let cleaned = generatedText
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim()
    .split("\n")[0]
    .trim();

  // Remove escaped and regular quotes
  cleaned = cleaned
    .replace(/\\"/g, '"')
    .replace(/^["']+|["']+$/g, "")
    .trim();

  const resolved = resolveAllowedCategory(type, cleaned);

  if (!resolved) {
    throw new Error(
      `Gemini returned an invalid category: "${cleaned}". Allowed categories: ${allowedCategories}`,
    );
  }

  return resolved;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const transactions = await Transaction.find({ userId: user._id })
      .sort({ date: -1 })
      .lean();

    return NextResponse.json({ transactions });
  } catch (error: any) {
    console.error("Error fetching transactions:", {
      message: error?.message,
      stack: error?.stack,
      error: String(error),
    });
    return NextResponse.json(
      {
        error: "Failed to fetch transactions",
        details: error?.message || error?.toString(),
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const { type, amount, category, note, date, source, imageUrl, merchant } =
      body;

    // Validate required fields
    if (!type || !amount) {
      return NextResponse.json(
        { error: "Missing required fields: type, amount" },
        { status: 400 },
      );
    }

    // Validate type
    if (type !== "income" && type !== "expense") {
      return NextResponse.json(
        { error: "Type must be either 'income' or 'expense'" },
        { status: 400 },
      );
    }

    // Validate amount
    const parsedAmount = Number(amount);
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { error: "Amount must be a positive number" },
        { status: 400 },
      );
    }

    let finalCategory = resolveAllowedCategory(type, category);

    if (category && !finalCategory) {
      return NextResponse.json(
        {
          error: `Invalid category. Allowed categories for ${type}: ${formatAllowedCategories(type)}`,
        },
        { status: 400 },
      );
    }

    if (!finalCategory) {
      const description = [
        typeof body.description === "string" ? body.description : "",
        typeof note === "string" ? note : "",
        typeof merchant === "string" ? merchant : "",
      ]
        .map((item) => item.trim())
        .filter(Boolean)
        .join(" | ");

      if (!description) {
        return NextResponse.json(
          {
            error:
              "Category is required unless a description/note/merchant is provided for Gemini classification.",
          },
          { status: 400 },
        );
      }

      finalCategory = await classifyCategoryWithGemini(type, description);
    }

    const transaction = await Transaction.create({
      userId: user._id,
      type,
      amount: parsedAmount,
      category: finalCategory,
      note: note || undefined,
      date: date ? new Date(date) : new Date(),
      source: source || "manual",
      imageUrl: imageUrl || undefined,
      merchant: merchant || undefined,
    });

    return NextResponse.json({ transaction }, { status: 201 });
  } catch (error) {
    console.error("Error creating transaction:", error);
    return NextResponse.json(
      { error: "Failed to create transaction" },
      { status: 500 },
    );
  }
}
