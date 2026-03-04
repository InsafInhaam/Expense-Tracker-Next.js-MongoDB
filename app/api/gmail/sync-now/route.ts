import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import { syncGmailTransactions } from "@/lib/gmailSync";
import { detectSubscriptions } from "@/lib/subscriptionDetector";

/**
 * POST /api/gmail/sync-now
 * Manually trigger Gmail sync for current user
 * Used for testing - can be triggered from Profile page button
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const user = await User.findOne({ email: session.user.email }).select(
      "+gmailAccessToken +gmailRefreshToken",
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log("📋 Checking Gmail connection for:", user.email);
    console.log("🔐 Token Status:", {
      gmailConnected: user.gmailConnected,
      hasAccessToken: !!user.gmailAccessToken,
      hasRefreshToken: !!user.gmailRefreshToken,
      tokenExpiryDate: user.gmailTokenExpiry?.toISOString(),
    });

    if (!user.gmailConnected) {
      return NextResponse.json(
        { error: "Gmail not connected" },
        { status: 400 },
      );
    }

    if (!user.gmailAccessToken || !user.gmailRefreshToken) {
      return NextResponse.json(
        {
          error: "Gmail tokens missing",
          details: "Please reconnect Gmail in profile settings",
        },
        { status: 400 },
      );
    }

    console.log("🔄 Manual Gmail sync triggered for:", user.email);

    // Update sync status to in-progress
    await User.findByIdAndUpdate(user._id, {
      $set: { "gmailSyncState.lastSyncStatus": "in-progress" },
    });

    try {
      // 1. Sync Gmail
      const syncResult = await syncGmailTransactions(user._id.toString());

      console.log(
        `✅ Synced ${syncResult.processedCount} emails, saved ${syncResult.savedCount} transactions`,
      );

      // 2. Detect subscriptions
      const subscriptionCount = await detectSubscriptions(user._id.toString());

      console.log(`✅ Detected ${subscriptionCount} subscription patterns`);

      return NextResponse.json({
        success: true,
        message: "Manual sync completed successfully",
        results: {
          emailsProcessed: syncResult.processedCount,
          transactionsSaved: syncResult.savedCount,
          subscriptionsDetected: subscriptionCount,
        },
      });
    } catch (syncError: any) {
      console.error("Sync error:", syncError.message);

      // Update error status
      await User.findByIdAndUpdate(user._id, {
        $set: {
          "gmailSyncState.lastSyncStatus": "error",
          "gmailSyncState.lastSyncError": syncError.message,
        },
      });

      throw syncError;
    }
  } catch (error: any) {
    console.error("Error in manual Gmail sync:", error);
    return NextResponse.json(
      {
        error: "Manual sync failed",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
