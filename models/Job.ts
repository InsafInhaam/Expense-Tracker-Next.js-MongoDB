import mongoose, { Schema, model, models } from "mongoose";

export type JobType =
  | "parse_transaction"
  | "parse_receipt"
  | "email_transactions"
  | "classify_category";
export type JobStatus = "pending" | "processing" | "completed" | "failed";

export interface IJob {
  userId: string;
  userEmail: string;
  type: JobType;
  status: JobStatus;
  data: Record<string, any>;
  result?: Record<string, any>;
  error?: string;
  tokensUsed?: number;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

const JobSchema = new Schema<IJob>(
  {
    userId: { type: String, required: true },
    userEmail: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: [
        "parse_transaction",
        "parse_receipt",
        "email_transactions",
        "classify_category",
      ],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
      index: true,
    },
    data: { type: Schema.Types.Mixed, required: true },
    result: { type: Schema.Types.Mixed },
    error: { type: String },
    tokensUsed: { type: Number, default: 0 },
    completedAt: { type: Date },
  },
  {
    timestamps: true,
  },
);

// Clean index for getting pending jobs
JobSchema.index({ status: 1, createdAt: 1 });
JobSchema.index({ userEmail: 1, status: 1 });

const Job = models.Job || model<IJob>("Job", JobSchema);

export default Job;
