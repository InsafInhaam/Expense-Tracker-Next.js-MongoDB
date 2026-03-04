import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userObject = user.toObject();

    const response = NextResponse.json({
      _id: userObject._id,
      name: userObject.name,
      email: userObject.email,
      image: userObject.image,
      plan: userObject.plan || "FREE",
      currency: userObject.currency || "USD",
      gmailConnected: userObject.gmailConnected || false,
      gmailEmail: userObject.gmailEmail,
      aiUsage: userObject.aiUsage || {
        dailyTokensUsed: 0,
        monthlyTokensUsed: 0,
        requestsThisMinute: 0,
        lastResetDaily: new Date(),
        lastResetMonthly: new Date(),
        lastRequestTime: new Date(),
      },
    });

    // Add cache control headers to prevent caching
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, max-age=0",
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");

    return response;
  } catch (error: any) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, currency } = body;

    console.log("📝 PATCH request body:", { name, currency });

    const updateData: any = {};

    if (name) {
      updateData.name = name;
    }

    if (currency) {
      updateData.currency = currency;
    }

    console.log("🔄 Update data to apply:", updateData);

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 },
      );
    }

    await connectToDatabase();

    console.log("🔐 Email from session:", session.user.email);
    console.log("📝 Trying to update with:", updateData);

    // Use explicit $set to ensure the field is updated even if it doesn't exist
    const user = await User.findOneAndUpdate(
      { email: session.user.email },
      { $set: updateData },
      { new: true, upsert: false },
    );

    console.log("✅ Updated user from DB:", {
      email: user?.email,
      currency: user?.currency,
      name: user?.name,
    });

    console.log("📋 Full user object:", user?.toObject?.() || user);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log("🎯 Final currency value to return:", user.currency);
    console.log("🎯 Currency type:", typeof user.currency);
    console.log("🎯 Currency is undefined?:", user.currency === undefined);
    console.log("🎯 Currency is null?:", user.currency === null);

    // Ensure we return the actual value from database
    const currencyToReturn = user.currency || "USD";
    console.log("🎯 Currency to return in response:", currencyToReturn);

    const responsePayload = {
      success: true,
      name: user.name,
      email: user.email,
      currency: currencyToReturn,
      message: "Profile updated successfully",
    };

    console.log("📤 Response payload:", responsePayload);

    const response = NextResponse.json(responsePayload);

    // Add cache control headers to prevent caching
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, max-age=0",
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");

    return response;
  } catch (error: any) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile", details: error.message },
      { status: 500 },
    );
  }
}
