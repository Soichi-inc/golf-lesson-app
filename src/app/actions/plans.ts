"use server";

import { readJsonFromStorage, writeJsonToStorage } from "@/lib/storage";
import { requireAdmin, handleActionError } from "@/lib/auth/guard";

// レッスンプランの型
export type PlanData = {
  id: string;
  name: string;
  category: "REGULAR" | "ROUND" | "ONLINE";
  tagLabel: string;
  price: number;
  /** 価格に「〜」を付けて下限であることを示す */
  priceFrom?: boolean;
  priceNote?: string;
  duration: number;
  maxAttendees: number;
  isPublished: boolean;
  /** プランの簡単な説明（カード冒頭に表示） */
  description?: string;
  /** ハイライトの箇条書き（カード中部にCheckアイコン付きで表示） */
  highlights?: string[];
  /** 料金の詳細・注意事項（カード下部に表示） */
  details: string[];
};

// デフォルトデータ
const defaultPlans: PlanData[] = [
  {
    id: "plan-private-50",
    name: "プライベートレッスン 50分",
    category: "REGULAR",
    tagLabel: "プライベートレッスン",
    price: 13000,
    duration: 50,
    maxAttendees: 1,
    isPublished: true,
    description: "マンツーマンで丁寧に指導。SPORTS BOX AI分析も対応します。",
    highlights: [
      "スイングの課題を分析・改善",
      "TrackMan / SPORTS BOX AI 分析対応",
      "動画撮影＆フィードバック付き",
    ],
    details: [
      "golf next24　+¥2,200（80分）",
      "the golf house　+¥5,500（60分）",
    ],
  },
  {
    id: "plan-round",
    name: "ラウンドレッスン",
    category: "ROUND",
    tagLabel: "ラウンドレッスン",
    price: 25000,
    priceFrom: true,
    priceNote: "レッスン料金 1名あたり",
    duration: 240,
    maxAttendees: 3,
    isPublished: true,
    description: "コースを回りながら実戦的なマネジメントを指導。関東圏内対応。",
    highlights: [
      "コースマネジメントを実践で学ぶ",
      "ラウンド前後にフィードバック",
      "動画撮影でフォーム確認",
    ],
    details: [
      "貸切予約：1名 ¥50,000 / 2名 ¥30,000・人 / 3名 ¥20,000・人",
      "組み合わせ予約：¥25,000 / 人（2名以上で成立）",
      "上記はレッスン料金。プレー代（コース代等）はお客様負担",
      "お客様指定コースの場合は、講師のラウンド代・食事・交通費を別途",
      "早朝・ナイターは別途料金をいただくことがあります",
    ],
  },
  {
    id: "plan-online",
    name: "オンラインレッスン",
    category: "ONLINE",
    tagLabel: "オンライン",
    price: 3000,
    duration: 25,
    maxAttendees: 1,
    isPublished: true,
    description: "スマホ1台で受講できるオンラインレッスン。フィードバック付き。",
    highlights: [
      "場所を選ばずどこからでも受講可能",
      "体験レッスン ¥1,000 で気軽にお試し",
      "スイング動画を送るだけでOK",
    ],
    details: [
      "25分 ¥3,000（フィードバックあり）",
      "体験レッスン 25分 ¥1,000",
    ],
  },
];

const PLANS_PATH = "plans.json";

export async function getPlans(): Promise<PlanData[]> {
  return readJsonFromStorage<PlanData[]>(PLANS_PATH, defaultPlans);
}

/** プラン保存（ADMIN専用） */
export async function savePlans(
  plans: PlanData[]
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
    await writeJsonToStorage(PLANS_PATH, plans);
    return { success: true };
  } catch (err) {
    return handleActionError(err, "レッスンプランの保存に失敗しました");
  }
}

/** プラン削除（ADMIN専用） */
export async function deletePlan(
  planId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
    const plans = await getPlans();
    const filtered = plans.filter((p) => p.id !== planId);
    await writeJsonToStorage(PLANS_PATH, filtered);
    return { success: true };
  } catch (err) {
    return handleActionError(err, "プランの削除に失敗しました");
  }
}
