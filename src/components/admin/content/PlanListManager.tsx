"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Clock,
  Users,
  CheckCircle2,
  DollarSign,
  Plus,
  Pencil,
  Trash2,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { upsertPlan, deletePlan, type PlanData } from "@/app/actions/plans";
import { callAction } from "@/lib/client/call-action";
import { PlanEditDialog } from "./PlanEditDialog";

const colorMap: Record<string, { badge: string; bar: string }> = {
  REGULAR: { badge: "border-stone-200 bg-stone-50 text-stone-600", bar: "bg-stone-700" },
  ROUND: { badge: "border-amber-200 bg-amber-50 text-amber-700", bar: "bg-amber-400" },
  ONLINE: { badge: "border-sky-200 bg-sky-50 text-sky-700", bar: "bg-sky-400" },
};

type Props = {
  initialPlans: PlanData[];
};

export function PlanListManager({ initialPlans }: Props) {
  const [plans, setPlans] = useState<PlanData[]>(initialPlans);
  const [editingPlan, setEditingPlan] = useState<PlanData | undefined>();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (noticeTimer.current) clearTimeout(noticeTimer.current);
    };
  }, []);

  /** 成功の表示は 3 秒で消す。失敗の表示は読み終えるまで残す */
  function showNotice(kind: "ok" | "error", text: string) {
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    setNotice({ kind, text });
    if (kind === "ok") {
      noticeTimer.current = setTimeout(() => setNotice(null), 3000);
    }
  }

  /**
   * 1 件だけサーバーへ送って保存する。失敗したらエラー文言を返す（ダイアログ側で表示し、
   * 入力内容を残す）。サーバーが返す最新の一覧で表示を更新するので、別の端末で
   * 行われた変更もここで取り込まれる。
   */
  async function handleSave(plan: PlanData): Promise<string | null> {
    setSaving(true);
    setNotice(null);
    const result = await callAction(() => upsertPlan(plan));
    setSaving(false);

    if (!result.success || !result.plans) {
      return result.error || "保存に失敗しました";
    }
    setPlans(result.plans);
    showNotice("ok", "保存しました");
    setEditingPlan(undefined);
    return null;
  }

  async function handleDelete(planId: string) {
    if (!confirm("このプランを削除しますか？")) return;
    setSaving(true);
    setNotice(null);
    const result = await callAction(() => deletePlan(planId));
    setSaving(false);

    if (result.success && result.plans) {
      setPlans(result.plans);
      showNotice("ok", "削除しました");
    } else {
      showNotice("error", result.error || "削除に失敗しました");
    }
  }

  function openCreate() {
    setEditingPlan(undefined);
    setDialogOpen(true);
  }

  function openEdit(plan: PlanData) {
    setEditingPlan(plan);
    setDialogOpen(true);
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {saving && <Loader2 className="size-4 animate-spin text-stone-400" />}
          {notice && (
            <span
              role={notice.kind === "error" ? "alert" : "status"}
              className={`flex items-start gap-1 text-sm ${
                notice.kind === "error" ? "text-red-600" : "text-green-600"
              }`}
            >
              {notice.kind === "error" ? (
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
              ) : (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
              )}
              {notice.text}
            </span>
          )}
        </div>
        <Button
          onClick={openCreate}
          size="sm"
          className="shrink-0 bg-stone-800 hover:bg-stone-700 gap-1.5"
        >
          <Plus className="size-4" /> プラン追加
        </Button>
      </div>

      {/* サマリー */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-stone-100 text-center">
          <p className="text-2xl font-light text-stone-800">{plans.length}</p>
          <p className="text-xs text-stone-500 mt-1">プラン数</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-stone-100 text-center">
          <p className="text-2xl font-light text-stone-800">
            {plans.filter((p) => p.isPublished).length}
          </p>
          <p className="text-xs text-stone-500 mt-1">公開中</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-stone-100 text-center">
          <p className="text-2xl font-light text-stone-800">
            {new Set(plans.map((p) => p.category)).size}
          </p>
          <p className="text-xs text-stone-500 mt-1">カテゴリ数</p>
        </div>
      </div>

      {/* プラン一覧 */}
      <div className="space-y-4">
        {plans.map((plan) => {
          const c = colorMap[plan.category] || colorMap.REGULAR;
          return (
            <div
              key={plan.id}
              className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-100"
            >
              <div className={`h-1 w-full ${c.bar}`} />
              <div className="p-5">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Badge variant="outline" className={`text-[10px] ${c.badge}`}>
                        {plan.tagLabel}
                      </Badge>
                      {plan.isPublished ? (
                        <Badge className="bg-green-50 text-green-600 border border-green-200 text-[10px]">
                          <CheckCircle2 className="size-3 mr-0.5" />
                          公開中
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-stone-400 text-[10px]">
                          非公開
                        </Badge>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-stone-800">
                      {plan.name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-stone-400 hover:text-stone-700"
                      onClick={() => openEdit(plan)}
                      aria-label="プランを編集"
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-stone-400 hover:text-red-500"
                      onClick={() => handleDelete(plan.id)}
                      disabled={saving}
                      aria-label="プランを削除"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-baseline gap-2 mb-4">
                  <p className="text-lg font-light text-stone-800">
                    ¥{plan.price.toLocaleString()}
                    {plan.priceFrom ? "〜" : ""}
                  </p>
                  <p className="text-[11px] text-stone-400">
                    {plan.priceNote ?? "税込"}
                  </p>
                </div>

                {/* メタ */}
                <div className="flex flex-wrap gap-4 mb-4 text-xs text-stone-500">
                  <span className="flex items-center gap-1.5">
                    <Clock className="size-3.5" />
                    {plan.duration}分
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="size-3.5" />
                    {plan.maxAttendees === 1
                      ? "マンツーマン"
                      : `定員${plan.maxAttendees}名`}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <DollarSign className="size-3.5" />
                    カード・現金・PayPay・振込
                  </span>
                </div>

                {/* 料金詳細 */}
                {plan.details.length > 0 && (
                  <div className="rounded-xl bg-stone-50 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400 mb-2">
                      料金詳細
                    </p>
                    <ul className="space-y-1">
                      {plan.details.map((d, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-1.5 text-xs text-stone-600"
                        >
                          <span className="mt-1.5 size-1 shrink-0 rounded-full bg-stone-300" />
                          {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {plans.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-stone-400 border-2 border-dashed rounded-xl">
            <p className="text-sm">レッスンプランがありません</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3 gap-1"
              onClick={openCreate}
            >
              <Plus className="size-3.5" /> 最初のプランを追加
            </Button>
          </div>
        )}
      </div>

      {/* 編集ダイアログ */}
      {dialogOpen && (
        <PlanEditDialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setEditingPlan(undefined);
          }}
          plan={editingPlan}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
