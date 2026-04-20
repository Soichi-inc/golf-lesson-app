/**
 * ラウンドレッスン 料金計算モジュール
 *
 * 料金体系（クライアント/サーバー共用）:
 * - 貸切予約（private）: 参加人数に応じて1人あたり料金が変わる
 *   - 1名（マンツーマン）: ¥50,000
 *   - 2名: ¥30,000/人（合計¥60,000）
 *   - 3名: ¥20,000/人（合計¥60,000）
 * - 組み合わせ予約（shared）: 他のお客様と相席
 *   - ¥25,000/人（2名以上集まったら開催）
 *
 * ※ 別途プレー費（コースにより異なる）が発生
 */

export type RoundBookingType = "private" | "shared";

// 貸切の場合の1人あたり単価テーブル
export const PRIVATE_PRICE_PER_PERSON: Record<1 | 2 | 3, number> = {
  1: 50000,
  2: 30000,
  3: 20000,
};

// 組み合わせ予約の1人あたり単価
export const SHARED_PRICE_PER_PERSON = 25000;

// 貸切の最大人数
export const MAX_PRIVATE_PARTICIPANTS = 3;

/**
 * ラウンドレッスンの合計料金を計算
 * @param bookingType 貸切か組み合わせか
 * @param participantCount 貸切時の人数（1-3）。shared時は常に1
 */
export function calcRoundPrice(
  bookingType: RoundBookingType,
  participantCount: number
): number {
  if (bookingType === "shared") {
    return SHARED_PRICE_PER_PERSON;
  }
  const n = Math.max(1, Math.min(MAX_PRIVATE_PARTICIPANTS, participantCount)) as 1 | 2 | 3;
  return PRIVATE_PRICE_PER_PERSON[n] * n;
}

/**
 * 予約が消費する「席数」を返す
 * - 貸切: 人数分消費
 * - 組み合わせ: 1席のみ
 */
export function roundSeatsConsumed(
  bookingType: RoundBookingType,
  participantCount: number
): number {
  if (bookingType === "shared") return 1;
  return Math.max(1, Math.min(MAX_PRIVATE_PARTICIPANTS, participantCount));
}

/**
 * UI表示用の料金内訳テキスト
 */
export function formatRoundPriceBreakdown(
  bookingType: RoundBookingType,
  participantCount: number
): string {
  if (bookingType === "shared") {
    return `¥${SHARED_PRICE_PER_PERSON.toLocaleString()} / 人`;
  }
  const n = Math.max(1, Math.min(MAX_PRIVATE_PARTICIPANTS, participantCount)) as 1 | 2 | 3;
  const per = PRIVATE_PRICE_PER_PERSON[n];
  if (n === 1) return `¥${per.toLocaleString()}（マンツーマン）`;
  return `¥${per.toLocaleString()} / 人 × ${n}名`;
}
