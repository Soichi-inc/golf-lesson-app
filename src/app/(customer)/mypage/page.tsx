import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, Flag, BookOpen, ChevronRight, Dumbbell } from "lucide-react";
import { mockReservations, mockRoundScores, mockUserNotes } from "@/lib/mock/data";

export const metadata: Metadata = { title: "マイページ" };

// モック: ログイン中のユーザーID
const ME = "user-1";

export default function MyPage() {
  const reservations = mockReservations.filter((r) => r.userId === ME);
  const upcoming = reservations.filter(
    (r) => r.status === "CONFIRMED" || r.status === "PENDING"
  );
  const scores = mockRoundScores.filter((s) => s.userId === ME);
  const notes = mockUserNotes.filter((n) => n.userId === ME);

  const menuItems = [
    {
      href: "/mypage/reservations",
      icon: CalendarDays,
      label: "予約履歴",
      description: `${reservations.length}件の予約`,
      badge: upcoming.length > 0 ? upcoming.length : null,
    },
    {
      href: "/mypage/scores",
      icon: Flag,
      label: "ラウンドスコア",
      description: `${scores.length}件のスコア`,
      badge: null,
    },
    {
      href: "/mypage/notes",
      icon: BookOpen,
      label: "ミスの傾向ノート",
      description: `${notes.length}件のメモ`,
      badge: null,
    },
    {
      href: "/mypage/drills",
      icon: Dumbbell,
      label: "練習ドリル",
      description: "講師から処方されたドリル",
      badge: null,
    },
  ];

  return (
    <main className="section-padding">
      <div className="content-container max-w-lg">
        <div className="mb-8 text-center">
          <p className="mb-2 text-[11px] tracking-[0.3em] text-stone-400 uppercase">My Page</p>
          <h1 className="text-2xl font-light tracking-wide text-stone-800">マイページ</h1>
        </div>

        {/* 直近の予約 */}
        {upcoming.length > 0 && (
          <div className="mb-6 rounded-2xl bg-stone-800 p-5 text-white">
            <p className="text-[11px] tracking-widest text-stone-400 uppercase mb-3">Next Lesson</p>
            {(() => {
              const next = [...upcoming].sort(
                (a, b) => a.schedule.startAt.getTime() - b.schedule.startAt.getTime()
              )[0];
              return (
                <div>
                  <p className="font-medium text-sm">{next.schedule.lessonPlan.name}</p>
                  <p className="text-stone-300 text-xs mt-1">
                    {next.schedule.startAt.toLocaleDateString("ja-JP", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      weekday: "short",
                    })}
                    &nbsp;
                    {next.schedule.startAt.toLocaleTimeString("ja-JP", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    &nbsp;–&nbsp;
                    {next.schedule.endAt.toLocaleTimeString("ja-JP", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              );
            })()}
          </div>
        )}

        {/* メニュー */}
        <ul className="flex flex-col gap-3">
          {menuItems.map(({ href, icon: Icon, label, description, badge }) => (
            <li key={href}>
              <Link
                href={href}
                className="flex items-center gap-4 rounded-2xl bg-white p-5 ring-1 ring-stone-100 shadow-sm hover:ring-stone-300 transition-all group"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-stone-100 group-hover:bg-stone-200 transition-colors">
                  <Icon className="size-4.5 text-stone-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-stone-800 text-sm">{label}</p>
                    {badge != null && (
                      <span className="flex size-5 items-center justify-center rounded-full bg-stone-800 text-white text-[10px] font-bold">
                        {badge}
                      </span>
                    )}
                  </div>
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
