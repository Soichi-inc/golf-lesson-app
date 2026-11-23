/**
 * 日時の扱いのテスト（npm test）
 *
 * サーバーは世界標準時、お客様の端末は日本時間で動く。どちらで実行しても
 * 同じ表示・同じ判定になることを確かめる（`TZ=UTC npm test` でも通ること）。
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  calendarDateKey,
  formatJst,
  isBeforeJstDay,
  isSameJstDay,
  isSameJstMonth,
  jstCalendarDate,
  jstCalendarDaysBetween,
  jstDateKey,
  jstDateTime,
} from "./datetime.ts";

// 2026-12-10 18:00（日本時間）のレッスン = 世界標準時では 09:00
const LESSON = "2026-12-10T09:00:00.000Z";
// 2026-12-15 07:39（日本時間）のラウンド = 世界標準時では前日 22:39
const EARLY_ROUND = "2026-12-14T22:39:00.000Z";

test("時刻は実行環境に関係なく日本時間で表示される", () => {
  assert.equal(formatJst(LESSON, "yyyy年M月d日（E） HH:mm"), "2026年12月10日（木） 18:00");
  assert.equal(formatJst(new Date(LESSON), "HH:mm"), "18:00");
  // 朝早い枠は、世界標準時では前日になる。日本時間の日付で表示されること
  assert.equal(formatJst(EARLY_ROUND, "M月d日（E） HH:mm"), "12月15日（火） 07:39");
  assert.equal(jstDateKey(EARLY_ROUND), "2026-12-15");
});

test("日付だけ入力された値（世界標準時の 0 時で保存）は、同じ日付で表示される", () => {
  assert.equal(formatJst("2026-12-20T00:00:00.000Z", "yyyy年M月d日"), "2026年12月20日");
});

test("同じ日・同じ月・前の日の判定は日本時間の暦で行う", () => {
  // 日本時間 11/24 01:00（世界標準時では 11/23 16:00）
  const lateNight = "2026-11-23T16:00:00.000Z";
  assert.equal(jstDateKey(lateNight), "2026-11-24");
  assert.ok(isSameJstDay(lateNight, "2026-11-24T09:00:00.000Z"));
  assert.ok(!isSameJstDay(lateNight, "2026-11-23T05:00:00.000Z"));
  // 日本時間 12/1 03:00 は、世界標準時ではまだ 11 月
  assert.ok(isSameJstMonth("2026-11-30T18:00:00.000Z", "2026-12-15T03:00:00.000Z"));
  assert.ok(isBeforeJstDay("2026-11-23T05:00:00.000Z", lateNight));
  assert.ok(!isBeforeJstDay("2026-11-23T20:00:00.000Z", lateNight));
});

test("キャンセル期限の日数は日本時間の暦日で数える", () => {
  // 12/3 の夜 23:30 → 12/10 の朝 08:00 のレッスン: 7 日前
  assert.equal(jstCalendarDaysBetween("2026-12-03T14:30:00.000Z", "2026-12-09T23:00:00.000Z"), 7);
  // 12/4 の深夜 03:00 → 12/10 18:00 のレッスン: 6 日前（世界標準時で数えると 7 になってしまう）
  assert.equal(jstCalendarDaysBetween("2026-12-03T18:00:00.000Z", LESSON), 6);
  // 当日
  assert.equal(jstCalendarDaysBetween("2026-12-09T15:30:00.000Z", LESSON), 0);
});

test("管理画面で入力した日付と時刻は、日本時間の日時として保存される", () => {
  assert.equal(jstDateTime("2026-12-10", "18:00").toISOString(), LESSON);
  assert.equal(jstDateTime("2026-12-15", "07:39").toISOString(), EARLY_ROUND);
});

test("カレンダーのマス目とは、日本時間の年月日で突き合わせる", () => {
  const cell = jstCalendarDate(EARLY_ROUND);
  assert.equal(calendarDateKey(cell), "2026-12-15");
  assert.equal(calendarDateKey(cell), jstDateKey(EARLY_ROUND));
  // マス目はローカル時刻の 0 時を指す
  assert.equal(cell.getHours(), 0);
  assert.equal(cell.getDate(), 15);
});
