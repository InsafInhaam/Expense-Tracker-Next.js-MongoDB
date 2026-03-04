"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { getCurrencyOptions, getCurrencySymbol } from "@/lib/currencies";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updatingCurrency, setUpdatingCurrency] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    } else if (status === "authenticated" && session?.user?.email) {
      fetchUserProfile();
    }
  }, [status, session]);

  const fetchUserProfile = async () => {
    try {
      // Add cache busting
      const res = await fetch(`/api/profile?t=${Date.now()}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const upgradeToPremium = async () => {
    // TODO: Implement Stripe/payment integration
    alert("Premium upgrade coming soon!");
  };

  const connectGmail = async () => {
    try {
      const res = await fetch("/api/gmail/connect");
      if (res.ok) {
        const data = await res.json();
        // Redirect to Google OAuth
        window.location.href = data.authUrl;
      }
    } catch (error) {
      console.error("Failed to connect Gmail:", error);
      alert("Failed to initiate Gmail connection. Please try again.");
    }
  };

  const disconnectGmail = async () => {
    if (!confirm("Are you sure? This will disconnect Gmail sync.")) return;

    try {
      const res = await fetch("/api/profile/gmail/disconnect", {
        method: "POST",
      });
      if (res.ok) {
        setUser({ ...user, gmailConnected: false, gmailEmail: null });
      }
    } catch (error) {
      console.error("Failed to disconnect Gmail:", error);
    }
  };

  const handleCurrencyChange = async (newCurrency: string) => {
    setUpdatingCurrency(true);
    setSuccessMessage("");

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currency: newCurrency }),
        cache: "no-store",
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Update the user state with the response from server
        setUser({
          ...user,
          currency: data.currency || newCurrency,
        });
        setSuccessMessage(`✓ Currency changed to ${data.currency}`);
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        console.error("Failed to update currency:", data);
        alert(data.error || "Failed to update currency. Please try again.");
      }
    } catch (error) {
      console.error("Failed to update currency:", error);
      alert("An error occurred while updating currency.");
    } finally {
      setUpdatingCurrency(false);
    }
  };

  // TODO: Comment this out for production - for testing only
  const triggerGmailSync = async () => {
    setSyncing(true);
    setSyncMessage("");

    try {
      const res = await fetch("/api/gmail/sync-now", {
        method: "POST",
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSyncMessage(
          `✓ Sync complete! Processed: ${data.results.emailsProcessed}, Saved: ${data.results.transactionsSaved}, Subscriptions: ${data.results.subscriptionsDetected}`,
        );
        setTimeout(() => setSyncMessage(""), 5000);
      } else {
        setSyncMessage(`❌ Sync failed: ${data.error || "Unknown error"}`);
        setTimeout(() => setSyncMessage(""), 5000);
      }
    } catch (error) {
      console.error("Sync failed:", error);
      setSyncMessage("❌ An error occurred during sync");
      setTimeout(() => setSyncMessage(""), 5000);
    } finally {
      setSyncing(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-apple-gray-50 to-white flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-apple-gray-200 border-t-apple-gray-800 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const monthlyUsagePercent = Math.min(
    100,
    ((user.aiUsage?.monthlyTokensUsed || 0) /
      (user.plan === "PREMIUM" ? 30000000 : 300000)) *
      100,
  );

  const dailyUsagePercent = Math.min(
    100,
    ((user.aiUsage?.dailyTokensUsed || 0) /
      (user.plan === "PREMIUM" ? 1000000 : 10000)) *
      100,
  );

  return (
    <div className="page-transition min-h-screen bg-gradient-to-b from-white via-apple-gray-50 to-white pb-24">
      {/* Header */}
      <header className="px-6 pt-12 pb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-semibold text-apple-gray-900">Lume</h1>
          <Link
            href="/dashboard"
            className="text-apple-gray-500 hover:text-apple-gray-700 text-sm font-medium transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 max-w-2xl mx-auto space-y-6 animate-fade-in">
        {/* User Info Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-apple-gray-100">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <h2 className="text-2xl font-semibold text-apple-gray-900 mb-1">
                {user.name}
              </h2>
              <p className="text-apple-gray-600 text-sm">{user.email}</p>
            </div>
            {user.image && (
              <Image
                src={user.image}
                alt={user.name}
                width={64}
                height={64}
                className="rounded-full object-cover border-4 border-apple-gray-50"
              />
            )}
          </div>

          {/* Plan Badge */}
          <div className="flex items-center gap-3 mb-6">
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                user.plan === "PREMIUM"
                  ? "bg-amber-100 text-amber-900"
                  : "bg-apple-gray-100 text-apple-gray-700"
              }`}
            >
              {user.plan === "PREMIUM" ? "✨ Premium" : "Free Plan"}
            </span>
            <span className="text-xs text-apple-gray-600">
              {user.plan === "PREMIUM"
                ? "Unlimited access"
                : "Limited AI parsing"}
            </span>
          </div>

          {/* Currency Selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-apple-gray-900">
              Default Currency
            </label>
            <div className="relative">
              <select
                value={user.currency || "USD"}
                onChange={(e) => handleCurrencyChange(e.target.value)}
                disabled={updatingCurrency}
                className="w-full px-3 py-2 bg-apple-gray-50 border border-apple-gray-200 rounded-lg text-sm text-apple-gray-900 hover:bg-apple-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {getCurrencyOptions().map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.symbol} {currency.name}
                  </option>
                ))}
              </select>
              {updatingCurrency && (
                <div className="absolute right-3 top-2.5">
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            {successMessage && (
              <div className="text-xs text-green-600 font-medium animate-fade-in">
                {successMessage}
              </div>
            )}
          </div>
        </div>

        {/* Upgrade CTA */}
        {user.plan !== "PREMIUM" && (
          <button
            onClick={upgradeToPremium}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-200"
          >
            Upgrade to Premium
          </button>
        )}

        {/* Monthly Usage */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-apple-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-apple-gray-900">
              Monthly AI Usage
            </h3>
            <span className="text-xs text-apple-gray-600">
              {getCurrencySymbol(user.currency || "USD")}
            </span>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-apple-gray-600 font-medium">
                Tokens Used
              </span>
              <span className="text-lg font-bold text-apple-gray-900">
                {(user.aiUsage?.monthlyTokensUsed || 0).toLocaleString()}
                {user.plan === "PREMIUM" ? (
                  <span className="text-xs font-normal text-apple-gray-600 ml-1">
                    / Unlimited
                  </span>
                ) : (
                  <span className="text-xs font-normal text-apple-gray-600 ml-1">
                    / {(300000).toLocaleString()}
                  </span>
                )}
              </span>
            </div>
            <div className="w-full bg-apple-gray-100 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-300"
                style={{ width: `${monthlyUsagePercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Daily Usage */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-apple-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-apple-gray-900">
              Daily AI Usage
            </h3>
            <span className="text-xs text-apple-gray-600">
              {getCurrencySymbol(user.currency || "USD")}
            </span>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-apple-gray-600 font-medium">
                Tokens Used Today
              </span>
              <span className="text-lg font-bold text-apple-gray-900">
                {(user.aiUsage?.dailyTokensUsed || 0).toLocaleString()}
                {user.plan === "PREMIUM" ? (
                  <span className="text-xs font-normal text-apple-gray-600 ml-1">
                    / Unlimited
                  </span>
                ) : (
                  <span className="text-xs font-normal text-apple-gray-600 ml-1">
                    / {(10000).toLocaleString()}
                  </span>
                )}
              </span>
            </div>
            <div className="w-full bg-apple-gray-100 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-300"
                style={{ width: `${dailyUsagePercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Connections */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-apple-gray-100">
          <h3 className="text-sm font-semibold text-apple-gray-900 mb-4">
            Connections
          </h3>
          <div className="flex items-center justify-between p-4 bg-apple-gray-50 rounded-xl hover:bg-apple-gray-100 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-lg">
                📧
              </div>
              <div>
                <p className="text-sm font-medium text-apple-gray-900">
                  Gmail Auto-Sync
                </p>
                <p className="text-xs text-apple-gray-600">
                  {user.gmailConnected
                    ? `Connected to ${user.gmailEmail}`
                    : "Automatically detect bills & subscriptions"}
                </p>
              </div>
            </div>
            {user.gmailConnected ? (
              <button
                onClick={disconnectGmail}
                className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
              >
                Disconnect
              </button>
            ) : (
              <button
                onClick={connectGmail}
                className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                Connect
              </button>
            )}
          </div>
        </div>

        {/* Manual Gmail Sync - FOR TESTING ONLY */}
        {user.gmailConnected && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="text-sm font-semibold text-blue-900">
                  📊 Test Gmail Sync
                </h3>
                <p className="text-xs text-blue-700 mt-1">
                  Manually trigger email sync to test subscription detection
                </p>
              </div>
            </div>
            <button
              onClick={triggerGmailSync}
              disabled={syncing}
              className="mt-4 w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {syncing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Syncing...
                </>
              ) : (
                "▶ Trigger Sync Now"
              )}
            </button>
            {syncMessage && (
              <div
                className={`text-xs mt-3 p-3 rounded-lg ${
                  syncMessage.includes("✓")
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {syncMessage}
              </div>
            )}
          </div>
        )}

        {/* Plan Features */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-apple-gray-100">
          <h3 className="text-sm font-semibold text-apple-gray-900 mb-4">
            Plan Features
          </h3>
          <div className="space-y-3">
            {/* Included Features */}
            <div className="space-y-2">
              {["30 AI parses per month", "Unlimited manual transactions"].map(
                (feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-green-600 text-sm leading-none mt-0.5">
                      ✓
                    </span>
                    <span className="text-sm text-apple-gray-700">
                      {feature}
                    </span>
                  </div>
                ),
              )}

              {user.plan === "FREE" && (
                <>
                  <div className="flex items-start gap-3 opacity-50">
                    <span className="text-apple-gray-400 text-sm leading-none mt-0.5">
                      ✕
                    </span>
                    <span className="text-sm text-apple-gray-600">
                      Real-time Gmail auto-detection
                    </span>
                  </div>
                  <div className="flex items-start gap-3 opacity-50">
                    <span className="text-apple-gray-400 text-sm leading-none mt-0.5">
                      ✕
                    </span>
                    <span className="text-sm text-apple-gray-600">
                      Smart financial insights
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Premium Features */}
            {user.plan === "PREMIUM" && (
              <div className="space-y-2 pt-3 border-t border-apple-gray-200">
                {[
                  "Unlimited AI parsing",
                  "Real-time Gmail auto-detection",
                  "Smart financial insights",
                ].map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-amber-600 text-sm leading-none mt-0.5">
                      ✨
                    </span>
                    <span className="text-sm text-apple-gray-700">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Danger Zone */}
        {user.gmailConnected && (
          <div className="bg-red-50 rounded-2xl p-6 border border-red-200">
            <h3 className="text-sm font-semibold text-red-900 mb-2">
              Danger Zone
            </h3>
            <p className="text-xs text-red-800 mb-4">
              Disconnect Gmail to stop automatic transaction detection.
            </p>
            <button
              onClick={disconnectGmail}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors duration-200"
            >
              Disconnect Gmail
            </button>
          </div>
        )}

        {/* Logout */}
        <div className="pt-4">
          <button
            onClick={() => signOut({ redirect: true, callbackUrl: "/" })}
            className="w-full py-2 text-apple-gray-600 hover:text-apple-gray-900 text-sm font-medium transition-colors"
          >
            Sign Out
          </button>
        </div>
      </main>
    </div>
  );
}
