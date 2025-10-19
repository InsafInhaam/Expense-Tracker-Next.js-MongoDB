import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Expense from "@/models/Expense";

export async function GET(req, { params }) {
  await connectToDatabase();
  const expense = await Expense.findById(params.id);
  if (!expense)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ expense });
}

export async function PUT(req, { params }) {
  await connectToDatabase();
  const data = await req.json();
  const updated = await Expense.findByIdAndUpdate(params.id, data, {
    new: true,
  });
  return NextResponse.json({ expense: updated });
}

export async function DELETE(req, { params }) {
  await connectToDatabase();
  await Expense.findByIdAndDelete(params.id);
  return NextResponse.json({ message: "Deleted" }, { status: 204 });
}
