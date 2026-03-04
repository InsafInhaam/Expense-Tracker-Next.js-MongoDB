import connectToDatabase from "@/lib/mongodb";
import User, { UserPlan } from "@/models/User";

// Rate limits per plan
const RATE_LIMITS = {
  FREE: {
    dailyTokens: 10000, // ~30 AI parses per month (10k tokens/day * 30 days)
    monthlyTokens: 300000,
    requestsPerMinute: 5,
  },
  PREMIUM: {
    dailyTokens: 1000000,
    monthlyTokens: 30000000,
    requestsPerMinute: 60,
  },
};

// AI Parse limits (number of parses, not tokens)
export const AI_PARSE_LIMITS = {
  FREE: {
    dailyParses: 1, // 1 parse per day for free tier
    monthlyParses: 30,
    gmailSyncsPerDay: 1,
  },
  PREMIUM: {
    dailyParses: 1000,
    monthlyParses: Infinity,
    gmailSyncsPerDay: 10,
  },
};

export interface RateLimitStatus {
  allowed: boolean;
  reason?: string;
  tokensUsedToday: number;
  tokensUsedThisMonth: number;
  dailyLimit: number;
  monthlyLimit: number;
  requestsThisMinute: number;
  requestLimitPerMinute: number;
}

export async function checkAIRateLimit(
  userEmail: string,
  estimatedTokens: number = 0,
): Promise<RateLimitStatus> {
  try {
    await connectToDatabase();

    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return {
        allowed: false,
        reason: "User not found",
        tokensUsedToday: 0,
        tokensUsedThisMonth: 0,
        dailyLimit: 0,
        monthlyLimit: 0,
        requestsThisMinute: 0,
        requestLimitPerMinute: 0,
      };
    }

    const plan = (user.plan || "FREE") as UserPlan;
    const limits = RATE_LIMITS[plan];

    // Ensure aiUsage exists
    if (!user.aiUsage) {
      user.aiUsage = {
        dailyTokensUsed: 0,
        monthlyTokensUsed: 0,
        requestsThisMinute: 0,
        lastResetDaily: new Date(),
        lastResetMonthly: new Date(),
        lastRequestTime: new Date(),
      };
    }

    // Check if we need to reset daily counter
    const now = new Date();
    const lastResetDaily = new Date(user.aiUsage.lastResetDaily);
    const daysSinceReset = Math.floor(
      (now.getTime() - lastResetDaily.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysSinceReset >= 1) {
      user.aiUsage.dailyTokensUsed = 0;
      user.aiUsage.lastResetDaily = now;
    }

    // Check if we need to reset monthly counter
    const lastResetMonthly = new Date(user.aiUsage.lastResetMonthly);
    const monthsSinceReset =
      (now.getFullYear() - lastResetMonthly.getFullYear()) * 12 +
      (now.getMonth() - lastResetMonthly.getMonth());

    if (monthsSinceReset >= 1) {
      user.aiUsage.monthlyTokensUsed = 0;
      user.aiUsage.lastResetMonthly = now;
    }

    // Reset per-minute counter if needed
    const lastRequestTime = new Date(user.aiUsage.lastRequestTime);
    const secondsSinceLastRequest = Math.floor(
      (now.getTime() - lastRequestTime.getTime()) / 1000,
    );

    if (secondsSinceLastRequest >= 60) {
      user.aiUsage.requestsThisMinute = 0;
    }

    // Check limits
    const dailyAllowed =
      user.aiUsage.dailyTokensUsed + estimatedTokens <= limits.dailyTokens;
    const monthlyAllowed =
      user.aiUsage.monthlyTokensUsed + estimatedTokens <= limits.monthlyTokens;
    const requestsAllowed =
      user.aiUsage.requestsThisMinute < limits.requestsPerMinute;

    const allowed = dailyAllowed && monthlyAllowed && requestsAllowed;

    // Save only if we made changes
    if (daysSinceReset >= 1 || monthsSinceReset >= 1) {
      await user.save();
    }

    return {
      allowed,
      reason: !dailyAllowed
        ? "Daily token limit exceeded"
        : !monthlyAllowed
          ? "Monthly token limit exceeded"
          : !requestsAllowed
            ? "Too many requests per minute"
            : undefined,
      tokensUsedToday: user.aiUsage.dailyTokensUsed,
      tokensUsedThisMonth: user.aiUsage.monthlyTokensUsed,
      dailyLimit: limits.dailyTokens,
      monthlyLimit: limits.monthlyTokens,
      requestsThisMinute: user.aiUsage.requestsThisMinute,
      requestLimitPerMinute: limits.requestsPerMinute,
    };
  } catch (error) {
    console.error("Rate limit check error:", error);
    // Fail open - allow request if we can't check (better UX)
    return {
      allowed: true,
      tokensUsedToday: 0,
      tokensUsedThisMonth: 0,
      dailyLimit: 10000,
      monthlyLimit: 300000,
      requestsThisMinute: 0,
      requestLimitPerMinute: 5,
    };
  }
}

export async function recordAIUsage(
  userEmail: string,
  tokensUsed: number,
): Promise<void> {
  try {
    await connectToDatabase();

    const user = await User.findOne({ email: userEmail });
    if (!user) return;

    if (!user.aiUsage) {
      user.aiUsage = {
        dailyTokensUsed: 0,
        monthlyTokensUsed: 0,
        requestsThisMinute: 0,
        lastResetDaily: new Date(),
        lastResetMonthly: new Date(),
        lastRequestTime: new Date(),
      };
    }

    user.aiUsage.dailyTokensUsed += tokensUsed;
    user.aiUsage.monthlyTokensUsed += tokensUsed;
    user.aiUsage.requestsThisMinute += 1;
    user.aiUsage.lastRequestTime = new Date();

    await user.save();
  } catch (error) {
    console.error("Recording AI usage failed:", error);
    // Silently fail - don't crash the request
  }
}

export async function checkPremiumFeature(
  userEmail: string,
  feature: "unlimited_ai_parsing" | "gmail_auto_sync" | "advanced_analytics",
): Promise<boolean> {
  try {
    await connectToDatabase();

    const user = await User.findOne({ email: userEmail });
    if (!user) return false;

    const isPremium = user.plan === "PREMIUM";

    // Define which features are premium-only
    const premiumFeatures = {
      unlimited_ai_parsing: isPremium,
      gmail_auto_sync: isPremium,
      advanced_analytics: isPremium,
    };

    return premiumFeatures[feature] || false;
  } catch (error) {
    console.error("Premium feature check error:", error);
    return false;
  }
}
