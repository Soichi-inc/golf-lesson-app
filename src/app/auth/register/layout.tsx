import type { Metadata } from "next";

// 新規登録ページ本体は画面操作のための部品（"use client"）なので、タイトルはここで設定する
export const metadata: Metadata = { title: "新規登録" };

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
