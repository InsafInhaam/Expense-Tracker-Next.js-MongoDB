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

export interface IGmailSyncState {
  lastSyncAt?: Date;
  processedMessageIds: string[]; // Gmail message IDs to prevent duplicates
  totalEmailsProcessed: number;
  lastSyncStatus?: "success" | "error" | "in-progress";
  lastSyncError?: string;
}

export interface IUser {
  name: string;
  email: string;
  image?: string;
  emailVerified?: Date | null;
  plan: UserPlan;
  gmailConnected: boolean;
  gmailEmail?: string;
  gmailAccessToken?: string; // Encrypted OAuth access token
  gmailRefreshToken?: string; // Encrypted OAuth refresh token
  gmailTokenExpiry?: Date;
  gmailSyncState: IGmailSyncState;
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

const GmailSyncStateSchema = new Schema<IGmailSyncState>(
  {
    lastSyncAt: { type: Date },
    processedMessageIds: { type: [String], default: [] },
    totalEmailsProcessed: { type: Number, default: 0 },
    lastSyncStatus: {
      type: String,
      enum: ["success", "error", "in-progress"],
    },
    lastSyncError: { type: String },
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
    gmailAccessToken: { type: String, select: false }, // Encrypted, not returned by default
    gmailRefreshToken: { type: String, select: false }, // Encrypted, not returned by default
    gmailTokenExpiry: { type: Date },
    gmailSyncState: { type: GmailSyncStateSchema, default: () => ({}) },
    currency: { type: String, default: "USD" },
    aiUsage: { type: AIUsageSchema, default: () => ({}) },
  },
  {
    timestamps: true,
  },
);

const User = models.User || model<IUser>("User", UserSchema);

export default User;
