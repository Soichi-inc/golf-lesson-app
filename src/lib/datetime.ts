/**
 * 日時の表示・日付の計算は、必ず日本時間（Asia/Tokyo）で行う。
 *
 * サーバー（Vercel）は世界標準時で動いているため、date-fns の format() や
 * isSameDay() / startOfDay() をそのまま使うと、サーバーで作られる画面は
 * 9 時間ずれた時刻・日付になる（例: 18:00 のレッスンが 09:00 と表示される、
 * 日本時間の 0〜9 時は「今日」が前日扱いになる）。
 * お客様の端末で動く部品も、最初の表示はサーバーで作られるので同じ影響を受ける。
 *
 * このファイルの関数は、実行環境のタイムゾーンに関係なく同じ結果を返す。
 * 日時を画面に出すとき・日付をまたぐ判定をするときは、ここの関数を使うこと。
 *
 * ⚠️ Next.js に依存させないこと（Node 単体のテストから読み込む）。
 */
import { differenceInCalendarDays, format } from "date-fns";
import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz";
import { ja } from "date-fns/locale";

export const APP_TIME_ZONE = "Asia/Tokyo";

type DateInput = Date | string | number;

/** 日本時間で整形する（曜日などは日本語）。例: formatJst(d, "yyyy年M月d日（E） HH:mm") */
export function formatJst(date: DateInput, pattern: string): string {
  return formatInTimeZone(date, APP_TIME_ZONE, pattern, { locale: ja });
}

/** 日本時間での日付（yyyy-MM-dd）。同じ日かどうかの比較や並べ替えに使う */
export function jstDateKey(date: DateInput): string {
  return formatInTimeZone(date, APP_TIME_ZONE, "yyyy-MM-dd");
}

/** 日本時間での年月（yyyy-MM） */
export function jstMonthKey(date: DateInput): string {
  return formatInTimeZone(date, APP_TIME_ZONE, "yyyy-MM");
}

/** 日本時間で同じ日か */
export function isSameJstDay(a: DateInput, b: DateInput): boolean {
  return jstDateKey(a) === jstDateKey(b);
}

/** 日本時間で同じ月か */
export function isSameJstMonth(a: DateInput, b: DateInput): boolean {
  return jstMonthKey(a) === jstMonthKey(b);
}

/** 日本時間で、date の日付が base（省略時は現在）の日付より前か */
export function isBeforeJstDay(date: DateInput, base: DateInput = new Date()): boolean {
  return jstDateKey(date) < jstDateKey(base);
}

/**
 * 日本時間の暦で、from の日から to の日まで何日あるか。
 * 例: 12/3 の夜 → 12/10 の朝 は 7。キャンセル期限（7 日前まで）の判定に使う。
 */
export function jstCalendarDaysBetween(from: DateInput, to: DateInput): number {
  return differenceInCalendarDays(
    toZonedTime(to, APP_TIME_ZONE),
    toZonedTime(from, APP_TIME_ZONE)
  );
}

/**
 * 日本時間の「年月日 + 時刻」から、その瞬間を表す Date を作る。
 * 管理画面の入力（日付と時刻の文字列）を保存用の日時に直すときに使う。
 * 例: jstDateTime("2026-12-10", "18:00")
 */
export function jstDateTime(date: string, time: string): Date {
  return fromZonedTime(`${date}T${time}:00`, APP_TIME_ZONE);
}

// ---------------------------------------------------------------------------
// カレンダー部品（react-day-picker）との受け渡し
//
// カレンダーのマス目は「実行環境のローカル時刻での年月日」を持つ Date で表される。
// マス目は瞬間ではなく暦の日付なので、突き合わせは yyyy-MM-dd の文字列で行う。
// ---------------------------------------------------------------------------

/** カレンダーのマス目（ローカル時刻の Date）の日付（yyyy-MM-dd） */
export function calendarDateKey(cell: Date): string {
  return format(cell, "yyyy-MM-dd");
}

/** 日本時間の日付を、カレンダーのマス目と同じ形（ローカル時刻の年月日）の Date にする */
export function jstCalendarDate(date: DateInput = new Date()): Date {
  const [year, month, day] = jstDateKey(date).split("-").map(Number);
  return new Date(year, month - 1, day);
}

/** カレンダーのマス目の日付を、日本語の表記にする。例: "12月10日（木）" */
export function formatCalendarDate(cell: Date, pattern: string): string {
  return format(cell, pattern, { locale: ja });
}
