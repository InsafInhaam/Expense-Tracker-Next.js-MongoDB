"use client";

import { signIn } from "next-auth/react";
import Image from "next/image";

export default function SignIn() {
  return (
    <div className="page-transition min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-apple-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-apple-gray-800 to-apple-gray-900 rounded-3xl mb-6 shadow-card">
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-4xl font-semibold text-apple-gray-900 mb-3">
            Lume
          </h1>
          <p className="text-apple-gray-500 text-lg">
            Simple, beautiful money tracking
          </p>
        </div>

        <div className="premium-card bg-white rounded-2xl shadow-card p-8 border border-apple-gray-100">
          <button
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            className="premium-button w-full flex items-center justify-center gap-3 bg-white border border-apple-gray-200 rounded-xl px-6 py-4 text-apple-gray-700 font-medium hover:bg-apple-gray-50 hover:border-apple-gray-300"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>

          <p className="text-center text-xs text-apple-gray-400 mt-6">
            By continuing, you agree to our Terms of Service
          </p>
        </div>

        <p className="text-center text-sm text-apple-gray-400 mt-8">
          Secure authentication with NextAuth
        </p>
      </div>
    </div>
  );
}
