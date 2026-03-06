import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { SessionProvider } from "next-auth/react";
import { FloatingLogoutButton } from "@/components/FloatingLogoutButton";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Loohcs志塾立川・吉祥寺校舎予約ページ",
  description: "生徒と講師のための授業予約管理システム",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (navigator.userAgent.toLowerCase().indexOf("line") !== -1 && window.location.search.indexOf("openExternalBrowser=1") === -1) {
                var targetUrl = window.location.href;
                var nextUrl = targetUrl + (targetUrl.indexOf("?") === -1 ? "?" : "&") + "openExternalBrowser=1";
                window.location.replace(nextUrl);
              }
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        <SessionProvider>
          {children}
          <FloatingLogoutButton />
        </SessionProvider>
      </body>
    </html>
  );
}
