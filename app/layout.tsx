import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { MobileMenu } from "@/components/MobileMenu";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Voyage - 航海計画アプリ",
  description: "AIによる柔軟な計画管理で人生の航海をサポート",
  manifest: "/manifest.json",
  themeColor: "#000000",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ServiceWorkerRegister />
        <nav className="border-b relative">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <a href="/" className="text-xl font-bold">
                🚢 Voyage
              </a>
              <div className="hidden md:flex gap-4">
                <a href="/" className="hover:text-primary">ダッシュボード</a>
                <a href="/goals" className="hover:text-primary">目標</a>
                <a href="/timeline" className="hover:text-primary">タイムライン</a>
                <a href="/review" className="hover:text-primary">レビュー</a>
                <a href="/settings" className="hover:text-primary">設定</a>
              </div>
              <MobileMenu />
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
