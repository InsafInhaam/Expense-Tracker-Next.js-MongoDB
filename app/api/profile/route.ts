import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";

export async function GET(request: Request) {
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

    const userObject = user.toObject();

    return NextResponse.json({
      _id: userObject._id,
      name: userObject.name,
      email: userObject.email,
      image: userObject.image,
      plan: userObject.plan || "FREE",
      currency: userObject.currency || "USD",
      gmailConnected: userObject.gmailConnected || false,
      gmailEmail: userObject.gmailEmail,
      aiUsage: userObject.aiUsage || {
        dailyTokensUsed: 0,
        monthlyTokensUsed: 0,
        requestsThisMinute: 0,
        lastResetDaily: new Date(),
        lastResetMonthly: new Date(),
        lastRequestTime: new Date(),
      },
    });
  } catch (error: any) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, currency } = body;

    const updateData: any = {};

    if (name) {
      updateData.name = name;
    }

    if (currency) {
      updateData.currency = currency;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 },
      );
    }

    await connectToDatabase();

    const user = await User.findOneAndUpdate(
      { email: session.user.email },
      updateData,
      { new: true },
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      name: user.name,
      email: user.email,
      currency: user.currency || "USD",
    });
  } catch (error: any) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 },
    );
  }
}
