import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getGmailAuthUrl } from "@/lib/gmailService";

/**
 * GET /api/gmail/connect
 * Initiates Gmail OAuth flow
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Generate OAuth URL
    const authUrl = getGmailAuthUrl();

    return NextResponse.json({ authUrl });
  } catch (error: any) {
    console.error("Error generating Gmail auth URL:", error);
    return NextResponse.json(
      { error: "Failed to initiate Gmail connection", details: error.message },
      { status: 500 },
    );
  }
}
