import mongoose, { Schema, model, models } from "mongoose";

export interface ITransaction {
  userId: mongoose.Types.ObjectId;
  type: "income" | "expense";
  amount: number;
  category: string;
  note?: string;
  date: Date;
  source: "manual" | "import" | "recurring" | "voice" | "receipt" | "email";
  imageUrl?: string;
  merchant?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["income", "expense"], required: true },
    amount: { type: Number, required: true, min: 0 },
    category: { type: String, required: true },
    note: { type: String },
    date: { type: Date, required: true, default: Date.now },
    source: {
      type: String,
      enum: ["manual", "import", "recurring", "voice", "receipt", "email"],
      default: "manual",
      required: true,
    },
    imageUrl: { type: String },
    merchant: { type: String },
  },
  {
    timestamps: true,
  },
);

TransactionSchema.index({ userId: 1, date: -1 });

const Transaction =
  models.Transaction || model<ITransaction>("Transaction", TransactionSchema);

export default Transaction;
