/**
 * インドアレッスン「場所リクエスト枠」料金体系
 *
 * 既存店舗を選んだ場合は通常の schedule.lessonPlan.price（¥13,000/50分）を使用する。
 * 任意の場所をリクエストした場合は時間（50/70分）と4回チケット利用有無で下記の料金を適用する。
 * ※場所代金・ボール代金等は別途お客様負担。
 */

import type { IndoorFlexDuration } from "@/types";

export const INDOOR_FLEX_PRICES: Record<
  IndoorFlexDuration,
  { single: number; ticketPack: number }
> = {
  50: { single: 15500, ticketPack: 14000 },
  70: { single: 21000, ticketPack: 20000 },
};

export const INDOOR_FLEX_DURATIONS: IndoorFlexDuration[] = [50, 70];

export function calcIndoorFlexPrice(
  duration: IndoorFlexDuration,
  usesTicketPack: boolean
): number {
  const prices = INDOOR_FLEX_PRICES[duration];
  return usesTicketPack ? prices.ticketPack : prices.single;
}
