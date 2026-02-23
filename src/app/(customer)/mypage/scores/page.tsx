import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { MyScoreSection } from "@/components/customer/mypage/MyScoreSection";

export const metadata: Metadata = { title: "ラウンドスコア" };

export default function MyScoresPage() {
  // 実装予定: Supabase から取得
  const scores: import("@/types").RoundScore[] = [];

  return (
    <main className="section-padding">
      <div className="content-container max-w-2xl">
        <div className="mb-6">
          <Link
            href="/mypage"
            className="inline-flex items-center gap-1 text-xs text-stone-400 hover:text-stone-600 transition-colors mb-4"
          >
            <ChevronLeft className="size-3.5" />
            マイページ
          </Link>
          <h1 className="text-xl font-light tracking-wide text-stone-800">ラウンドスコア</h1>
        </div>
        <MyScoreSection scores={scores} />
      </div>
    </main>
  );
}
