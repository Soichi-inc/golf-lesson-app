import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  "https://golf-lesson-app-mayumi.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "奥村真由美ゴルフレッスン | LPGA・TPI認定プロによる個人指導",
    template: "%s | 奥村真由美ゴルフレッスン",
  },
  description:
    "LPGA会員・TPI認定インストラクター奥村真由美プロによる個人ゴルフレッスン。横浜・東京を拠点に、身体の特性に合ったスイング作りをサポートします。",
  keywords: [
    "ゴルフレッスン",
    "奥村真由美",
    "LPGA",
    "TPI",
    "横浜",
    "東京",
    "プライベートレッスン",
    "ラウンドレッスン",
  ],
  authors: [{ name: "奥村 真由美" }],
  creator: "Soichi, Inc.",
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: APP_URL,
    siteName: "奥村真由美ゴルフレッスン",
    title: "奥村真由美ゴルフレッスン | LPGA・TPI認定プロによる個人指導",
    description:
      "LPGA会員・TPI認定インストラクター奥村真由美プロによる個人ゴルフレッスン。横浜・東京を拠点に、身体の特性に合ったスイング作りをサポートします。",
    images: [
      {
        url: "/og",
        width: 1200,
        height: 630,
        alt: "奥村真由美ゴルフレッスン",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "奥村真由美ゴルフレッスン",
    description:
      "LPGA会員・TPI認定インストラクターによる個人ゴルフレッスン。横浜・東京を拠点に、身体の特性に合ったスイング作りをサポートします。",
    images: ["/og"],
  },
  robots: {
    index: true,
    follow: true,
  },
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
        <GoogleAnalytics />
        {children}
      </body>
    </html>
  );
}
