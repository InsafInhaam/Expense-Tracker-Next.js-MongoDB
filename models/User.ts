import mongoose, { Schema, model, models } from "mongoose";

export type UserPlan = "FREE" | "PREMIUM";

export interface IAIUsage {
  dailyTokensUsed: number;
  monthlyTokensUsed: number;
  requestsThisMinute: number;
  lastResetDaily: Date;
  lastResetMonthly: Date;
  lastRequestTime: Date;
}

export interface IUser {
  name: string;
  email: string;
  image?: string;
  emailVerified?: Date | null;
  plan: UserPlan;
  gmailConnected: boolean;
  gmailEmail?: string;
  aiUsage: IAIUsage;
  currency: string; // e.g., "USD", "LKR", "GBP", "EUR"
  createdAt: Date;
  updatedAt: Date;
}

const AIUsageSchema = new Schema<IAIUsage>(
  {
    dailyTokensUsed: { type: Number, default: 0 },
    monthlyTokensUsed: { type: Number, default: 0 },
    requestsThisMinute: { type: Number, default: 0 },
    lastResetDaily: { type: Date, default: Date.now },
    lastResetMonthly: { type: Date, default: Date.now },
    lastRequestTime: { type: Date, default: Date.now },
  },
  { _id: false },
);

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    image: { type: String },
    emailVerified: { type: Date, default: null },
    plan: { type: String, enum: ["FREE", "PREMIUM"], default: "FREE" },
    gmailConnected: { type: Boolean, default: false },
    gmailEmail: { type: String },
    currency: { type: String, default: "USD" },
    aiUsage: { type: AIUsageSchema, default: () => ({}) },
  },
  {
    timestamps: true,
  },
);

const User = models.User || model<IUser>("User", UserSchema);

export default User;
