import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Flag, MapPin, MessageCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { RoundScore } from "@/types";

type Props = {
  scores: RoundScore[];
};

export function RoundScoreHistory({ scores }: Props) {
  if (scores.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-stone-400 border-2 border-dashed rounded-xl">
        <Flag className="size-8 mb-2 opacity-40" />
        <p className="text-sm">ラウンドスコアがありません</p>
      </div>
    );
  }

  const sorted = [...scores].sort(
    (a, b) =>
      new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime()
  );

  return (
    <div className="space-y-3">
      {sorted.map((score) => (
        <Card key={score.id} className="bg-white">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                {/* コース名 + 日付 */}
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <p className="font-medium text-stone-800 text-sm">
                    {score.courseName}
                  </p>
                </div>

                <div className="flex flex-col gap-1 text-xs text-stone-500">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="size-3" />
                    {format(new Date(score.playedAt), "yyyy年M月d日（E）", {
                      locale: ja,
                    })}
                  </span>
                </div>

                {/* 詳細スコア */}
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-stone-500">
                  {score.outScore != null && (
                    <span>
                      OUT: <span className="font-medium text-stone-700">{score.outScore}</span>
                    </span>
                  )}
                  {score.inScore != null && (
                    <span>
                      IN: <span className="font-medium text-stone-700">{score.inScore}</span>
                    </span>
                  )}
                  {score.putts != null && (
                    <span>
                      パット: <span className="font-medium text-stone-700">{score.putts}</span>
                    </span>
                  )}
                </div>

                {/* メモ */}
                {score.memo && (
                  <div className="mt-2 flex items-start gap-1.5 text-xs text-stone-500 bg-stone-50 rounded px-2 py-1.5">
                    <MessageCircle className="size-3 shrink-0 mt-0.5" />
                    <span>{score.memo}</span>
                  </div>
                )}
              </div>

              {/* トータルスコア */}
              <div className="text-right shrink-0">
                <p className="text-2xl font-semibold text-stone-800">
                  {score.score}
                </p>
                <p className="text-[10px] text-stone-400">SCORE</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
