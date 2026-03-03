import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import User from "@/models/User";

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
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
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
    if (!type || !amount || !category) {
      return NextResponse.json(
        { error: "Missing required fields: type, amount, category" },
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
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "Amount must be a positive number" },
        { status: 400 },
      );
    }

    const transaction = await Transaction.create({
      userId: user._id,
      type,
      amount: parseFloat(amount),
      category,
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
