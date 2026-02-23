"use client";

import { useState } from "react";
import Link from "next/link";
import { format, differenceInCalendarDays } from "date-fns";
import { ja } from "date-fns/locale";
import { CalendarDays, MapPin, Clock, AlertTriangle, Loader2 } from "lucide-react";
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

const STATUS_MAP: Record<
  Reservation["status"],
  { label: string; className: string }
> = {
  PENDING:   { label: "リクエスト中", className: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  CONFIRMED: { label: "予約確定",     className: "bg-blue-50 text-blue-700 border-blue-200" },
  COMPLETED: { label: "完了",         className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  CANCELLED: { label: "キャンセル",   className: "bg-stone-100 text-stone-500 border-stone-200" },
};

// キャンセルポリシー判定
function getCancelPolicy(lessonDate: Date): {
  type: "free" | "half" | "full";
  label: string;
  description: string;
} {
  const daysUntil = differenceInCalendarDays(lessonDate, new Date());
  if (daysUntil >= 7) {
    return { type: "free", label: "無料キャンセル", description: "7日前以上のため、キャンセル料は発生しません。" };
  } else if (daysUntil >= 3) {
    return { type: "half", label: "キャンセル料50%", description: `レッスンまで${daysUntil}日です。キャンセル料（レッスン料金の50%）が発生します。` };
  } else {
    return { type: "full", label: "キャンセル料100%", description: `レッスンまで${daysUntil <= 0 ? "当日" : `${daysUntil}日`}です。キャンセル料（レッスン料金の100%）が発生します。` };
  }
}

type Props = { reservations: Reservation[] };

export function MyReservationList({ reservations }: Props) {
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

    const policy = getCancelPolicy(cancelTarget.schedule.startAt);
    // 7日前以上 → 自動キャンセル（将来的にはAPIを呼ぶ）
    // 6日前以内 → adminへキャンセルリクエスト（将来的にはAPIを呼ぶ）
    await new Promise((r) => setTimeout(r, 800)); // 仮の処理時間

    if (policy.type === "free") {
      setDoneMessage("キャンセルが完了しました。");
    } else {
      setDoneMessage("キャンセルリクエストを送信しました。講師の承認をお待ちください。");
    }
    setIsProcessing(false);
    setCancelTarget(null);
  };

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
            <DialogTitle className="text-base font-medium">予約をキャンセルしますか？</DialogTitle>
            {cancelTarget && (
              <DialogDescription asChild>
                <div className="text-sm text-stone-600 mt-2 space-y-3">
                  <div className="rounded-lg bg-stone-50 p-3 text-xs space-y-1">
                    <p className="font-medium text-stone-800">{cancelTarget.schedule.lessonPlan.name}</p>
                    <p>{format(cancelTarget.schedule.startAt, "yyyy年M月d日（E） HH:mm", { locale: ja })}</p>
                  </div>

                  {policy && policy.type !== "free" ? (
                    <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-medium text-amber-700">
                        <AlertTriangle className="size-3.5" />
                        {policy.label}
                      </div>
                      <p className="text-amber-600">{policy.description}</p>
                      <p className="text-amber-600">キャンセルリクエストを送信します。講師の承認後にキャンセルが確定します。</p>
                    </div>
                  ) : (
                    <p className="text-xs text-stone-500">{policy?.description}</p>
                  )}

                  <div className="rounded-lg bg-stone-50 p-3 text-xs text-stone-500">
                    <p className="font-medium text-stone-700 mb-1">キャンセルポリシー</p>
                    <ul className="space-y-0.5">
                      <li>・7日前まで：無料キャンセル</li>
                      <li>・3〜6日前：レッスン料金の50%</li>
                      <li>・前日・当日：レッスン料金の100%</li>
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
            <Button
              size="sm"
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              onClick={handleCancelConfirm}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <><Loader2 className="mr-1.5 size-3.5 animate-spin" />処理中…</>
              ) : policy?.type === "free" ? "キャンセルする" : "リクエストを送信"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
