"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { CheckCircle2, XCircle, Clock, CalendarDays, MapPin, Loader2, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

type ActionType = "approve" | "cancel_approve" | "reject";

type Props = { reservations: Reservation[] };

export function AdminReservationManager({ reservations: initial }: Props) {
  const [reservations, setReservations] = useState(initial);
  const [actionTarget, setActionTarget] = useState<{ rsv: Reservation; type: ActionType } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const pending   = reservations.filter((r) => r.status === "PENDING");
  const confirmed = reservations.filter((r) => r.status === "CONFIRMED");
  const others    = reservations.filter((r) => r.status === "COMPLETED" || r.status === "CANCELLED");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleAction = async () => {
    if (!actionTarget) return;
    setIsProcessing(true);
    await new Promise((r) => setTimeout(r, 700)); // 仮の処理

    const { rsv, type } = actionTarget;
    setReservations((prev) =>
      prev.map((r) => {
        if (r.id !== rsv.id) return r;
        if (type === "approve")         return { ...r, status: "CONFIRMED" as const };
        if (type === "cancel_approve")  return { ...r, status: "CANCELLED" as const };
        if (type === "reject")          return { ...r, status: "CANCELLED" as const };
        return r;
      })
    );

    const messages: Record<ActionType, string> = {
      approve:        "予約を承認しました",
      cancel_approve: "キャンセルを承認しました",
      reject:         "予約リクエストを却下しました",
    };
    showToast(messages[type]);
    setIsProcessing(false);
    setActionTarget(null);
  };

  const ReservationCard = ({ rsv, actions }: { rsv: Reservation; actions: ActionType[] }) => {
    const s = STATUS_MAP[rsv.status];
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
              <p className="text-sm font-medium text-stone-600">¥{rsv.schedule.lessonPlan.price.toLocaleString()}</p>
            </div>

            <div className="flex flex-col gap-1 text-xs text-stone-500 mb-2">
              <span className="flex items-center gap-1.5">
                <User className="size-3 shrink-0" />
                {rsv.user.name ?? rsv.user.email}
              </span>
              <span className="flex items-center gap-1.5">
                <CalendarDays className="size-3 shrink-0" />
                {format(rsv.schedule.startAt, "yyyy年M月d日（E） HH:mm", { locale: ja })} –{" "}
                {format(rsv.schedule.endAt, "HH:mm")}
              </span>
              {rsv.schedule.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="size-3 shrink-0" />
                  {rsv.schedule.location}
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
                {actions.includes("cancel_approve") && (
                  <Button
                    size="sm"
                    className="h-7 text-xs bg-red-600 hover:bg-red-700 text-white rounded-full px-4"
                    onClick={() => setActionTarget({ rsv, type: "cancel_approve" })}
                  >
                    <XCircle className="size-3.5 mr-1" />
                    キャンセルを承認
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
                <ReservationCard key={r.id} rsv={r} actions={["cancel_approve"]} />
              ))
          }
        </TabsContent>

        <TabsContent value="others" className="space-y-3">
          {others.length === 0
            ? <EmptyState label="過去の予約はありません" />
            : others.map((r) => (
                <ReservationCard key={r.id} rsv={r} actions={[]} />
              ))
          }
        </TabsContent>
      </Tabs>

      {/* 確認ダイアログ */}
      <Dialog open={!!actionTarget} onOpenChange={(open) => { if (!open) setActionTarget(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-medium">
              {actionTarget?.type === "approve"        && "予約を承認しますか？"}
              {actionTarget?.type === "cancel_approve" && "キャンセルを承認しますか？"}
              {actionTarget?.type === "reject"         && "リクエストを却下しますか？"}
            </DialogTitle>
            <DialogDescription className="text-sm text-stone-500 mt-1">
              {actionTarget?.rsv.user.name ?? actionTarget?.rsv.user.email} さんの{" "}
              {actionTarget?.rsv.schedule.lessonPlan.name}
              {actionTarget?.type === "cancel_approve" && "のキャンセルを承認します。この操作は取り消せません。"}
              {actionTarget?.type === "approve" && "を承認します。"}
              {actionTarget?.type === "reject" && "のリクエストを却下します。"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:flex-row">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => setActionTarget(null)} disabled={isProcessing}>
              キャンセル
            </Button>
            <Button
              size="sm"
              className={`flex-1 text-white ${actionTarget?.type === "approve" ? "bg-stone-800 hover:bg-stone-700" : "bg-red-600 hover:bg-red-700"}`}
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
