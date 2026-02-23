import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { CalendarDays, MapPin, MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Reservation } from "@/types";

const STATUS_MAP: Record<
  Reservation["status"],
  { label: string; className: string }
> = {
  PENDING: {
    label: "仮受付",
    className: "bg-yellow-50 text-yellow-700 border-yellow-200",
  },
  CONFIRMED: {
    label: "確定",
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
  COMPLETED: {
    label: "完了",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  CANCELLED: {
    label: "キャンセル",
    className: "bg-stone-100 text-stone-500 border-stone-200",
  },
};

type Props = {
  reservations: Reservation[];
};

export function ReservationHistory({ reservations }: Props) {
  if (reservations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-stone-400 border-2 border-dashed rounded-xl">
        <CalendarDays className="size-8 mb-2 opacity-40" />
        <p className="text-sm">予約履歴がありません</p>
      </div>
    );
  }

  const sorted = [...reservations].sort(
    (a, b) => b.schedule.startAt.getTime() - a.schedule.startAt.getTime()
  );

  return (
    <div className="space-y-3">
      {sorted.map((rsv) => {
        const status = STATUS_MAP[rsv.status];
        return (
          <Card key={rsv.id} className="bg-white">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {/* プラン名 + ステータス */}
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <p className="font-medium text-stone-800 text-sm">
                      {rsv.schedule.lessonPlan.name}
                    </p>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${status.className}`}
                    >
                      {status.label}
                    </Badge>
                  </div>

                  {/* 日時・場所 */}
                  <div className="flex flex-col gap-1 text-xs text-stone-500">
                    <span className="flex items-center gap-1.5">
                      <CalendarDays className="size-3" />
                      {format(rsv.schedule.startAt, "yyyy年M月d日（E） HH:mm", {
                        locale: ja,
                      })}
                      &nbsp;–&nbsp;
                      {format(rsv.schedule.endAt, "HH:mm")}
                    </span>
                    {rsv.schedule.location && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="size-3" />
                        {rsv.schedule.location}
                      </span>
                    )}
                  </div>

                  {/* お悩みメモ */}
                  {rsv.concern && (
                    <div className="mt-2 flex items-start gap-1.5 text-xs text-stone-500 bg-stone-50 rounded px-2 py-1.5">
                      <MessageCircle className="size-3 shrink-0 mt-0.5" />
                      <span>{rsv.concern}</span>
                    </div>
                  )}
                </div>

                {/* 料金 */}
                <div className="text-right shrink-0">
                  <p className="text-sm font-medium text-stone-700">
                    ¥{rsv.schedule.lessonPlan.price.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
