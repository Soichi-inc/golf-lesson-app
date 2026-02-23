"use server";

import { readJsonFromStorage, writeJsonToStorage } from "@/lib/storage";

// レッスンプランの型
export type PlanData = {
  id: string;
  name: string;
  category: "REGULAR" | "ROUND" | "ONLINE";
  tagLabel: string;
  price: number;
  priceNote?: string;
  duration: number;
  maxAttendees: number;
  isPublished: boolean;
  details: string[];
};

// デフォルトデータ
const defaultPlans: PlanData[] = [
  {
    id: "plan-private-50",
    name: "プライベートレッスン 50分",
    category: "REGULAR",
    tagLabel: "インドア",
    price: 13000,
    duration: 50,
    maxAttendees: 1,
    isPublished: true,
    details: [
      "golf next24　+¥2,200（80分）",
      "the golf house　+¥5,500（60分）",
      "PGL パーソナルゴルフラウンジ　+¥4,400（55分）",
    ],
  },
  {
    id: "plan-round",
    name: "ラウンドレッスン",
    category: "ROUND",
    tagLabel: "ラウンド",
    price: 17000,
    priceNote: "1名あたり（3名の場合）",
    duration: 240,
    maxAttendees: 3,
    isPublished: true,
    details: [
      "1名 ¥17,000（3名の場合）",
      "1組 ¥50,000（ご友人・お知り合い3名）",
      "別途ラウンド費（プロ料金含む）",
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

export async function savePlans(
  plans: PlanData[]
): Promise<{ success: boolean; error?: string }> {
  try {
    await writeJsonToStorage(PLANS_PATH, plans);
    return { success: true };
  } catch (err) {
    console.error("[savePlans] error:", err);
    return { success: false, error: "レッスンプランの保存に失敗しました" };
  }
}

export async function deletePlan(
  planId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const plans = await getPlans();
    const filtered = plans.filter((p) => p.id !== planId);
    return savePlans(filtered);
  } catch (err) {
    console.error("[deletePlan] error:", err);
    return { success: false, error: "プランの削除に失敗しました" };
  }
}
