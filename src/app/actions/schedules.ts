"use server";

import { readJsonFromStorage, writeJsonToStorage } from "@/lib/storage";
import type { LessonPlan, Schedule, LessonCategory } from "@/types";

// ---------------------------------------------------------------------------
// JSON保存用の型（Date は ISO文字列）
// ---------------------------------------------------------------------------

type LessonPlanRecord = {
  id: string;
  name: string;
  category: LessonCategory;
  description: string | null;
  price: number;
  duration: number;
  maxAttendees: number;
  isPublished: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
};

type ScheduleRecord = {
  id: string;
  lessonPlanId: string;
  lessonPlan: LessonPlanRecord;
  startAt: string;
  endAt: string;
  location: string | null;
  maxAttendees: number;
  isAvailable: boolean;
  note: string | null;
  teeOffTime: string | null;
  createdAt: string;
  updatedAt: string;
};

// ---------------------------------------------------------------------------
// デフォルトデータ（初回読み込み時のシード用 — mockSchedules と同等）
// ---------------------------------------------------------------------------

const defaultLessonPlans: LessonPlanRecord[] = [
  {
    id: "plan-indoor",
    name: "インドアゴルフレッスン（50分）",
    category: "REGULAR",
    description: "打席でのスイング基礎・課題改善レッスン",
    price: 13000,
    duration: 50,
    maxAttendees: 1,
    isPublished: true,
    displayOrder: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "plan-round-28000",
    name: "ラウンドレッスン",
    category: "ROUND",
    description: "コースを回りながら実戦的なマネジメントを指導",
    price: 28000,
    duration: 300,
    maxAttendees: 4,
    isPublished: true,
    displayOrder: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "plan-round-30000",
    name: "ラウンドレッスン",
    category: "ROUND",
    description: "コースを回りながら実戦的なマネジメントを指導",
    price: 30000,
    duration: 300,
    maxAttendees: 4,
    isPublished: true,
    displayOrder: 2,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "plan-round-32000",
    name: "ラウンドレッスン",
    category: "ROUND",
    description: "コースを回りながら実戦的なマネジメントを指導",
    price: 32000,
    duration: 300,
    maxAttendees: 4,
    isPublished: true,
    displayOrder: 3,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

const pI = defaultLessonPlans[0];
const pR28 = defaultLessonPlans[1];
const pR30 = defaultLessonPlans[2];
const pR32 = defaultLessonPlans[3];

const defaultSchedules: ScheduleRecord[] = [
  // ラウンドレッスン (3月)
  { id: "sch-r1", lessonPlanId: "plan-round-28000", lessonPlan: pR28, startAt: "2026-03-08T01:20:00.000Z", endAt: "2026-03-08T07:00:00.000Z", location: "御殿場東名カントリークラブ", maxAttendees: 4, isAvailable: true, note: "練習＋ハーフ(9H) ※練習コイン・昼食別", teeOffTime: "10:20", createdAt: "2026-02-01T00:00:00.000Z", updatedAt: "2026-02-01T00:00:00.000Z" },
  { id: "sch-r2", lessonPlanId: "plan-round-30000", lessonPlan: pR30, startAt: "2026-03-25T22:57:00.000Z", endAt: "2026-03-26T07:00:00.000Z", location: "東名厚木カントリークラブ (in→west)", maxAttendees: 4, isAvailable: true, note: "プレー費・レッスン費・指定昼食付", teeOffTime: "7:57", createdAt: "2026-02-01T00:00:00.000Z", updatedAt: "2026-02-01T00:00:00.000Z" },
  { id: "sch-r3", lessonPlanId: "plan-round-32000", lessonPlan: pR32, startAt: "2026-03-29T00:25:00.000Z", endAt: "2026-03-29T07:00:00.000Z", location: "大厚木カントリークラブ 桜コース", maxAttendees: 4, isAvailable: true, note: "練習＋ハーフ(9H) ※練習コイン・昼食別", teeOffTime: "9:25", createdAt: "2026-02-01T00:00:00.000Z", updatedAt: "2026-02-01T00:00:00.000Z" },
  { id: "sch-r4", lessonPlanId: "plan-round-30000", lessonPlan: pR30, startAt: "2026-03-29T22:39:00.000Z", endAt: "2026-03-30T07:00:00.000Z", location: "ムーンレイク茂原ゴルフクラブ", maxAttendees: 4, isAvailable: true, note: "プレー費・レッスン費・指定昼食付", teeOffTime: "7:39", createdAt: "2026-02-01T00:00:00.000Z", updatedAt: "2026-02-01T00:00:00.000Z" },
  // インドアゴルフレッスン (3月)
  { id: "i-0301a", lessonPlanId: "plan-indoor", lessonPlan: pI, startAt: "2026-03-01T08:00:00.000Z", endAt: "2026-03-01T08:50:00.000Z", location: "the golf house 京橋八丁堀（東京）", maxAttendees: 1, isAvailable: true, note: null, teeOffTime: null, createdAt: "2026-02-01T00:00:00.000Z", updatedAt: "2026-02-01T00:00:00.000Z" },
  { id: "i-0301b", lessonPlanId: "plan-indoor", lessonPlan: pI, startAt: "2026-03-01T09:00:00.000Z", endAt: "2026-03-01T09:50:00.000Z", location: "the golf house 京橋八丁堀（東京）", maxAttendees: 1, isAvailable: true, note: null, teeOffTime: null, createdAt: "2026-02-01T00:00:00.000Z", updatedAt: "2026-02-01T00:00:00.000Z" },
  { id: "i-0302a", lessonPlanId: "plan-indoor", lessonPlan: pI, startAt: "2026-03-02T09:00:00.000Z", endAt: "2026-03-02T09:50:00.000Z", location: "golf next24 武蔵中原（横浜）", maxAttendees: 1, isAvailable: true, note: null, teeOffTime: null, createdAt: "2026-02-01T00:00:00.000Z", updatedAt: "2026-02-01T00:00:00.000Z" },
  { id: "i-0303a", lessonPlanId: "plan-indoor", lessonPlan: pI, startAt: "2026-03-03T01:30:00.000Z", endAt: "2026-03-03T02:20:00.000Z", location: "golf next24 中川（横浜）", maxAttendees: 1, isAvailable: true, note: null, teeOffTime: null, createdAt: "2026-02-01T00:00:00.000Z", updatedAt: "2026-02-01T00:00:00.000Z" },
  { id: "i-0304a", lessonPlanId: "plan-indoor", lessonPlan: pI, startAt: "2026-03-04T07:00:00.000Z", endAt: "2026-03-04T07:50:00.000Z", location: "the golf house 京橋八丁堀（東京）", maxAttendees: 1, isAvailable: true, note: null, teeOffTime: null, createdAt: "2026-02-01T00:00:00.000Z", updatedAt: "2026-02-01T00:00:00.000Z" },
  { id: "i-0304b", lessonPlanId: "plan-indoor", lessonPlan: pI, startAt: "2026-03-04T08:00:00.000Z", endAt: "2026-03-04T08:50:00.000Z", location: "the golf house 京橋八丁堀（東京）", maxAttendees: 1, isAvailable: true, note: null, teeOffTime: null, createdAt: "2026-02-01T00:00:00.000Z", updatedAt: "2026-02-01T00:00:00.000Z" },
  { id: "i-0306a", lessonPlanId: "plan-indoor", lessonPlan: pI, startAt: "2026-03-06T01:30:00.000Z", endAt: "2026-03-06T02:20:00.000Z", location: "golf next24 中川（横浜）", maxAttendees: 1, isAvailable: true, note: null, teeOffTime: null, createdAt: "2026-02-01T00:00:00.000Z", updatedAt: "2026-02-01T00:00:00.000Z" },
  { id: "i-0309a", lessonPlanId: "plan-indoor", lessonPlan: pI, startAt: "2026-03-09T03:00:00.000Z", endAt: "2026-03-09T03:50:00.000Z", location: "場所調整可（要相談）", maxAttendees: 1, isAvailable: true, note: null, teeOffTime: null, createdAt: "2026-02-01T00:00:00.000Z", updatedAt: "2026-02-01T00:00:00.000Z" },
  { id: "i-0309b", lessonPlanId: "plan-indoor", lessonPlan: pI, startAt: "2026-03-09T04:00:00.000Z", endAt: "2026-03-09T04:50:00.000Z", location: "場所調整可（要相談）", maxAttendees: 1, isAvailable: true, note: null, teeOffTime: null, createdAt: "2026-02-01T00:00:00.000Z", updatedAt: "2026-02-01T00:00:00.000Z" },
  { id: "i-0309c", lessonPlanId: "plan-indoor", lessonPlan: pI, startAt: "2026-03-09T05:00:00.000Z", endAt: "2026-03-09T05:50:00.000Z", location: "場所調整可（要相談）", maxAttendees: 1, isAvailable: true, note: null, teeOffTime: null, createdAt: "2026-02-01T00:00:00.000Z", updatedAt: "2026-02-01T00:00:00.000Z" },
  { id: "i-0309d", lessonPlanId: "plan-indoor", lessonPlan: pI, startAt: "2026-03-09T06:00:00.000Z", endAt: "2026-03-09T06:50:00.000Z", location: "the golf house 京橋八丁堀（東京）", maxAttendees: 1, isAvailable: true, note: null, teeOffTime: null, createdAt: "2026-02-01T00:00:00.000Z", updatedAt: "2026-02-01T00:00:00.000Z" },
  { id: "i-0309e", lessonPlanId: "plan-indoor", lessonPlan: pI, startAt: "2026-03-09T07:00:00.000Z", endAt: "2026-03-09T07:50:00.000Z", location: "the golf house 京橋八丁堀（東京）", maxAttendees: 1, isAvailable: true, note: null, teeOffTime: null, createdAt: "2026-02-01T00:00:00.000Z", updatedAt: "2026-02-01T00:00:00.000Z" },
  { id: "i-0309f", lessonPlanId: "plan-indoor", lessonPlan: pI, startAt: "2026-03-09T08:00:00.000Z", endAt: "2026-03-09T08:50:00.000Z", location: "the golf house 京橋八丁堀（東京）", maxAttendees: 1, isAvailable: true, note: null, teeOffTime: null, createdAt: "2026-02-01T00:00:00.000Z", updatedAt: "2026-02-01T00:00:00.000Z" },
  { id: "i-0310a", lessonPlanId: "plan-indoor", lessonPlan: pI, startAt: "2026-03-10T01:30:00.000Z", endAt: "2026-03-10T02:20:00.000Z", location: "golf next24 中川（横浜）", maxAttendees: 1, isAvailable: true, note: null, teeOffTime: null, createdAt: "2026-02-01T00:00:00.000Z", updatedAt: "2026-02-01T00:00:00.000Z" },
  { id: "i-0311a", lessonPlanId: "plan-indoor", lessonPlan: pI, startAt: "2026-03-11T07:00:00.000Z", endAt: "2026-03-11T07:50:00.000Z", location: "the golf house 京橋八丁堀（東京）", maxAttendees: 1, isAvailable: true, note: null, teeOffTime: null, createdAt: "2026-02-01T00:00:00.000Z", updatedAt: "2026-02-01T00:00:00.000Z" },
  { id: "i-0311b", lessonPlanId: "plan-indoor", lessonPlan: pI, startAt: "2026-03-11T08:00:00.000Z", endAt: "2026-03-11T08:50:00.000Z", location: "the golf house 京橋八丁堀（東京）", maxAttendees: 1, isAvailable: true, note: null, teeOffTime: null, createdAt: "2026-02-01T00:00:00.000Z", updatedAt: "2026-02-01T00:00:00.000Z" },
  { id: "i-0313a", lessonPlanId: "plan-indoor", lessonPlan: pI, startAt: "2026-03-13T01:30:00.000Z", endAt: "2026-03-13T02:20:00.000Z", location: "golf next24 中川（横浜）", maxAttendees: 1, isAvailable: true, note: null, teeOffTime: null, createdAt: "2026-02-01T00:00:00.000Z", updatedAt: "2026-02-01T00:00:00.000Z" },
  { id: "i-0315a", lessonPlanId: "plan-indoor", lessonPlan: pI, startAt: "2026-03-15T08:00:00.000Z", endAt: "2026-03-15T08:50:00.000Z", location: "the golf house 京橋八丁堀（東京）", maxAttendees: 1, isAvailable: true, note: null, teeOffTime: null, createdAt: "2026-02-01T00:00:00.000Z", updatedAt: "2026-02-01T00:00:00.000Z" },
  { id: "i-0315b", lessonPlanId: "plan-indoor", lessonPlan: pI, startAt: "2026-03-15T09:00:00.000Z", endAt: "2026-03-15T09:50:00.000Z", location: "the golf house 京橋八丁堀（東京）", maxAttendees: 1, isAvailable: true, note: null, teeOffTime: null, createdAt: "2026-02-01T00:00:00.000Z", updatedAt: "2026-02-01T00:00:00.000Z" },
  { id: "i-0317a", lessonPlanId: "plan-indoor", lessonPlan: pI, startAt: "2026-03-17T01:30:00.000Z", endAt: "2026-03-17T02:20:00.000Z", location: "golf next24 中川（横浜）", maxAttendees: 1, isAvailable: true, note: null, teeOffTime: null, createdAt: "2026-02-01T00:00:00.000Z", updatedAt: "2026-02-01T00:00:00.000Z" },
  { id: "i-0318a", lessonPlanId: "plan-indoor", lessonPlan: pI, startAt: "2026-03-18T07:00:00.000Z", endAt: "2026-03-18T07:50:00.000Z", location: "the golf house 京橋八丁堀（東京）", maxAttendees: 1, isAvailable: true, note: null, teeOffTime: null, createdAt: "2026-02-01T00:00:00.000Z", updatedAt: "2026-02-01T00:00:00.000Z" },
  { id: "i-0318b", lessonPlanId: "plan-indoor", lessonPlan: pI, startAt: "2026-03-18T08:00:00.000Z", endAt: "2026-03-18T08:50:00.000Z", location: "the golf house 京橋八丁堀（東京）", maxAttendees: 1, isAvailable: true, note: null, teeOffTime: null, createdAt: "2026-02-01T00:00:00.000Z", updatedAt: "2026-02-01T00:00:00.000Z" },
  { id: "i-0322a", lessonPlanId: "plan-indoor", lessonPlan: pI, startAt: "2026-03-22T08:00:00.000Z", endAt: "2026-03-22T08:50:00.000Z", location: "the golf house 京橋八丁堀（東京）", maxAttendees: 1, isAvailable: true, note: null, teeOffTime: null, createdAt: "2026-02-01T00:00:00.000Z", updatedAt: "2026-02-01T00:00:00.000Z" },
  { id: "i-0322b", lessonPlanId: "plan-indoor", lessonPlan: pI, startAt: "2026-03-22T09:00:00.000Z", endAt: "2026-03-22T09:50:00.000Z", location: "the golf house 京橋八丁堀（東京）", maxAttendees: 1, isAvailable: true, note: null, teeOffTime: null, createdAt: "2026-02-01T00:00:00.000Z", updatedAt: "2026-02-01T00:00:00.000Z" },
  { id: "i-0323a", lessonPlanId: "plan-indoor", lessonPlan: pI, startAt: "2026-03-23T06:00:00.000Z", endAt: "2026-03-23T06:50:00.000Z", location: "the golf house 京橋八丁堀（東京）", maxAttendees: 1, isAvailable: true, note: null, teeOffTime: null, createdAt: "2026-02-01T00:00:00.000Z", updatedAt: "2026-02-01T00:00:00.000Z" },
  { id: "i-0323b", lessonPlanId: "plan-indoor", lessonPlan: pI, startAt: "2026-03-23T07:00:00.000Z", endAt: "2026-03-23T07:50:00.000Z", location: "the golf house 京橋八丁堀（東京）", maxAttendees: 1, isAvailable: true, note: null, teeOffTime: null, createdAt: "2026-02-01T00:00:00.000Z", updatedAt: "2026-02-01T00:00:00.000Z" },
  { id: "i-0323c", lessonPlanId: "plan-indoor", lessonPlan: pI, startAt: "2026-03-23T08:00:00.000Z", endAt: "2026-03-23T08:50:00.000Z", location: "the golf house 京橋八丁堀（東京）", maxAttendees: 1, isAvailable: true, note: null, teeOffTime: null, createdAt: "2026-02-01T00:00:00.000Z", updatedAt: "2026-02-01T00:00:00.000Z" },
  { id: "i-0324a", lessonPlanId: "plan-indoor", lessonPlan: pI, startAt: "2026-03-24T01:30:00.000Z", endAt: "2026-03-24T02:20:00.000Z", location: "golf next24 中川（横浜）", maxAttendees: 1, isAvailable: true, note: null, teeOffTime: null, createdAt: "2026-02-01T00:00:00.000Z", updatedAt: "2026-02-01T00:00:00.000Z" },
  { id: "i-0325a", lessonPlanId: "plan-indoor", lessonPlan: pI, startAt: "2026-03-25T07:00:00.000Z", endAt: "2026-03-25T07:50:00.000Z", location: "the golf house 京橋八丁堀（東京）", maxAttendees: 1, isAvailable: true, note: null, teeOffTime: null, createdAt: "2026-02-01T00:00:00.000Z", updatedAt: "2026-02-01T00:00:00.000Z" },
  { id: "i-0325b", lessonPlanId: "plan-indoor", lessonPlan: pI, startAt: "2026-03-25T08:00:00.000Z", endAt: "2026-03-25T08:50:00.000Z", location: "the golf house 京橋八丁堀（東京）", maxAttendees: 1, isAvailable: true, note: null, teeOffTime: null, createdAt: "2026-02-01T00:00:00.000Z", updatedAt: "2026-02-01T00:00:00.000Z" },
  { id: "i-0330a", lessonPlanId: "plan-indoor", lessonPlan: pI, startAt: "2026-03-30T08:00:00.000Z", endAt: "2026-03-30T08:50:00.000Z", location: "場所調整可（要相談）", maxAttendees: 1, isAvailable: true, note: null, teeOffTime: null, createdAt: "2026-02-01T00:00:00.000Z", updatedAt: "2026-02-01T00:00:00.000Z" },
  { id: "i-0330b", lessonPlanId: "plan-indoor", lessonPlan: pI, startAt: "2026-03-30T09:00:00.000Z", endAt: "2026-03-30T09:50:00.000Z", location: "場所調整可（要相談）", maxAttendees: 1, isAvailable: true, note: null, teeOffTime: null, createdAt: "2026-02-01T00:00:00.000Z", updatedAt: "2026-02-01T00:00:00.000Z" },
  { id: "i-0331a", lessonPlanId: "plan-indoor", lessonPlan: pI, startAt: "2026-03-31T01:30:00.000Z", endAt: "2026-03-31T02:20:00.000Z", location: "golf next24 中川（横浜）", maxAttendees: 1, isAvailable: true, note: null, teeOffTime: null, createdAt: "2026-02-01T00:00:00.000Z", updatedAt: "2026-02-01T00:00:00.000Z" },
];

// ---------------------------------------------------------------------------
// ストレージパス
// ---------------------------------------------------------------------------
const SCHEDULES_PATH = "schedules.json";
const LESSON_PLANS_PATH = "lesson-plans.json";

// ---------------------------------------------------------------------------
// Record → Domain 変換ヘルパー
// ---------------------------------------------------------------------------
function toSchedule(r: ScheduleRecord): Schedule {
  return {
    ...r,
    lessonPlan: toLessonPlan(r.lessonPlan),
    startAt: new Date(r.startAt),
    endAt: new Date(r.endAt),
    createdAt: new Date(r.createdAt),
    updatedAt: new Date(r.updatedAt),
  };
}

function toLessonPlan(r: LessonPlanRecord): LessonPlan {
  return {
    ...r,
    createdAt: new Date(r.createdAt),
    updatedAt: new Date(r.updatedAt),
  };
}

function toScheduleRecord(s: Schedule): ScheduleRecord {
  return {
    ...s,
    lessonPlan: toLessonPlanRecord(s.lessonPlan),
    startAt: s.startAt instanceof Date ? s.startAt.toISOString() : s.startAt,
    endAt: s.endAt instanceof Date ? s.endAt.toISOString() : s.endAt,
    createdAt: s.createdAt instanceof Date ? s.createdAt.toISOString() : s.createdAt,
    updatedAt: s.updatedAt instanceof Date ? s.updatedAt.toISOString() : s.updatedAt,
  };
}

function toLessonPlanRecord(p: LessonPlan): LessonPlanRecord {
  return {
    ...p,
    createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : String(p.createdAt),
    updatedAt: p.updatedAt instanceof Date ? p.updatedAt.toISOString() : String(p.updatedAt),
  };
}

// ---------------------------------------------------------------------------
// Public API — レッスンプラン
// ---------------------------------------------------------------------------

/** レッスンプラン一覧を取得 */
export async function getLessonPlans(): Promise<LessonPlan[]> {
  const records = await readJsonFromStorage<LessonPlanRecord[]>(
    LESSON_PLANS_PATH,
    defaultLessonPlans
  );
  return records.map(toLessonPlan);
}

// ---------------------------------------------------------------------------
// Public API — スケジュール
// ---------------------------------------------------------------------------

/** スケジュール一覧を取得 */
export async function getSchedules(): Promise<Schedule[]> {
  const records = await readJsonFromStorage<ScheduleRecord[]>(
    SCHEDULES_PATH,
    defaultSchedules
  );
  return records.map(toSchedule);
}

/** スケジュールをIDで取得 */
export async function getScheduleById(
  scheduleId: string
): Promise<Schedule | null> {
  const schedules = await getSchedules();
  return schedules.find((s) => s.id === scheduleId) ?? null;
}

/** スケジュールを追加 */
export async function addSchedule(
  input: Omit<Schedule, "id" | "createdAt" | "updatedAt">
): Promise<{ success: boolean; schedule?: Schedule; error?: string }> {
  try {
    const records = await readJsonFromStorage<ScheduleRecord[]>(
      SCHEDULES_PATH,
      defaultSchedules
    );

    const now = new Date();
    const newSchedule: Schedule = {
      ...input,
      id: `sch-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };

    records.push(toScheduleRecord(newSchedule));
    await writeJsonToStorage(SCHEDULES_PATH, records);

    return { success: true, schedule: newSchedule };
  } catch (err) {
    console.error("[addSchedule] error:", err);
    return { success: false, error: "スケジュールの保存に失敗しました" };
  }
}

/** スケジュールを削除 */
export async function deleteSchedule(
  scheduleId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const records = await readJsonFromStorage<ScheduleRecord[]>(
      SCHEDULES_PATH,
      defaultSchedules
    );
    const filtered = records.filter((r) => r.id !== scheduleId);
    await writeJsonToStorage(SCHEDULES_PATH, filtered);
    return { success: true };
  } catch (err) {
    console.error("[deleteSchedule] error:", err);
    return { success: false, error: "スケジュールの削除に失敗しました" };
  }
}

/** スケジュールの空き状態を更新 */
export async function updateScheduleAvailability(
  scheduleId: string,
  isAvailable: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const records = await readJsonFromStorage<ScheduleRecord[]>(
      SCHEDULES_PATH,
      defaultSchedules
    );
    const idx = records.findIndex((r) => r.id === scheduleId);
    if (idx === -1) return { success: false, error: "スケジュールが見つかりません" };

    records[idx].isAvailable = isAvailable;
    records[idx].updatedAt = new Date().toISOString();
    await writeJsonToStorage(SCHEDULES_PATH, records);

    return { success: true };
  } catch (err) {
    console.error("[updateScheduleAvailability] error:", err);
    return { success: false, error: "スケジュールの更新に失敗しました" };
  }
}
