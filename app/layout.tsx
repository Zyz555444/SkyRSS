import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";
import "./animations.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SkyRSS",
  description: "在浏览器里管理订阅、阅读条目的 SkyRSS 阅读器。",
  applicationName: "SkyRSS",
  icons: {
    icon: [{ url: "/brand/skyrss-icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/brand/skyrss-icon.svg", type: "image/svg+xml" }],
  },
  openGraph: {
    title: "SkyRSS",
    description: "在浏览器里管理订阅、阅读条目的 SkyRSS 阅读器。",
    images: [{ url: "/brand/skyrss-logo.svg", width: 200, height: 100 }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} flex h-dvh flex-col overflow-hidden antialiased`}
    >
      <body className="flex min-h-0 flex-1 flex-col overflow-hidden font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
