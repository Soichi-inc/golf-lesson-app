import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, Flag, BookOpen, ChevronRight, Dumbbell } from "lucide-react";

export const metadata: Metadata = { title: "マイページ" };

export default function MyPage() {
  const menuItems = [
    {
      href: "/mypage/reservations",
      icon: CalendarDays,
      label: "予約履歴",
      description: "予約のリクエスト・確認・キャンセル",
    },
    {
      href: "/mypage/scores",
      icon: Flag,
      label: "ラウンドスコア",
      description: "スコアの記録・振り返り",
    },
    {
      href: "/mypage/notes",
      icon: BookOpen,
      label: "ミスの傾向ノート",
      description: "課題・気づきのメモ",
    },
    {
      href: "/mypage/drills",
      icon: Dumbbell,
      label: "練習ドリル",
      description: "講師から処方されたドリル",
    },
  ];

  return (
    <main className="section-padding">
      <div className="content-container max-w-lg">
        <div className="mb-8 text-center">
          <p className="mb-2 text-[11px] tracking-[0.3em] text-stone-400 uppercase">My Page</p>
          <h1 className="text-2xl font-light tracking-wide text-stone-800">マイページ</h1>
        </div>
        <ul className="flex flex-col gap-3">
          {menuItems.map(({ href, icon: Icon, label, description }) => (
            <li key={href}>
              <Link
                href={href}
                className="flex items-center gap-4 rounded-2xl bg-white p-5 ring-1 ring-stone-100 shadow-sm hover:ring-stone-300 transition-all group"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-stone-100 group-hover:bg-stone-200 transition-colors">
                  <Icon className="size-4.5 text-stone-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-stone-800 text-sm">{label}</p>
                  <p className="text-xs text-stone-400 mt-0.5">{description}</p>
                </div>
                <ChevronRight className="size-4 text-stone-300 group-hover:text-stone-500 transition-colors" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
