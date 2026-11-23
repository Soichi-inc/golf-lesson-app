"use server";

import { readJsonFromStorage, updateJsonInStorage } from "@/lib/storage";
import { requireAdmin, handleActionError } from "@/lib/auth/guard";

// プロフィールデータの型
export type ProfileData = {
  name: string;
  nameEn: string;
  title: string;
  image: string;
  instagram: string;
  email: string;
  bio: string;
  qualifications: string[];
  teachingPhilosophy: string[];
  locations: { name: string; area: string }[];
};

// デフォルト値（初期データ）
const defaultProfile: ProfileData = {
  name: "奥村真由美",
  nameEn: "Mayumi Okumura",
  title: "LPGA ティーチングプロフェッショナル会員",
  image: "/mayumi.jpg",
  instagram: "@mayumi_gf",
  email: "mayumi_okumura@outlook.com",
  bio: "ゴルフの楽しさをすべての方にお届けします。初心者の方から経験者の方まで、一人ひとりに合った指導でスコアアップのお手伝いをいたします。",
  qualifications: [
    "LPGA ティーチングプロフェッショナル会員",
    "TrackMan 認定インストラクター",
    "SPORTS BOX AI 認定コーチ",
  ],
  teachingPhilosophy: [
    "一人ひとりに合わせたカスタマイズ指導",
    "最新テクノロジー（TrackMan・SPORTS BOX AI）活用",
    "楽しく続けられるレッスン環境づくり",
    "初心者からシングルまで幅広く対応",
  ],
  locations: [
    { name: "the golf house 京橋・白金高輪・武蔵小山", area: "東京" },
    { name: "golf next24 中川・武蔵中原・藤沢善行", area: "横浜・川崎・藤沢" },
  ],
};

const PROFILE_PATH = "profile.json";

export async function getProfile(): Promise<ProfileData> {
  return readJsonFromStorage<ProfileData>(PROFILE_PATH, defaultProfile, {
    shape: "object",
  });
}

/** プロフィール保存（ADMIN専用） */
export async function saveProfile(
  data: ProfileData
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
    // プロフィールは 1 つのフォームでまるごと編集するデータなので、全体を置き換える
    await updateJsonInStorage<ProfileData, null>(
      PROFILE_PATH,
      defaultProfile,
      () => ({ data, result: null }),
      { shape: "object" }
    );
    return { success: true };
  } catch (err) {
    return handleActionError(err, "プロフィールの保存に失敗しました");
  }
}
