import Link from "next/link";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { CalendarDays, MapPin, Clock, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Reservation } from "@/types";

const STATUS_MAP: Record<
  Reservation["status"],
  { label: string; className: string }
> = {
  PENDING:   { label: "仮受付",     className: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  CONFIRMED: { label: "確定",       className: "bg-blue-50 text-blue-700 border-blue-200" },
  COMPLETED: { label: "完了",       className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  CANCELLED: { label: "キャンセル", className: "bg-stone-100 text-stone-500 border-stone-200" },
};

type Props = { reservations: Reservation[] };

export function MyReservationList({ reservations }: Props) {
  if (reservations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-stone-200 py-14 text-center">
        <CalendarDays className="mb-3 size-10 text-stone-300" />
        <p className="text-sm text-stone-500">予約履歴がありません</p>
        <Button asChild size="sm" className="mt-5 rounded-full bg-stone-800 hover:bg-stone-700">
          <Link href="/schedule">レッスンを予約する</Link>
        </Button>
      </div>
    );
  }

  const sorted = [...reservations].sort(
    (a, b) => b.schedule.startAt.getTime() - a.schedule.startAt.getTime()
  );

  return (
    <ul className="flex flex-col gap-3">
      {sorted.map((rsv) => {
        const s = STATUS_MAP[rsv.status];
        return (
          <li key={rsv.id} className="rounded-2xl bg-white ring-1 ring-stone-100 shadow-sm overflow-hidden">
            <div className="flex items-stretch">
              {/* 左: カテゴリカラーバー */}
              <div className={`w-1.5 shrink-0 ${rsv.schedule.lessonPlan.category === "ROUND" ? "bg-amber-400" : "bg-stone-700"}`} />

              {/* コンテンツ */}
              <div className="flex-1 min-w-0 p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <p className="font-medium text-stone-800 text-sm">{rsv.schedule.lessonPlan.name}</p>
                      <Badge variant="outline" className={`text-[10px] ${s.className}`}>{s.label}</Badge>
                    </div>
                    <div className="flex flex-col gap-1 text-xs text-stone-500">
                      <span className="flex items-center gap-1.5">
                        <CalendarDays className="size-3 shrink-0" />
                        {format(rsv.schedule.startAt, "yyyy年M月d日（E）", { locale: ja })}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="size-3 shrink-0" />
                        {format(rsv.schedule.startAt, "HH:mm")} – {format(rsv.schedule.endAt, "HH:mm")}
                      </span>
                      {rsv.schedule.location && (
                        <span className="flex items-center gap-1.5">
                          <MapPin className="size-3 shrink-0" />
                          {rsv.schedule.location}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-medium text-stone-700">
                      ¥{rsv.schedule.lessonPlan.price.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
