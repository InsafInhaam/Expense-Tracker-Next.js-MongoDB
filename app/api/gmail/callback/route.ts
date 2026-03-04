import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getGmailTokensFromCode } from "@/lib/gmailService";
import { encrypt } from "@/lib/encryption";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";

/**
 * GET /api/gmail/callback
 * Handles Gmail OAuth callback
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      // Redirect to login if not authenticated
      return NextResponse.redirect(
        new URL("/auth/signin", process.env.NEXTAUTH_URL),
      );
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      console.error("Gmail OAuth error:", error);
      return NextResponse.redirect(
        new URL("/profile?gmail_error=" + error, process.env.NEXTAUTH_URL),
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL("/profile?gmail_error=no_code", process.env.NEXTAUTH_URL),
      );
    }

    // Exchange code for tokens
    const tokens = await getGmailTokensFromCode(code);

    // Encrypt tokens
    const encryptedAccessToken = encrypt(tokens.accessToken);
    const encryptedRefreshToken = encrypt(tokens.refreshToken);

    // Store tokens in database
    await connectToDatabase();

    await User.findOneAndUpdate(
      { email: session.user.email },
      {
        $set: {
          gmailConnected: true,
          gmailEmail: session.user.email,
          gmailAccessToken: encryptedAccessToken,
          gmailRefreshToken: encryptedRefreshToken,
          gmailTokenExpiry: tokens.expiry,
        },
      },
    );

    console.log("✅ Gmail connected successfully for:", session.user.email);

    // Redirect back to profile with success message
    return NextResponse.redirect(
      new URL("/profile?gmail_success=true", process.env.NEXTAUTH_URL),
    );
  } catch (error: any) {
    console.error("Error in Gmail callback:", error);
    return NextResponse.redirect(
      new URL(
        "/profile?gmail_error=connection_failed",
        process.env.NEXTAUTH_URL,
      ),
    );
  }
}
