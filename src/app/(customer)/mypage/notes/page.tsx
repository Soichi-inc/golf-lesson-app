import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { MyNoteSection } from "@/components/customer/mypage/MyNoteSection";

export const metadata: Metadata = { title: "ミスの傾向ノート" };

export default function MyNotesPage() {
  // 実装予定: Supabase から取得
  const notes: import("@/types").UserNote[] = [];

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
          <h1 className="text-xl font-light tracking-wide text-stone-800">ミスの傾向ノート</h1>
        </div>
        <MyNoteSection notes={notes} />
      </div>
    </main>
  );
}
