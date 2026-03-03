import mongoose, { Schema, model, models } from "mongoose";

export interface IUser {
  name: string;
  email: string;
  image?: string;
  emailVerified?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    image: { type: String },
    emailVerified: { type: Date, default: null },
  },
  {
    timestamps: true,
  },
);

const User = models.User || model<IUser>("User", UserSchema);

export default User;
