import connectToDatabase from "./mongodb";
import Transaction from "@/models/Transaction";
import Subscription, { BillingCycle } from "@/models/Subscription";

interface RecurringPattern {
  merchantName: string;
  transactions: any[];
  averageAmount: number;
  averageDaysBetween: number;
  confidence: number;
  billingCycle: BillingCycle;
}

/**
 * Normalizes merchant name for comparison
 */
function normalizeMerchantName(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
}

/**
 * Determines billing cycle from average days between charges
 */
function determineBillingCycle(avgDays: number): BillingCycle {
  if (avgDays >= 335 && avgDays <= 395) return "yearly"; // ~365 days
  if (avgDays >= 80 && avgDays <= 100) return "quarterly"; // ~90 days
  if (avgDays >= 25 && avgDays <= 35) return "monthly"; // ~30 days
  if (avgDays >= 5 && avgDays <= 9) return "weekly"; // ~7 days
  return "monthly"; // Default
}

/**
 * Calculate confidence score based on pattern regularity
 */
function calculateConfidence(
  transactions: any[],
  avgAmount: number,
  avgDays: number,
): number {
  let confidence = 0;

  // More transactions = higher confidence
  if (transactions.length >= 3) confidence += 40;
  else if (transactions.length === 2) confidence += 20;

  // Consistent amounts = higher confidence
  const amountVariance =
    transactions.reduce((sum, t) => sum + Math.abs(t.amount - avgAmount), 0) /
    transactions.length;
  const amountConsistency = 1 - amountVariance / avgAmount;
  confidence += Math.min(amountConsistency * 30, 30);

  // Regular intervals = higher confidence
  if (avgDays >= 25 && avgDays <= 35)
    confidence += 30; // Monthly pattern
  else if (avgDays >= 5 && avgDays <= 9)
    confidence += 25; // Weekly pattern
  else if (avgDays >= 335 && avgDays <= 395)
    confidence += 30; // Yearly pattern
  else confidence += 10;

  return Math.min(Math.round(confidence), 100);
}

/**
 * Extracts merchant name from transaction note
 */
function extractMerchantName(note: string): string {
  // Look for "From MERCHANT_NAME" pattern
  const fromMatch = note.match(/From\s+([^(]+)/i);
  if (fromMatch) {
    return fromMatch[1].trim();
  }

  // Fallback: use first part of note
  return note.split("(")[0].split("-")[0].trim();
}

/**
 * Detects recurring subscription patterns in user's transactions
 */
export async function detectSubscriptions(userId: string): Promise<number> {
  try {
    await connectToDatabase();

    console.log("🔍 Detecting subscriptions for user:", userId);

    // Get all expense transactions for the user (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const transactions = await Transaction.find({
      userId,
      type: "expense",
      date: { $gte: twelveMonthsAgo },
    }).sort({ date: -1 });

    console.log(`📊 Analyzing ${transactions.length} transactions`);

    // Group transactions by normalized merchant name
    const merchantGroups = new Map<string, any[]>();

    for (const transaction of transactions) {
      const merchantName = extractMerchantName(
        transaction.note || transaction.category,
      );
      const normalized = normalizeMerchantName(merchantName);

      if (!merchantGroups.has(normalized)) {
        merchantGroups.set(normalized, []);
      }
      merchantGroups.get(normalized)!.push(transaction);
    }

    // Analyze each merchant for recurring patterns
    const patterns: RecurringPattern[] = [];

    for (const [normalized, txs] of merchantGroups.entries()) {
      if (txs.length < 2) continue; // Need at least 2 transactions

      // Sort by date
      txs.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );

      // Calculate average amount
      const avgAmount = txs.reduce((sum, t) => sum + t.amount, 0) / txs.length;

      // Calculate days between transactions
      const daysBetween: number[] = [];
      for (let i = 1; i < txs.length; i++) {
        const days = Math.round(
          (new Date(txs[i].date).getTime() -
            new Date(txs[i - 1].date).getTime()) /
            (1000 * 60 * 60 * 24),
        );
        daysBetween.push(days);
      }

      const avgDays =
        daysBetween.reduce((sum, d) => sum + d, 0) / daysBetween.length;

      // Only consider if pattern seems regular (within expected ranges)
      if (
        (avgDays >= 5 && avgDays <= 9) || // Weekly
        (avgDays >= 25 && avgDays <= 35) || // Monthly
        (avgDays >= 80 && avgDays <= 100) || // Quarterly
        (avgDays >= 335 && avgDays <= 395) // Yearly
      ) {
        const merchantName = extractMerchantName(
          txs[0].note || txs[0].category,
        );
        const confidence = calculateConfidence(txs, avgAmount, avgDays);
        const billingCycle = determineBillingCycle(avgDays);

        patterns.push({
          merchantName,
          transactions: txs,
          averageAmount: avgAmount,
          averageDaysBetween: avgDays,
          confidence,
          billingCycle,
        });

        console.log(
          `✅ Found pattern: ${merchantName} - ${billingCycle} (${txs.length} txs, ${confidence}% confidence)`,
        );
      }
    }

    // Save or update subscriptions
    let savedCount = 0;

    for (const pattern of patterns) {
      if (pattern.confidence < 60) {
        console.log(
          `⏭️  Skipping low confidence pattern: ${pattern.merchantName}`,
        );
        continue; // Skip low confidence patterns
      }

      const normalized = normalizeMerchantName(pattern.merchantName);

      // Check if subscription already exists
      const existing = await Subscription.findOne({
        userId,
        normalizedMerchant: normalized,
      });

      const latestTx = pattern.transactions[pattern.transactions.length - 1];
      const totalSpent = pattern.transactions.reduce(
        (sum, t) => sum + t.amount,
        0,
      );

      if (existing) {
        // Update existing subscription
        await Subscription.findByIdAndUpdate(existing._id, {
          $set: {
            averageAmount: pattern.averageAmount,
            billingCycle: pattern.billingCycle,
            lastChargedDate: latestTx.date,
            totalSpent: totalSpent,
            transactionCount: pattern.transactions.length,
            confidence: pattern.confidence,
            isActive: true,
          },
          $addToSet: {
            relatedTransactionIds: {
              $each: pattern.transactions.map((t) => t._id),
            },
          },
        });

        console.log(`🔄 Updated subscription: ${pattern.merchantName}`);
      } else {
        // Create new subscription
        const subscription = new Subscription({
          userId,
          merchantName: pattern.merchantName,
          normalizedMerchant: normalized,
          averageAmount: pattern.averageAmount,
          currency: "USD", // TODO: Get from user preference
          billingCycle: pattern.billingCycle,
          lastChargedDate: latestTx.date,
          totalSpent: totalSpent,
          transactionCount: pattern.transactions.length,
          confidence: pattern.confidence,
          relatedTransactionIds: pattern.transactions.map((t) => t._id),
          category: latestTx.category || "Subscription",
          isActive: true,
        });

        await subscription.save();
        savedCount++;

        console.log(`💾 Saved new subscription: ${pattern.merchantName}`);
      }
    }

    console.log(
      `✅ Subscription detection complete: ${savedCount} new, ${patterns.length - savedCount} updated`,
    );

    return patterns.length;
  } catch (error) {
    console.error("Error detecting subscriptions:", error);
    throw error;
  }
}

/**
 * Gets total subscription spend for a user
 */
export async function calculateSubscriptionSpend(
  userId: string,
  period: "monthly" | "yearly" = "monthly",
): Promise<number> {
  await connectToDatabase();

  const subscriptions = await Subscription.find({
    userId,
    isActive: true,
  });

  let totalSpend = 0;

  for (const sub of subscriptions) {
    // Convert all to monthly equivalent
    let monthlyAmount = sub.averageAmount;

    switch (sub.billingCycle) {
      case "weekly":
        monthlyAmount = sub.averageAmount * 4.33; // Average weeks per month
        break;
      case "quarterly":
        monthlyAmount = sub.averageAmount / 3;
        break;
      case "yearly":
        monthlyAmount = sub.averageAmount / 12;
        break;
    }

    if (period === "yearly") {
      totalSpend += monthlyAmount * 12;
    } else {
      totalSpend += monthlyAmount;
    }
  }

  return Math.round(totalSpend * 100) / 100;
}
