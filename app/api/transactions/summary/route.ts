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

    const transactions = await Transaction.find({ userId: user._id }).lean();

    const income = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    const balance = income - expenses;

    return NextResponse.json({
      balance,
      income,
      expenses,
    });
  } catch (error: any) {
    console.error("Error fetching summary:", {
      message: error?.message,
      stack: error?.stack,
      error: String(error),
    });
    return NextResponse.json(
      {
        error: "Failed to fetch summary",
        details: error?.message || error?.toString(),
      },
      { status: 500 },
    );
  }
}
