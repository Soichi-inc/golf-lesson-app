"use client";

import { useState } from "react";
import Link from "next/link";
import { format, differenceInCalendarDays } from "date-fns";
import { ja } from "date-fns/locale";
import { CalendarDays, MapPin, Clock, Loader2, MessageCircle, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import type { Reservation } from "@/types";
import { cancelReservationByCustomer } from "@/app/actions/reservations";

const STATUS_MAP: Record<
  Reservation["status"],
  { label: string; className: string }
> = {
  PENDING:   { label: "リクエスト中", className: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  CONFIRMED: { label: "予約確定",     className: "bg-blue-50 text-blue-700 border-blue-200" },
  COMPLETED: { label: "レッスン実施済", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  CANCELLED: { label: "キャンセル",   className: "bg-stone-100 text-stone-500 border-stone-200" },
};

// LINE公式アカウント URL
const LINE_OFFICIAL_URL = "https://lin.ee/mDThmZr";

/**
 * キャンセルポリシー判定
 * 7日前以上: 顧客が自分でキャンセル可能（無料）
 * それ以降: LINE公式からコーチに連絡してもらう
 */
function getCancelPolicy(lessonDate: Date): {
  type: "free" | "line";
  daysUntil: number;
} {
  const daysUntil = differenceInCalendarDays(lessonDate, new Date());
  return {
    type: daysUntil >= 7 ? "free" : "line",
    daysUntil,
  };
}

type Props = { reservations: Reservation[] };

function ensureDate(v: Date | string): Date {
  return v instanceof Date ? v : new Date(v);
}

function hydrateReservation(r: Reservation): Reservation {
  return {
    ...r,
    createdAt: ensureDate(r.createdAt),
    updatedAt: ensureDate(r.updatedAt),
    cancelledAt: r.cancelledAt ? ensureDate(r.cancelledAt) : null,
    schedule: {
      ...r.schedule,
      startAt: ensureDate(r.schedule.startAt),
      endAt: ensureDate(r.schedule.endAt),
      createdAt: ensureDate(r.schedule.createdAt),
      updatedAt: ensureDate(r.schedule.updatedAt),
      lessonPlan: {
        ...r.schedule.lessonPlan,
        createdAt: ensureDate(r.schedule.lessonPlan.createdAt),
        updatedAt: ensureDate(r.schedule.lessonPlan.updatedAt),
      },
    },
    user: {
      ...r.user,
      createdAt: ensureDate(r.user.createdAt),
      updatedAt: ensureDate(r.user.updatedAt),
    },
  };
}

export function MyReservationList({ reservations: rawReservations }: Props) {
  const [reservations, setReservations] = useState(() =>
    rawReservations.map(hydrateReservation)
  );
  const [cancelTarget, setCancelTarget] = useState<Reservation | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [doneMessage, setDoneMessage] = useState<string | null>(null);

  const sorted = [...reservations].sort(
    (a, b) => b.schedule.startAt.getTime() - a.schedule.startAt.getTime()
  );

  const canCancel = (rsv: Reservation) =>
    rsv.status === "PENDING" || rsv.status === "CONFIRMED";

  const handleCancelConfirm = async () => {
    if (!cancelTarget) return;
    setIsProcessing(true);

    const result = await cancelReservationByCustomer(cancelTarget.id);

    if (result.success) {
      setReservations((prev) =>
        prev.map((r) =>
          r.id === cancelTarget.id
            ? {
                ...r,
                status: "CANCELLED" as const,
                cancelledAt: new Date(),
                cancelReason: "顧客によるキャンセル（無料）",
              }
            : r
        )
      );
      setDoneMessage("キャンセルが完了しました。");
    } else {
      setDoneMessage(result.error || "キャンセルに失敗しました。もう一度お試しください。");
    }
    setIsProcessing(false);
    setCancelTarget(null);
  };

  if (sorted.length === 0) {
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

  const policy = cancelTarget ? getCancelPolicy(cancelTarget.schedule.startAt) : null;

  return (
    <>
      {doneMessage && (
        <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-sm text-emerald-700">
          {doneMessage}
        </div>
      )}

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
                          {format(rsv.schedule.startAt, "HH:mm")} – {format(
                            rsv.requestedDuration
                              ? new Date(new Date(rsv.schedule.startAt).getTime() + rsv.requestedDuration * 60 * 1000)
                              : rsv.schedule.endAt,
                            "HH:mm"
                          )}
                          {rsv.requestedDuration && (
                            <span className="ml-1 text-violet-600">
                              （{rsv.requestedDuration}分リクエスト）
                            </span>
                          )}
                        </span>
                        {(rsv.requestedLocation || rsv.schedule.location) && (
                          <span className="flex items-center gap-1.5">
                            <MapPin className="size-3 shrink-0" />
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
                            場所リクエスト枠 / {rsv.requestedDuration ?? "-"}分 /{" "}
                            {rsv.usesTicketPack ? "4回チケット利用" : "単発"}
                          </span>
                        )}
                        {rsv.roundBookingType && (
                          <span className="text-amber-600">
                            {rsv.roundBookingType === "private"
                              ? `貸切予約・${rsv.roundParticipantCount ?? 1}名`
                              : "組み合わせ予約（相席）"}
                          </span>
                        )}
                        {rsv.requestedCourse && (
                          <span className="text-amber-700">
                            希望コース：{rsv.requestedCourse}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-medium text-stone-700">
                        ¥{(rsv.totalPrice ?? rsv.schedule.lessonPlan.price).toLocaleString()}
                      </p>
                      {rsv.schedule.lessonPlan.category === "ROUND" && (
                        <p className="text-[10px] text-stone-400 mt-0.5">レッスン料金</p>
                      )}
                    </div>
                  </div>

                  {/* キャンセルボタン */}
                  {canCancel(rsv) && (
                    <div className="mt-3 pt-3 border-t border-stone-100">
                      <button
                        onClick={() => { setDoneMessage(null); setCancelTarget(rsv); }}
                        className="text-xs text-stone-400 hover:text-red-500 transition-colors underline underline-offset-2"
                      >
                        キャンセルする
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {/* キャンセル確認ダイアログ */}
      <Dialog open={!!cancelTarget} onOpenChange={(open) => { if (!open) setCancelTarget(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-medium">
              {policy?.type === "free" ? "予約をキャンセルしますか？" : "キャンセルのご依頼"}
            </DialogTitle>
            {cancelTarget && (
              <DialogDescription asChild>
                <div className="text-sm text-stone-600 mt-2 space-y-3">
                  {/* 予約情報 */}
                  <div className="rounded-lg bg-stone-50 p-3 text-xs space-y-1">
                    <p className="font-medium text-stone-800">
                      {cancelTarget.schedule.lessonPlan.name}
                    </p>
                    <p>
                      {format(
                        cancelTarget.schedule.startAt,
                        "yyyy年M月d日（E） HH:mm",
                        { locale: ja }
                      )}
                    </p>
                  </div>

                  {/* 分岐: 7日前以上（free）vs 6日前以内（line） */}
                  {policy?.type === "free" ? (
                    <p className="text-xs text-stone-500">
                      レッスン7日前以上のため、無料でキャンセルできます。
                    </p>
                  ) : (
                    <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs space-y-2">
                      <p className="font-medium text-emerald-800">
                        レッスン7日前を過ぎているため、このページからはキャンセルできません。
                      </p>
                      <p className="text-emerald-700 leading-relaxed">
                        お手数ですが、LINE公式アカウントからコーチに直接ご連絡ください。
                        （コーチが確認のうえ手動でキャンセル処理いたします）
                      </p>
                    </div>
                  )}

                  {/* ポリシー参考 */}
                  <div className="rounded-lg bg-stone-50 p-3 text-xs text-stone-500">
                    <p className="font-medium text-stone-700 mb-1">キャンセルポリシー</p>
                    <ul className="space-y-0.5">
                      <li>・7日前まで：無料キャンセル（マイページから可能）</li>
                      <li>・3〜6日前：レッスン料金の50%（LINEでご連絡）</li>
                      <li>・前日・当日：レッスン料金の100%（LINEでご連絡）</li>
                    </ul>
                  </div>
                </div>
              </DialogDescription>
            )}
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:flex-row">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => setCancelTarget(null)}
              disabled={isProcessing}
            >
              戻る
            </Button>
            {policy?.type === "free" ? (
              <Button
                size="sm"
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                onClick={handleCancelConfirm}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                    処理中…
                  </>
                ) : (
                  "キャンセルする"
                )}
              </Button>
            ) : (
              <a
                href={LINE_OFFICIAL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md h-9 px-3 text-sm font-medium text-white transition-colors"
                style={{ backgroundColor: "#06C755" }}
                onClick={() => setCancelTarget(null)}
              >
                <MessageCircle className="size-3.5" />
                LINEで連絡する
                <ExternalLink className="size-3" />
              </a>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
