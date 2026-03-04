import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import { syncGmailTransactions } from "@/lib/gmailSync";
import { detectSubscriptions } from "@/lib/subscriptionDetector";

/**
 * POST /api/cron/gmail-sync
 * Scheduled job to sync Gmail for all connected users
 *
 * Call this endpoint nightly via cron job (e.g., using Vercel Cron or external service)
 *
 * Example cron schedule:
 * - Vercel: Add to vercel.json -> "crons": [{"path": "/api/cron/gmail-sync", "schedule": "0 2 * * *"}]
 * - External: POST https://your-domain.com/api/cron/gmail-sync with Authorization header
 */
export async function POST(request: Request) {
  try {
    // Verify cron secret to prevent unauthorized calls
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid cron secret" },
        { status: 401 },
      );
    }

    console.log("🕐 Starting scheduled Gmail sync job...");

    await connectToDatabase();

    // Find all users with Gmail connected
    const users = await User.find({
      gmailConnected: true,
    }).select("_id email gmailSyncState");

    console.log(`👥 Found ${users.length} users with Gmail connected`);

    const results = {
      total: users.length,
      success: 0,
      failed: 0,
      errors: [] as any[],
    };

    // Sync each user's Gmail
    for (const user of users) {
      try {
        console.log(`\n📧 Processing user: ${user.email}`);

        // Skip if sync is already in progress
        if (user.gmailSyncState?.lastSyncStatus === "in-progress") {
          console.log("⏭️  Sync already in progress, skipping");
          continue;
        }

        // 1. Sync Gmail transactions
        const syncResult = await syncGmailTransactions(user._id.toString());
        console.log(
          `✅ Synced ${syncResult.processedCount} emails, saved ${syncResult.savedCount} transactions`,
        );

        // 2. Detect subscriptions (only if new transactions were saved)
        if (syncResult.savedCount > 0) {
          const subscriptionCount = await detectSubscriptions(
            user._id.toString(),
          );
          console.log(`✅ Detected ${subscriptionCount} subscription patterns`);
        }

        results.success++;

        // Rate limiting: wait between users to avoid hitting API limits
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error: any) {
        console.error(`❌ Error syncing user ${user.email}:`, error.message);
        results.failed++;
        results.errors.push({
          userId: user._id,
          email: user.email,
          error: error.message,
        });
      }
    }

    console.log("\n✅ Gmail sync job complete!");
    console.log(`Success: ${results.success}, Failed: ${results.failed}`);

    return NextResponse.json({
      success: true,
      message: "Gmail sync job completed",
      results,
    });
  } catch (error: any) {
    console.error("Fatal error in Gmail sync job:", error);
    return NextResponse.json(
      {
        error: "Gmail sync job failed",
        details: error.message,
      },
      { status: 500 },
    );
  }
}

/**
 * GET /api/cron/gmail-sync
 * Health check endpoint
 */
export async function GET(request: Request) {
  return NextResponse.json({
    status: "ready",
    message: "Gmail sync cron endpoint is operational",
    instructions:
      "POST to this endpoint with Authorization: Bearer <CRON_SECRET> to trigger sync",
  });
}
