import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Expense from "@/models/Expense";

export async function GET() {
  await connectToDatabase();
  const expenses = await Expense.find().sort({ date: -1 });
  return NextResponse.json({ expenses });
}

export async function POST(req) {
  await connectToDatabase();
  const body = await req.json();
  const { title, amount, category, notes, date } = body;

  if (!title || !amount || !category || !date) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const expense = await Expense.create({
    title,
    amount,
    category,
    notes,
    date,
  });
  return NextResponse.json({ expense }, { status: 201 });
}
