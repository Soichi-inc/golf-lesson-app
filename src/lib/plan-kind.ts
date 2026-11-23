import type { PlanData } from "@/app/actions/plans";

/**
 * レッスンに追加する有料オプション（例: スイング動画＋ポイント解説）か。
 *
 * オプションは単独で日程を決めるものではなく、予約フォームで選ぶもの。
 * オンラインレッスンと同じ「日程は LINE で」の案内を出すと誤解を招くので、
 * プラン一覧ではこの判定で案内を出し分ける。
 * 管理画面の「表示タグ」に「オプション」を含むプランをオプションとして扱う。
 */
export function isAddOnPlan(plan: Pick<PlanData, "id" | "tagLabel">): boolean {
  return plan.id === "plan-video" || plan.tagLabel.includes("オプション");
}
