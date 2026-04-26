import { format } from "date-fns";
import { ja } from "date-fns/locale";
import {
  CalendarDays,
  MapPin,
  MessageCircle,
  Camera,
  ShieldCheck,
  Phone,
  Flag,
  Users,
  User as UserIcon,
} from "lucide-react";
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
    label: "予約確定",
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
  COMPLETED: {
    label: "レッスン実施済",
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
    (a, b) => new Date(b.schedule.startAt).getTime() - new Date(a.schedule.startAt).getTime()
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
                      {format(new Date(rsv.schedule.startAt), "yyyy年M月d日（E） HH:mm", {
                        locale: ja,
                      })}
                      &nbsp;–&nbsp;
                      {format(
                        rsv.requestedDuration
                          ? new Date(new Date(rsv.schedule.startAt).getTime() + rsv.requestedDuration * 60 * 1000)
                          : new Date(rsv.schedule.endAt),
                        "HH:mm"
                      )}
                      {rsv.requestedDuration && (
                        <span className="ml-1 text-violet-600">（{rsv.requestedDuration}分）</span>
                      )}
                    </span>
                    {(rsv.requestedLocation || rsv.schedule.location) && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="size-3" />
                        {rsv.requestedLocation ? (
                          <span className="text-violet-700">
                            {rsv.indoorLocationType === "custom" ? "任意場所：" : "店舗："}
                            {rsv.requestedLocation}
                          </span>
                        ) : (
                          rsv.schedule.location
                        )}
                      </span>
                    )}
                    {rsv.indoorLocationType === "custom" && (
                      <span className="text-violet-600 text-[11px]">
                        場所リクエスト枠 / {rsv.usesTicketPack ? "4回チケット" : "単発"}
                      </span>
                    )}
                  </div>

                  {/* ラウンド: 予約タイプ・人数・希望コース */}
                  {rsv.roundBookingType && (
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-stone-500">
                      {rsv.roundBookingType === "private" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-amber-700">
                          <UserIcon className="size-3" />貸切 {rsv.roundParticipantCount ?? 1}名
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-amber-700">
                          <Users className="size-3" />組み合わせ
                        </span>
                      )}
                      {rsv.requestedCourse && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-amber-700">
                          <Flag className="size-3" />希望コース：{rsv.requestedCourse}
                        </span>
                      )}
                    </div>
                  )}

                  {/* お悩みメモ */}
                  {rsv.concern && (
                    <div className="mt-2 flex items-start gap-1.5 text-xs text-stone-500 bg-stone-50 rounded px-2 py-1.5">
                      <MessageCircle className="size-3 shrink-0 mt-0.5" />
                      <span>{rsv.concern}</span>
                    </div>
                  )}

                  {/* 緊急連絡先・同意ステータス */}
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-stone-500">
                    {rsv.emergencyPhone && (
                      <span className="inline-flex items-center gap-1">
                        <Phone className="size-3" />
                        <a href={`tel:${rsv.emergencyPhone}`} className="underline-offset-2 hover:underline">
                          {rsv.emergencyPhone}
                        </a>
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <ShieldCheck
                        className={`size-3 ${rsv.agreedCancelPolicy ? "text-emerald-500" : "text-stone-300"}`}
                      />
                      キャンセル{rsv.agreedCancelPolicy ? "同意" : "未同意"}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Camera
                        className={`size-3 ${rsv.agreedPhotoPost ? "text-emerald-500" : "text-stone-300"}`}
                      />
                      SNS{rsv.agreedPhotoPost ? "同意" : "未同意"}
                    </span>
                  </div>
                </div>

                {/* 料金 */}
                <div className="text-right shrink-0">
                  <p className="text-sm font-medium text-stone-700">
                    ¥{(rsv.totalPrice ?? rsv.schedule.lessonPlan.price).toLocaleString()}
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
