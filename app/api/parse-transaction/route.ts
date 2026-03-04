import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkAIRateLimit } from "@/lib/aiRateLimiter";
import { createJob } from "@/lib/jobQueue";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { text } = await request.json();

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    // Check rate limit (estimate ~150 tokens per parse)
    const rateLimit = await checkAIRateLimit(session.user.email, 150);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          reason: rateLimit.reason,
          upgrade: true,
          usage: {
            todayTokens: rateLimit.tokensUsedToday,
            todayLimit: rateLimit.dailyLimit,
            monthTokens: rateLimit.tokensUsedThisMonth,
            monthLimit: rateLimit.monthlyLimit,
          },
        },
        { status: 429 },
      );
    }

    // Get user ID
    await connectToDatabase();
    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create background job for async processing
    const jobId = await createJob({
      userId: user._id.toString(),
      userEmail: session.user.email,
      type: "parse_transaction",
      data: { text },
    });

    return NextResponse.json({
      success: true,
      jobId,
      message: "Parsing in background...",
    });
  } catch (error: any) {
    console.error("Parse transaction error:", error);
    return NextResponse.json(
      {
        error: "Failed to parse transaction",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
