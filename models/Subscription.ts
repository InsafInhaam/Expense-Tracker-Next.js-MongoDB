import mongoose, { Schema, model, models, Document } from "mongoose";

export type BillingCycle = "weekly" | "monthly" | "quarterly" | "yearly";

export interface ISubscription extends Document {
  userId: mongoose.Types.ObjectId;
  merchantName: string;
  normalizedMerchant: string; // Lowercase version for deduplication
  averageAmount: number;
  currency: string;
  billingCycle: BillingCycle;
  lastChargedDate: Date;
  nextExpectedDate?: Date;
  totalSpent: number;
  transactionCount: number;
  isActive: boolean;
  confidence: number; // 0-100, based on pattern detection
  detectedAt: Date;
  relatedTransactionIds: mongoose.Types.ObjectId[];
  category: string; // e.g., "Entertainment", "Software", "Bills & Utilities"
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    merchantName: { type: String, required: true },
    normalizedMerchant: { type: String, required: true, lowercase: true },
    averageAmount: { type: Number, required: true },
    currency: { type: String, default: "USD" },
    billingCycle: {
      type: String,
      enum: ["weekly", "monthly", "quarterly", "yearly"],
      required: true,
    },
    lastChargedDate: { type: Date, required: true },
    nextExpectedDate: { type: Date },
    totalSpent: { type: Number, default: 0 },
    transactionCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    confidence: { type: Number, default: 0, min: 0, max: 100 },
    detectedAt: { type: Date, default: Date.now },
    relatedTransactionIds: [
      { type: Schema.Types.ObjectId, ref: "Transaction" },
    ],
    category: { type: String, default: "Subscription" },
    notes: { type: String },
  },
  {
    timestamps: true,
  },
);

// Compound index for user + normalized merchant (prevent duplicates)
SubscriptionSchema.index(
  { userId: 1, normalizedMerchant: 1 },
  { unique: true },
);

// Index for querying active subscriptions
SubscriptionSchema.index({ userId: 1, isActive: 1 });

const Subscription =
  models.Subscription ||
  model<ISubscription>("Subscription", SubscriptionSchema);

export default Subscription;
