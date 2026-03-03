import { Geist } from "next/font/google";
import "./globals.css";
import type { Metadata } from "next";
import Providers from "@/components/Providers";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Finance - Simple Money Tracking",
  description: "Beautiful, minimal finance tracker with a native iOS feel",
  manifest: "/manifest.json",
  themeColor: "#ffffff",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Finance",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} antialiased bg-white`}>
        <Providers>
          {children}
          <ServiceWorkerRegistration />
        </Providers>
      </body>
    </html>
  );
}
