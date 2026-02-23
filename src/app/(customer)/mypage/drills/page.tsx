import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, Dumbbell, CheckCircle2, Clock, Circle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { mockDrills } from "@/lib/mock/data";

export const metadata: Metadata = { title: "練習ドリル" };

const ME = "user-1";

const STATUS_MAP = {
  ASSIGNED:    { label: "未着手",   icon: Circle,       className: "bg-stone-100 text-stone-500 border-stone-200" },
  IN_PROGRESS: { label: "取り組み中", icon: Clock,        className: "bg-blue-50 text-blue-600 border-blue-200" },
  COMPLETED:   { label: "完了",     icon: CheckCircle2,  className: "bg-emerald-50 text-emerald-600 border-emerald-200" },
} as const;

export default function MyDrillsPage() {
  const drills = mockDrills.filter((d) => d.userId === ME);
  const active = drills.filter((d) => d.status !== "COMPLETED");
  const done   = drills.filter((d) => d.status === "COMPLETED");

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
          <h1 className="text-xl font-light tracking-wide text-stone-800">練習ドリル</h1>
          <p className="text-xs text-stone-400 mt-1">講師から処方された練習メニュー</p>
        </div>

        {drills.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-stone-200 py-14 text-center">
            <Dumbbell className="mb-3 size-10 text-stone-300" />
            <p className="text-sm text-stone-500">ドリルはまだありません</p>
            <p className="text-xs text-stone-400 mt-1">レッスン後に講師から処方されます</p>
          </div>
        ) : (
          <div className="space-y-6">
            {active.length > 0 && (
              <section>
                <p className="text-xs font-medium text-stone-400 uppercase tracking-widest mb-3">進行中</p>
                <ul className="flex flex-col gap-3">
                  {active.map((drill) => {
                    const s = STATUS_MAP[drill.status];
                    const Icon = s.icon;
                    return (
                      <li key={drill.id} className="rounded-2xl bg-white ring-1 ring-stone-100 shadow-sm p-4 sm:p-5">
                        <div className="flex items-start gap-3">
                          <Icon className="size-4 mt-0.5 shrink-0 text-stone-400" />
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <p className="font-medium text-stone-800 text-sm">{drill.title}</p>
                              <Badge variant="outline" className={`text-[10px] ${s.className}`}>
                                {s.label}
                              </Badge>
                            </div>
                            {drill.description && (
                              <p className="text-xs text-stone-500 leading-relaxed">{drill.description}</p>
                            )}
                            {drill.dueDate && (
                              <p className="text-[11px] text-stone-400 mt-2">
                                期限：{drill.dueDate.toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" })}
                              </p>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            {done.length > 0 && (
              <section>
                <p className="text-xs font-medium text-stone-400 uppercase tracking-widest mb-3">完了済み</p>
                <ul className="flex flex-col gap-3">
                  {done.map((drill) => {
                    const s = STATUS_MAP[drill.status];
                    const Icon = s.icon;
                    return (
                      <li key={drill.id} className="rounded-2xl bg-white ring-1 ring-stone-100 shadow-sm p-4 sm:p-5 opacity-60">
                        <div className="flex items-start gap-3">
                          <Icon className="size-4 mt-0.5 shrink-0 text-emerald-500" />
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <p className="font-medium text-stone-700 text-sm line-through">{drill.title}</p>
                              <Badge variant="outline" className={`text-[10px] ${s.className}`}>
                                {s.label}
                              </Badge>
                            </div>
                            {drill.description && (
                              <p className="text-xs text-stone-400 leading-relaxed">{drill.description}</p>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
