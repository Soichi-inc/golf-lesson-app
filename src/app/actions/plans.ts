"use server";

import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";

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
    id: "plan-private-80",
    name: "プライベートレッスン 80分",
    category: "REGULAR",
    tagLabel: "インドア",
    price: 18000,
    duration: 80,
    maxAttendees: 1,
    isPublished: true,
    details: [
      "チケット購入でお得",
      "5回チケット（PGL）¥16,500 → 1回¥3,300",
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

const DATA_DIR = path.join(process.cwd(), "data");
const PLANS_PATH = path.join(DATA_DIR, "plans.json");

export async function getPlans(): Promise<PlanData[]> {
  try {
    const raw = await readFile(PLANS_PATH, "utf-8");
    return JSON.parse(raw) as PlanData[];
  } catch {
    return defaultPlans;
  }
}

export async function savePlans(
  plans: PlanData[]
): Promise<{ success: boolean; error?: string }> {
  try {
    await mkdir(DATA_DIR, { recursive: true });
    await writeFile(PLANS_PATH, JSON.stringify(plans, null, 2), "utf-8");
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
