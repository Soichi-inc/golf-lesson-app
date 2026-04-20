"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Flag, Plus, ChevronDown, ChevronUp, Trash2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { RoundScore } from "@/types";
import { addScore as addScoreAction, deleteScore as deleteScoreAction } from "@/app/actions/scores";

type ScoreFormRaw = {
  playedAt: string;
  courseName: string;
  score: string;
  outScore: string;
  inScore: string;
  putts: string;
  memo: string;
};

type Props = {
  scores: RoundScore[];
  userId?: string;
};

function ensureDate(v: Date | string): Date {
  return v instanceof Date ? v : new Date(v);
}

function hydrateScore(s: RoundScore): RoundScore {
  return {
    ...s,
    playedAt: ensureDate(s.playedAt),
    createdAt: ensureDate(s.createdAt),
    updatedAt: ensureDate(s.updatedAt),
  };
}

export function MyScoreSection({ scores: initialScores, userId }: Props) {
  const [scores, setScores] = useState(
    [...initialScores].map(hydrateScore).sort((a, b) => b.playedAt.getTime() - a.playedAt.getTime())
  );
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ScoreFormRaw>({
    defaultValues: {
      playedAt: "",
      courseName: "",
      score: "",
      outScore: "",
      inScore: "",
      putts: "",
      memo: "",
    },
  });

  async function onSubmit(raw: ScoreFormRaw) {
    setErrorMessage(null);
    const score = parseInt(raw.score, 10);
    if (isNaN(score) || score < 60 || score > 200) {
      setErrorMessage("スコアは60〜200の範囲で入力してください");
      return;
    }
    if (!userId) {
      setErrorMessage("ログイン状態を確認してください");
      return;
    }

    const toInt = (s: string) => (s.trim() === "" ? null : parseInt(s, 10));

    const result = await addScoreAction({
      playedAt: raw.playedAt,
      courseName: raw.courseName,
      score,
      outScore: toInt(raw.outScore),
      inScore: toInt(raw.inScore),
      putts: toInt(raw.putts),
      memo: raw.memo.trim() || null,
    });

    if (result.success && result.score) {
      setScores((prev) =>
        [...prev, hydrateScore(result.score!)].sort((a, b) => b.playedAt.getTime() - a.playedAt.getTime())
      );
      reset();
      setShowForm(false);
    } else {
      setErrorMessage(result.error || "スコアの保存に失敗しました");
    }
  }

  async function handleDelete(id: string) {
    setErrorMessage(null);
    const result = await deleteScoreAction(id);
    if (result.success) {
      setScores((prev) => prev.filter((s) => s.id !== id));
    } else {
      setErrorMessage(result.error || "スコアの削除に失敗しました");
    }
  }

  return (
    <div className="space-y-4">
      {/* エラーメッセージ */}
      {errorMessage && (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-xs text-red-600">
          <AlertCircle className="size-3.5 shrink-0 mt-0.5" />
          <span className="flex-1">{errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-red-400 hover:text-red-600"
            aria-label="閉じる"
          >
            ×
          </button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-medium text-stone-800">ラウンドスコア</h2>
          <p className="text-xs text-stone-400 mt-0.5">{scores.length}件のスコア</p>
        </div>
        <Button
          size="sm"
          onClick={() => setShowForm((v) => !v)}
          className="rounded-full bg-stone-800 hover:bg-stone-700 text-xs gap-1.5"
        >
          <Plus className="size-3.5" />
          スコアを追加
        </Button>
      </div>

      {showForm && (
        <div className="rounded-2xl bg-white ring-1 ring-stone-100 shadow-sm p-5">
          <h3 className="text-sm font-medium text-stone-700 mb-4">新しいスコアを記録</h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs text-stone-600">プレー日</label>
                <Input type="date" className="text-sm" {...register("playedAt", { required: true })} />
                {errors.playedAt && <p className="text-xs text-red-500">日付を入力してください</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-stone-600">コース名</label>
                <Input placeholder="○○カントリークラブ" className="text-sm" {...register("courseName", { required: true, maxLength: 100 })} />
                {errors.courseName && <p className="text-xs text-red-500">コース名を入力してください</p>}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs text-stone-600">合計スコア</label>
                <Input type="number" placeholder="98" className="text-sm" {...register("score", { required: true, min: 60, max: 200 })} />
                {errors.score && <p className="text-xs text-red-500">60〜200で入力</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-stone-600">OUT</label>
                <Input type="number" placeholder="50" className="text-sm" {...register("outScore", { min: 30, max: 100 })} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-stone-600">IN</label>
                <Input type="number" placeholder="48" className="text-sm" {...register("inScore", { min: 30, max: 100 })} />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-stone-600">パット数（任意）</label>
              <Input type="number" placeholder="34" className="text-sm w-32" {...register("putts", { min: 18, max: 72 })} />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-stone-600">メモ（任意）</label>
              <Textarea placeholder="今日の課題・気づきなど" rows={3} className="resize-none text-sm" {...register("memo", { maxLength: 500 })} />
            </div>

            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" size="sm" onClick={() => { setShowForm(false); reset(); }} className="rounded-full border-stone-300 text-xs">
                キャンセル
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting} className="rounded-full bg-stone-800 hover:bg-stone-700 text-xs">
                {isSubmitting ? "保存中..." : "保存する"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {scores.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-stone-200 py-14 text-center">
          <Flag className="mb-3 size-10 text-stone-300" />
          <p className="text-sm text-stone-500">スコアの記録がありません</p>
          <Button size="sm" onClick={() => setShowForm(true)} className="mt-5 rounded-full bg-stone-800 hover:bg-stone-700">
            最初のスコアを記録する
          </Button>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {scores.map((s) => {
            const isExpanded = expandedId === s.id;
            return (
              <li key={s.id} className="rounded-2xl bg-white ring-1 ring-stone-100 shadow-sm overflow-hidden">
                <button className="w-full text-left p-4 sm:p-5" onClick={() => setExpandedId(isExpanded ? null : s.id)}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-stone-800 text-sm truncate">{s.courseName}</p>
                      <p className="text-xs text-stone-400 mt-0.5">{format(s.playedAt, "yyyy年M月d日（E）", { locale: ja })}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-2xl font-light text-stone-800">{s.score}</p>
                        {s.outScore != null && s.inScore != null && (
                          <p className="text-[11px] text-stone-400">{s.outScore} / {s.inScore}</p>
                        )}
                      </div>
                      {isExpanded ? <ChevronUp className="size-4 text-stone-400" /> : <ChevronDown className="size-4 text-stone-400" />}
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 sm:px-5 pb-4 sm:pb-5 border-t border-stone-100 pt-3 space-y-3">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      {[
                        { label: "合計", value: s.score },
                        { label: "OUT", value: s.outScore },
                        { label: "IN", value: s.inScore },
                      ].map(({ label, value }) => (
                        <div key={label} className="rounded-xl bg-stone-50 py-2.5">
                          <p className="text-xs text-stone-400">{label}</p>
                          <p className="text-lg font-light text-stone-700 mt-0.5">{value ?? "—"}</p>
                        </div>
                      ))}
                    </div>
                    {s.putts != null && <p className="text-xs text-stone-500">パット数：{s.putts}</p>}
                    {s.memo && <p className="text-xs text-stone-600 leading-relaxed bg-stone-50 rounded-xl p-3">{s.memo}</p>}
                    <div className="flex justify-end pt-1">
                      <button onClick={() => handleDelete(s.id)} className="flex items-center gap-1 text-[11px] text-stone-400 hover:text-red-400 transition-colors">
                        <Trash2 className="size-3" />
                        削除
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
