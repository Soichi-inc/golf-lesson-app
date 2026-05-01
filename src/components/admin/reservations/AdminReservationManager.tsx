"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { CheckCircle2, XCircle, Clock, CalendarDays, MapPin, Loader2, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { updateReservationStatus, approveReservation, rejectReservation, completeReservation } from "@/app/actions/reservations";
import type { Reservation } from "@/types";

const STATUS_MAP: Record<
  Reservation["status"],
  { label: string; className: string }
> = {
  PENDING:   { label: "リクエスト中", className: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  CONFIRMED: { label: "予約確定",     className: "bg-blue-50 text-blue-700 border-blue-200" },
  COMPLETED: { label: "レッスン実施済", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  CANCELLED: { label: "キャンセル",   className: "bg-stone-100 text-stone-500 border-stone-200" },
};

type ActionType = "approve" | "cancel" | "reject" | "complete" | "revert_to_confirmed";

type Props = { reservations: Reservation[] };

export function AdminReservationManager({ reservations: initial }: Props) {
  const router = useRouter();
  const [reservations, setReservations] = useState(initial);
  const [actionTarget, setActionTarget] = useState<{ rsv: Reservation; type: ActionType } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState<string>("");
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // アンマウント時に未クリアの setTimeout を必ず解除
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const pending   = reservations.filter((r) => r.status === "PENDING");
  const confirmed = reservations.filter((r) => r.status === "CONFIRMED");
  const others    = reservations.filter((r) => r.status === "COMPLETED" || r.status === "CANCELLED");

  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 3000);
  };

  const handleAction = async () => {
    if (!actionTarget) return;
    setIsProcessing(true);

    const { rsv, type } = actionTarget;
    const newStatus =
      type === "approve" ? "CONFIRMED" as const :
      type === "complete" ? "COMPLETED" as const :
      type === "revert_to_confirmed" ? "CONFIRMED" as const :
      "CANCELLED" as const;

    // reject / cancel は理由を付与（顧客にメールで通知される）
    const trimmedReason = cancelReason.trim() || undefined;

    const result =
      type === "approve"  ? await approveReservation(rsv.id)  :
      type === "reject"   ? await rejectReservation(rsv.id, trimmedReason)   :
      type === "complete" ? await completeReservation(rsv.id) :
      await updateReservationStatus(rsv.id, newStatus, trimmedReason);

    if (result.success) {
      setReservations((prev) =>
        prev.map((r) => {
          if (r.id !== rsv.id) return r;
          return { ...r, status: newStatus };
        })
      );

      const messages: Record<ActionType, string> = {
        approve:             "予約を承認しました",
        cancel:              "予約をキャンセルしました",
        reject:              "予約リクエストを却下しました",
        complete:            "予約を完了にしました",
        revert_to_confirmed: "予約を「確定」に戻しました",
      };
      showToast(messages[type]);

      // サーバー側のデータ更新をRSCに反映
      router.refresh();
    } else {
      showToast(result.error || "処理に失敗しました");
    }

    setIsProcessing(false);
    setActionTarget(null);
    setCancelReason("");
  };

  const ReservationCard = ({ rsv, actions }: { rsv: Reservation; actions: ActionType[] }) => {
    const s = STATUS_MAP[rsv.status];
    // レッスン開始時刻を過ぎているか（= 完了操作が妥当か）
    const isPastStart = new Date(rsv.schedule.startAt).getTime() <= Date.now();
    return (
      <div className="rounded-2xl bg-white ring-1 ring-stone-100 shadow-sm overflow-hidden">
        <div className="flex items-stretch">
          <div className={`w-1.5 shrink-0 ${rsv.schedule.lessonPlan.category === "ROUND" ? "bg-amber-400" : "bg-stone-700"}`} />
          <div className="flex-1 min-w-0 p-4">
            <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-stone-800 text-sm">{rsv.schedule.lessonPlan.name}</p>
                <Badge variant="outline" className={`text-[10px] ${s.className}`}>{s.label}</Badge>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-medium text-stone-600">
                  ¥{(rsv.totalPrice ?? rsv.schedule.lessonPlan.price).toLocaleString()}
                </p>
                {rsv.optionSwingVideo && (
                  <p className="text-[10px] text-stone-400 mt-0.5">
                    レッスン ¥{((rsv.totalPrice ?? rsv.schedule.lessonPlan.price) - 3000).toLocaleString()}
                    {" + "}撮影 ¥3,000
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1 text-xs text-stone-500 mb-2">
              <span className="flex items-center gap-1.5">
                <User className="size-3 shrink-0" />
                {rsv.user.name ?? rsv.user.email}
              </span>
              <span className="flex items-center gap-1.5">
                <CalendarDays className="size-3 shrink-0" />
                {format(new Date(rsv.schedule.startAt), "yyyy年M月d日（E） HH:mm", { locale: ja })} –{" "}
                {(() => {
                  // 場所リクエスト・任意場所で 70分指定の場合は実際の終了時刻を表示
                  const start = new Date(rsv.schedule.startAt);
                  const end = rsv.requestedDuration
                    ? new Date(start.getTime() + rsv.requestedDuration * 60 * 1000)
                    : new Date(rsv.schedule.endAt);
                  return format(end, "HH:mm");
                })()}
                {rsv.requestedDuration && (
                  <span className="text-violet-700 font-medium">
                    （{rsv.requestedDuration}分リクエスト）
                  </span>
                )}
              </span>
              {(rsv.requestedLocation || rsv.schedule.location) && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="size-3 shrink-0" />
                  {rsv.requestedLocation ? (
                    <>
                      <span className="text-violet-700 font-medium">
                        {rsv.indoorLocationType === "custom" ? "任意場所" : "店舗"}：
                      </span>
                      {rsv.requestedLocation}
                    </>
                  ) : (
                    rsv.schedule.location
                  )}
                </span>
              )}
              {rsv.indoorLocationType === "custom" && (
                <span className="text-violet-700 font-medium">
                  場所リクエスト枠（任意場所） / {rsv.requestedDuration}分 /{" "}
                  {rsv.usesTicketPack ? "4回チケット利用" : "単発"}
                </span>
              )}
              {rsv.roundBookingType && (
                <span className="text-amber-700 font-medium">
                  {rsv.roundBookingType === "private"
                    ? `貸切・${rsv.roundParticipantCount ?? 1}名`
                    : "組み合わせ予約（相席）"}
                </span>
              )}
            </div>

            {rsv.concern && (
              <p className="text-xs text-stone-400 bg-stone-50 rounded-lg px-3 py-2 mb-3">
                「{rsv.concern}」
              </p>
            )}

            {actions.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2 border-t border-stone-100">
                {actions.includes("approve") && (
                  <Button
                    size="sm"
                    className="h-7 text-xs bg-stone-800 hover:bg-stone-700 text-white rounded-full px-4"
                    onClick={() => setActionTarget({ rsv, type: "approve" })}
                  >
                    <CheckCircle2 className="size-3.5 mr-1" />
                    承認する
                  </Button>
                )}
                {actions.includes("complete") && (
                  <Button
                    size="sm"
                    className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-4 disabled:opacity-40"
                    onClick={() => setActionTarget({ rsv, type: "complete" })}
                    disabled={!isPastStart}
                    title={!isPastStart ? "レッスン開始時刻後に利用できます" : undefined}
                  >
                    <CheckCircle2 className="size-3.5 mr-1" />
                    レッスン完了にする
                  </Button>
                )}
                {actions.includes("revert_to_confirmed") && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs text-stone-700 border-stone-300 hover:bg-stone-50 rounded-full px-4"
                    onClick={() => setActionTarget({ rsv, type: "revert_to_confirmed" })}
                  >
                    予約確定に戻す
                  </Button>
                )}
                {actions.includes("cancel") && (
                  <Button
                    size="sm"
                    className="h-7 text-xs bg-red-600 hover:bg-red-700 text-white rounded-full px-4"
                    onClick={() => setActionTarget({ rsv, type: "cancel" })}
                  >
                    <XCircle className="size-3.5 mr-1" />
                    予約をキャンセル
                  </Button>
                )}
                {actions.includes("reject") && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs text-red-600 border-red-200 hover:bg-red-50 rounded-full px-4"
                    onClick={() => setActionTarget({ rsv, type: "reject" })}
                  >
                    却下する
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const EmptyState = ({ label }: { label: string }) => (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-stone-200 py-12 text-center">
      <Clock className="mb-2 size-8 text-stone-300" />
      <p className="text-sm text-stone-400">{label}</p>
    </div>
  );

  return (
    <>
      {/* トースト */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-full bg-stone-800 text-white text-sm px-5 py-2.5 shadow-lg">
          {toast}
        </div>
      )}

      <Tabs defaultValue="pending">
        <TabsList className="mb-6">
          <TabsTrigger value="pending" className="text-xs gap-1.5">
            リクエスト
            {pending.length > 0 && (
              <span className="flex size-4 items-center justify-center rounded-full bg-yellow-500 text-white text-[10px] font-bold">
                {pending.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="confirmed" className="text-xs gap-1.5">
            確定済み
            {confirmed.length > 0 && (
              <span className="flex size-4 items-center justify-center rounded-full bg-blue-500 text-white text-[10px] font-bold">
                {confirmed.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="others" className="text-xs">履歴</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-3">
          {pending.length === 0
            ? <EmptyState label="承認待ちのリクエストはありません" />
            : pending.map((r) => (
                <ReservationCard key={r.id} rsv={r} actions={["approve", "reject"]} />
              ))
          }
        </TabsContent>

        <TabsContent value="confirmed" className="space-y-3">
          {confirmed.length === 0
            ? <EmptyState label="確定済みの予約はありません" />
            : confirmed.map((r) => (
                <ReservationCard key={r.id} rsv={r} actions={["complete", "cancel"]} />
              ))
          }
        </TabsContent>

        <TabsContent value="others" className="space-y-3">
          {others.length === 0
            ? <EmptyState label="過去の予約はありません" />
            : others.map((r) => {
                // COMPLETED: 誤って完了にした場合は「予約確定に戻す」+「キャンセル」可能
                // CANCELLED: 操作なし
                const actions: ActionType[] =
                  r.status === "COMPLETED" ? ["revert_to_confirmed", "cancel"] : [];
                return <ReservationCard key={r.id} rsv={r} actions={actions} />;
              })
          }
        </TabsContent>
      </Tabs>

      {/* 確認ダイアログ */}
      <Dialog open={!!actionTarget} onOpenChange={(open) => { if (!open) setActionTarget(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-medium">
              {actionTarget?.type === "approve"             && "予約を承認しますか？"}
              {actionTarget?.type === "cancel"              && "予約をキャンセルしますか？"}
              {actionTarget?.type === "reject"              && "リクエストを却下しますか？"}
              {actionTarget?.type === "complete"            && "レッスンを完了にしますか？"}
              {actionTarget?.type === "revert_to_confirmed" && "予約確定に戻しますか？"}
            </DialogTitle>
            <DialogDescription className="text-sm text-stone-500 mt-1">
              {actionTarget?.rsv.user.name ?? actionTarget?.rsv.user.email} さんの{" "}
              {actionTarget?.rsv.schedule.lessonPlan.name}
              {actionTarget?.type === "cancel" && "をキャンセルします。顧客にメールで通知されます。"}
              {actionTarget?.type === "approve" && "を承認します。"}
              {actionTarget?.type === "reject" && "のリクエストを却下します。"}
              {actionTarget?.type === "complete" && "のレッスンを完了にします。"}
              {actionTarget?.type === "revert_to_confirmed" && "を「予約確定」状態に戻します。"}
            </DialogDescription>
          </DialogHeader>

          {/* 却下／キャンセル時は理由入力欄を表示（顧客にメール通知される） */}
          {(actionTarget?.type === "reject" ||
            actionTarget?.type === "cancel") && (
            <div className="space-y-1.5">
              <Label htmlFor="cancel-reason" className="text-xs text-stone-600">
                {actionTarget.type === "reject" ? "却下理由" : "キャンセル理由"}
                <span className="ml-1.5 text-[10px] text-stone-400">任意・顧客にメールで通知されます</span>
              </Label>
              <Textarea
                id="cancel-reason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder={
                  actionTarget.type === "reject"
                    ? "例：この日時は既に別件が入っているため…"
                    : "例：お客様のご都合によりキャンセル"
                }
                rows={3}
                className="resize-none text-xs"
                disabled={isProcessing}
              />
            </div>
          )}

          <DialogFooter className="flex gap-2 sm:flex-row">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => setActionTarget(null)} disabled={isProcessing}>
              キャンセル
            </Button>
            <Button
              size="sm"
              className={`flex-1 text-white ${
                actionTarget?.type === "approve" ? "bg-stone-800 hover:bg-stone-700" :
                actionTarget?.type === "complete" ? "bg-emerald-600 hover:bg-emerald-700" :
                actionTarget?.type === "revert_to_confirmed" ? "bg-stone-700 hover:bg-stone-600" :
                "bg-red-600 hover:bg-red-700"
              }`}
              onClick={handleAction}
              disabled={isProcessing}
            >
              {isProcessing ? <><Loader2 className="mr-1.5 size-3.5 animate-spin" />処理中…</> : "確定する"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
