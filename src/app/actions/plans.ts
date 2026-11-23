"use server";

import { z } from "zod";
import { readJsonFromStorage, updateJsonInStorage } from "@/lib/storage";
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
      "レッスン中の動画撮影＆その場でフィードバック",
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
      "貸切予約：1名 ¥50,000 / 2名 ¥30,000・人 / 3名 ¥25,000・人",
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
    price: 1500,
    priceFrom: true,
    duration: 25,
    maxAttendees: 1,
    isPublished: true,
    description: "スマホ1台で受講できるオンライン指導。スイング動画にプロが丁寧にフィードバック。",
    highlights: [
      "場所を選ばずどこからでも受講可能",
      "ワンポイントアドバイス ¥1,500〜 でお手軽に",
      "スイング動画を送るだけでOK",
    ],
    details: [
      "ワンポイントアドバイス ¥1,500〜（スイング動画送付＋アドバイス）",
      "オンラインレッスン 25分 ¥3,000（フィードバックあり）",
      "日程はLINEにてお問い合わせください",
    ],
  },
];

const PLANS_PATH = "plans.json";

/** 保存前の検証（編集ダイアログの入力ルールと同じ） */
const planSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  category: z.enum(["REGULAR", "ROUND", "ONLINE"]),
  tagLabel: z.string().min(1),
  price: z.number().min(0),
  priceFrom: z.boolean().optional(),
  priceNote: z.string().optional(),
  duration: z.number().min(1),
  maxAttendees: z.number().min(1),
  isPublished: z.boolean(),
  description: z.string().optional(),
  highlights: z.array(z.string()).optional(),
  details: z.array(z.string()),
});

type PlanResult = { success: boolean; plans?: PlanData[]; error?: string };

export async function getPlans(): Promise<PlanData[]> {
  return readJsonFromStorage<PlanData[]>(PLANS_PATH, defaultPlans, { shape: "array" });
}

/**
 * プランを 1 件だけ追加または更新する（ADMIN専用）
 *
 * 画面が持っている一覧をまるごと送って保存する方式は取らない。
 * スマホと PC など 2 つの画面で管理画面を開いていると、古い一覧で保存した側が
 * もう一方の変更を消してしまうため。保存後の最新の一覧を返すので、
 * 画面側はそれで表示を更新する。
 */
export async function upsertPlan(plan: PlanData): Promise<PlanResult> {
  try {
    await requireAdmin();
    const parsed = planSchema.safeParse(plan);
    if (!parsed.success) {
      return { success: false, error: "入力内容を確認してください" };
    }
    const next: PlanData = parsed.data;

    const plans = await updateJsonInStorage<PlanData[], PlanData[]>(
      PLANS_PATH,
      defaultPlans,
      (current) => {
        const updated = current.some((p) => p.id === next.id)
          ? current.map((p) => (p.id === next.id ? next : p))
          : [...current, next];
        return { data: updated, result: updated };
      },
      { shape: "array" }
    );
    return { success: true, plans };
  } catch (err) {
    return handleActionError(err, "レッスンプランの保存に失敗しました");
  }
}

/** プラン削除（ADMIN専用）。削除後の最新の一覧を返す */
export async function deletePlan(planId: string): Promise<PlanResult> {
  try {
    await requireAdmin();
    const plans = await updateJsonInStorage<PlanData[], PlanData[]>(
      PLANS_PATH,
      defaultPlans,
      (current) => {
        const updated = current.filter((p) => p.id !== planId);
        return { data: updated, result: updated };
      },
      { shape: "array" }
    );
    return { success: true, plans };
  } catch (err) {
    return handleActionError(err, "プランの削除に失敗しました");
  }
}
