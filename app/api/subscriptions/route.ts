import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import Subscription from "@/models/Subscription";
import { calculateSubscriptionSpend } from "@/lib/subscriptionDetector";

/**
 * GET /api/subscriptions
 * Get all active subscriptions for the current user
 */
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

    // Get all subscriptions
    const subscriptions = await Subscription.find({
      userId: user._id,
      isActive: true,
    }).sort({ lastChargedDate: -1 });

    // Calculate total monthly and yearly spend
    const monthlySpend = await calculateSubscriptionSpend(
      user._id.toString(),
      "monthly",
    );
    const yearlySpend = await calculateSubscriptionSpend(
      user._id.toString(),
      "yearly",
    );

    return NextResponse.json({
      subscriptions,
      summary: {
        totalActive: subscriptions.length,
        monthlySpend,
        yearlySpend,
      },
    });
  } catch (error: any) {
    console.error("Error fetching subscriptions:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscriptions", details: error.message },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/subscriptions/[id]
 * Update subscription (e.g., mark as inactive)
 */
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { subscriptionId, isActive } = body;

    if (!subscriptionId) {
      return NextResponse.json(
        { error: "Subscription ID required" },
        { status: 400 },
      );
    }

    await connectToDatabase();

    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update subscription
    const subscription = await Subscription.findOneAndUpdate(
      { _id: subscriptionId, userId: user._id },
      { $set: { isActive: isActive !== undefined ? isActive : true } },
      { new: true },
    );

    if (!subscription) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      subscription,
    });
  } catch (error: any) {
    console.error("Error updating subscription:", error);
    return NextResponse.json(
      { error: "Failed to update subscription", details: error.message },
      { status: 500 },
    );
  }
}
