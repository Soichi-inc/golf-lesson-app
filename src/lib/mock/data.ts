import type {
  User,
  LessonPlan,
  Schedule,
  Reservation,
  InstructorNote,
  Drill,
  CustomerDetail,
  RoundScore,
  UserNote,
} from "@/types";

// ------------------------------------------------------------------ LessonPlans
export const mockLessonPlans: LessonPlan[] = [
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
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
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
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
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
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
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
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  },
];

// planへの参照ヘルパー
const planIndoor  = mockLessonPlans[0];
const planRound28 = mockLessonPlans[1];
const planRound30 = mockLessonPlans[2];
const planRound32 = mockLessonPlans[3];

// ------------------------------------------------------------------ Schedules
export const mockSchedules: Schedule[] = [
  // ============================================================
  // ラウンドレッスン (3月)
  // ============================================================
  {
    id: "sch-r1",
    lessonPlanId: "plan-round-28000",
    lessonPlan: planRound28,
    startAt: new Date("2026-03-08T10:20:00+09:00"),
    endAt:   new Date("2026-03-08T16:00:00+09:00"),
    location: "御殿場東名カントリークラブ",
    maxAttendees: 4,
    isAvailable: true,
    note: "練習＋ハーフ(9H) ※練習コイン・昼食別",
    teeOffTime: "10:20",
    createdAt: new Date("2026-02-01"),
    updatedAt: new Date("2026-02-01"),
  },
  {
    id: "sch-r2",
    lessonPlanId: "plan-round-30000",
    lessonPlan: planRound30,
    startAt: new Date("2026-03-26T07:57:00+09:00"),
    endAt:   new Date("2026-03-26T16:00:00+09:00"),
    location: "東名厚木カントリークラブ (in→west)",
    maxAttendees: 4,
    isAvailable: true,
    note: "プレー費・レッスン費・指定昼食付",
    teeOffTime: "7:57",
    createdAt: new Date("2026-02-01"),
    updatedAt: new Date("2026-02-01"),
  },
  {
    id: "sch-r3",
    lessonPlanId: "plan-round-32000",
    lessonPlan: planRound32,
    startAt: new Date("2026-03-29T09:25:00+09:00"),
    endAt:   new Date("2026-03-29T16:00:00+09:00"),
    location: "大厚木カントリークラブ 桜コース",
    maxAttendees: 4,
    isAvailable: true,
    note: "練習＋ハーフ(9H) ※練習コイン・昼食別",
    teeOffTime: "9:25",
    createdAt: new Date("2026-02-01"),
    updatedAt: new Date("2026-02-01"),
  },
  {
    id: "sch-r4",
    lessonPlanId: "plan-round-30000",
    lessonPlan: planRound30,
    startAt: new Date("2026-03-30T07:39:00+09:00"),
    endAt:   new Date("2026-03-30T16:00:00+09:00"),
    location: "ムーンレイク茂原ゴルフクラブ",
    maxAttendees: 4,
    isAvailable: true,
    note: "プレー費・レッスン費・指定昼食付",
    teeOffTime: "7:39",
    createdAt: new Date("2026-02-01"),
    updatedAt: new Date("2026-02-01"),
  },

  // ============================================================
  // インドアゴルフレッスン (3月)
  // ============================================================
  // 3/1(日) 京橋八丁堀
  { id: "i-0301a", lessonPlanId: "plan-indoor", lessonPlan: planIndoor, startAt: new Date("2026-03-01T17:00:00+09:00"), endAt: new Date("2026-03-01T17:50:00+09:00"), location: "the golf house 京橋八丁堀（東京）", maxAttendees: 1, isAvailable: true, note: null, teeOffTime: null, createdAt: new Date("2026-02-01"), updatedAt: new Date("2026-02-01") },
  { id: "i-0301b", lessonPlanId: "plan-indoor", lessonPlan: planIndoor, startAt: new Date("2026-03-01T18:00:00+09:00"), endAt: new Date("2026-03-01T18:50:00+09:00"), location: "the golf house 京橋八丁堀（東京）", maxAttendees: 1, isAvailable: true, note: null, teeOffTime: null, createdAt: new Date("2026-02-01"), updatedAt: new Date("2026-02-01") },
  // 3/2(月) 横浜（武蔵中原）
  { id: "i-0302a", lessonPlanId: "plan-indoor", lessonPlan: planIndoor, startAt: new Date("2026-03-02T18:00:00+09:00"), endAt: new Date("2026-03-02T18:50:00+09:00"), location: "golf next24 武蔵中原（横浜）", maxAttendees: 1, isAvailable: true, note: null, teeOffTime: null, createdAt: new Date("2026-02-01"), updatedAt: new Date("2026-02-01") },
  // 3/3(火) 横浜（中川）
  { id: "i-0303a", lessonPlanId: "plan-indoor", lessonPlan: planIndoor, startAt: new Date("2026-03-03T10:30:00+09:00"), endAt: new Date("2026-03-03T11:20:00+09:00"), location: "golf next24 中川（横浜）", maxAttendees: 1, isAvailable: true, note: null, teeOffTime: null, createdAt: new Date("2026-02-01"), updatedAt: new Date("2026-02-01") },
  // 3/4(水) 京橋八丁堀
  { id: "i-0304a", lessonPlanId: "plan-indoor", lessonPlan: planIndoor, startAt: new Date("2026-03-04T16:00:00+09:00"), endAt: new Date("2026-03-04T16:50:00+09:00"), location: "the golf house 京橋八丁堀（東京）", maxAttendees: 1, isAvailable: true, note: null, teeOffTime: null, createdAt: new Date("2026-02-01"), updatedAt: new Date("2026-02-01") },
  { id: "i-0304b", lessonPlanId: "plan-indoor", lessonPlan: planIndoor, startAt: new Date("2026-03-04T17:00:00+09:00"), endAt: new Date("2026-03-04T17:50:00+09:00"), location: "the golf house 京橋八丁堀（東京）", maxAttendees: 1, isAvailable: true, note: null, teeOffTime: null, createdAt: new Date("2026-02-01"), updatedAt: new Date("2026-02-01") },
  // 3/6(金) 横浜（中川）
  { id: "i-0306a", lessonPlanId: "plan-indoor", lessonPlan: planIndoor, startAt: new Date("2026-03-06T10:30:00+09:00"), endAt: new Date("2026-03-06T11:20:00+09:00"), location: "golf next24 中川（横浜）", maxAttendees: 1, isAvailable: true, note: null, teeOffTime: null, createdAt: new Date("2026-02-01"), updatedAt: new Date("2026-02-01") },
  // 3/9(月) 場所調整可 + 京橋八丁堀
  { id: "i-0309a", lessonPlanId: "plan-indoor", lessonPlan: planIndoor, startAt: new Date("2026-03-09T12:00:00+09:00"), endAt: new Date("2026-03-09T12:50:00+09:00"), location: "場所調整可（要相談）", maxAttendees: 1, isAvailable: true, note: null, teeOffTime: null, createdAt: new Date("2026-02-01"), updatedAt: new Date("2026-02-01") },
  { id: "i-0309b", lessonPlanId: "plan-indoor", lessonPlan: planIndoor, startAt: new Date("2026-03-09T13:00:00+09:00"), endAt: new Date("2026-03-09T13:50:00+09:00"), location: "場所調整可（要相談）", maxAttendees: 1, isAvailable: true, note: null, teeOffTime: null, createdAt: new Date("2026-02-01"), updatedAt: new Date("2026-02-01") },
  { id: "i-0309c", lessonPlanId: "plan-indoor", lessonPlan: planIndoor, startAt: new Date("2026-03-09T14:00:00+09:00"), endAt: new Date("2026-03-09T14:50:00+09:00"), location: "場所調整可（要相談）", maxAttendees: 1, isAvailable: true, note: null, teeOffTime: null, createdAt: new Date("2026-02-01"), updatedAt: new Date("2026-02-01") },
  { id: "i-0309d", lessonPlanId: "plan-indoor", lessonPlan: planIndoor, startAt: new Date("2026-03-09T15:00:00+09:00"), endAt: new Date("2026-03-09T15:50:00+09:00"), location: "the golf house 京橋八丁堀（東京）", maxAttendees: 1, isAvailable: true, note: null, teeOffTime: null, createdAt: new Date("2026-02-01"), updatedAt: new Date("2026-02-01") },
  { id: "i-0309e", lessonPlanId: "plan-indoor", lessonPlan: planIndoor, startAt: new Date("2026-03-09T16:00:00+09:00"), endAt: new Date("2026-03-09T16:50:00+09:00"), location: "the golf house 京橋八丁堀（東京）", maxAttendees: 1, isAvailable: true, note: null, teeOffTime: null, createdAt: new Date("2026-02-01"), updatedAt: new Date("2026-02-01") },
  { id: "i-0309f", lessonPlanId: "plan-indoor", lessonPlan: planIndoor, startAt: new Date("2026-03-09T17:00:00+09:00"), endAt: new Date("2026-03-09T17:50:00+09:00"), location: "the golf house 京橋八丁堀（東京）", maxAttendees: 1, isAvailable: true, note: null, teeOffTime: null, createdAt: new Date("2026-02-01"), updatedAt: new Date("2026-02-01") },
  // 3/10(火) 横浜（中川）
  { id: "i-0310a", lessonPlanId: "plan-indoor", lessonPlan: planIndoor, startAt: new Date("2026-03-10T10:30:00+09:00"), endAt: new Date("2026-03-10T11:20:00+09:00"), location: "golf next24 中川（横浜）", maxAttendees: 1, isAvailable: true, note: null, teeOffTime: null, createdAt: new Date("2026-02-01"), updatedAt: new Date("2026-02-01") },
  // 3/11(水) 京橋八丁堀
  { id: "i-0311a", lessonPlanId: "plan-indoor", lessonPlan: planIndoor, startAt: new Date("2026-03-11T16:00:00+09:00"), endAt: new Date("2026-03-11T16:50:00+09:00"), location: "the golf house 京橋八丁堀（東京）", maxAttendees: 1, isAvailable: true, note: null, teeOffTime: null, createdAt: new Date("2026-02-01"), updatedAt: new Date("2026-02-01") },
  { id: "i-0311b", lessonPlanId: "plan-indoor", lessonPlan: planIndoor, startAt: new Date("2026-03-11T17:00:00+09:00"), endAt: new Date("2026-03-11T17:50:00+09:00"), location: "the golf house 京橋八丁堀（東京）", maxAttendees: 1, isAvailable: true, note: null, teeOffTime: null, createdAt: new Date("2026-02-01"), updatedAt: new Date("2026-02-01") },
  // 3/13(金) 横浜（中川）
  { id: "i-0313a", lessonPlanId: "plan-indoor", lessonPlan: planIndoor, startAt: new Date("2026-03-13T10:30:00+09:00"), endAt: new Date("2026-03-13T11:20:00+09:00"), location: "golf next24 中川（横浜）", maxAttendees: 1, isAvailable: true, note: null, teeOffTime: null, createdAt: new Date("2026-02-01"), updatedAt: new Date("2026-02-01") },
  // 3/15(日) 京橋八丁堀
  { id: "i-0315a", lessonPlanId: "plan-indoor", lessonPlan: planIndoor, startAt: new Date("2026-03-15T17:00:00+09:00"), endAt: new Date("2026-03-15T17:50:00+09:00"), location: "the golf house 京橋八丁堀（東京）", maxAttendees: 1, isAvailable: true, note: null, teeOffTime: null, createdAt: new Date("2026-02-01"), updatedAt: new Date("2026-02-01") },
  { id: "i-0315b", lessonPlanId: "plan-indoor", lessonPlan: planIndoor, startAt: new Date("2026-03-15T18:00:00+09:00"), endAt: new Date("2026-03-15T18:50:00+09:00"), location: "the golf house 京橋八丁堀（東京）", maxAttendees: 1, isAvailable: true, note: null, teeOffTime: null, createdAt: new Date("2026-02-01"), updatedAt: new Date("2026-02-01") },
  // 3/17(火) 横浜（中川）
  { id: "i-0317a", lessonPlanId: "plan-indoor", lessonPlan: planIndoor, startAt: new Date("2026-03-17T10:30:00+09:00"), endAt: new Date("2026-03-17T11:20:00+09:00"), location: "golf next24 中川（横浜）", maxAttendees: 1, isAvailable: true, note: null, teeOffTime: null, createdAt: new Date("2026-02-01"), updatedAt: new Date("2026-02-01") },
  // 3/18(水) 京橋八丁堀
  { id: "i-0318a", lessonPlanId: "plan-indoor", lessonPlan: planIndoor, startAt: new Date("2026-03-18T16:00:00+09:00"), endAt: new Date("2026-03-18T16:50:00+09:00"), location: "the golf house 京橋八丁堀（東京）", maxAttendees: 1, isAvailable: true, note: null, teeOffTime: null, createdAt: new Date("2026-02-01"), updatedAt: new Date("2026-02-01") },
  { id: "i-0318b", lessonPlanId: "plan-indoor", lessonPlan: planIndoor, startAt: new Date("2026-03-18T17:00:00+09:00"), endAt: new Date("2026-03-18T17:50:00+09:00"), location: "the golf house 京橋八丁堀（東京）", maxAttendees: 1, isAvailable: true, note: null, teeOffTime: null, createdAt: new Date("2026-02-01"), updatedAt: new Date("2026-02-01") },
  // 3/22(日) 京橋八丁堀
  { id: "i-0322a", lessonPlanId: "plan-indoor", lessonPlan: planIndoor, startAt: new Date("2026-03-22T17:00:00+09:00"), endAt: new Date("2026-03-22T17:50:00+09:00"), location: "the golf house 京橋八丁堀（東京）", maxAttendees: 1, isAvailable: true, note: null, teeOffTime: null, createdAt: new Date("2026-02-01"), updatedAt: new Date("2026-02-01") },
  { id: "i-0322b", lessonPlanId: "plan-indoor", lessonPlan: planIndoor, startAt: new Date("2026-03-22T18:00:00+09:00"), endAt: new Date("2026-03-22T18:50:00+09:00"), location: "the golf house 京橋八丁堀（東京）", maxAttendees: 1, isAvailable: true, note: null, teeOffTime: null, createdAt: new Date("2026-02-01"), updatedAt: new Date("2026-02-01") },
  // 3/23(月) 京橋八丁堀
  { id: "i-0323a", lessonPlanId: "plan-indoor", lessonPlan: planIndoor, startAt: new Date("2026-03-23T15:00:00+09:00"), endAt: new Date("2026-03-23T15:50:00+09:00"), location: "the golf house 京橋八丁堀（東京）", maxAttendees: 1, isAvailable: true, note: null, teeOffTime: null, createdAt: new Date("2026-02-01"), updatedAt: new Date("2026-02-01") },
  { id: "i-0323b", lessonPlanId: "plan-indoor", lessonPlan: planIndoor, startAt: new Date("2026-03-23T16:00:00+09:00"), endAt: new Date("2026-03-23T16:50:00+09:00"), location: "the golf house 京橋八丁堀（東京）", maxAttendees: 1, isAvailable: true, note: null, teeOffTime: null, createdAt: new Date("2026-02-01"), updatedAt: new Date("2026-02-01") },
  { id: "i-0323c", lessonPlanId: "plan-indoor", lessonPlan: planIndoor, startAt: new Date("2026-03-23T17:00:00+09:00"), endAt: new Date("2026-03-23T17:50:00+09:00"), location: "the golf house 京橋八丁堀（東京）", maxAttendees: 1, isAvailable: true, note: null, teeOffTime: null, createdAt: new Date("2026-02-01"), updatedAt: new Date("2026-02-01") },
  // 3/24(火) 横浜（中川）
  { id: "i-0324a", lessonPlanId: "plan-indoor", lessonPlan: planIndoor, startAt: new Date("2026-03-24T10:30:00+09:00"), endAt: new Date("2026-03-24T11:20:00+09:00"), location: "golf next24 中川（横浜）", maxAttendees: 1, isAvailable: true, note: null, teeOffTime: null, createdAt: new Date("2026-02-01"), updatedAt: new Date("2026-02-01") },
  // 3/25(水) 京橋八丁堀
  { id: "i-0325a", lessonPlanId: "plan-indoor", lessonPlan: planIndoor, startAt: new Date("2026-03-25T16:00:00+09:00"), endAt: new Date("2026-03-25T16:50:00+09:00"), location: "the golf house 京橋八丁堀（東京）", maxAttendees: 1, isAvailable: true, note: null, teeOffTime: null, createdAt: new Date("2026-02-01"), updatedAt: new Date("2026-02-01") },
  { id: "i-0325b", lessonPlanId: "plan-indoor", lessonPlan: planIndoor, startAt: new Date("2026-03-25T17:00:00+09:00"), endAt: new Date("2026-03-25T17:50:00+09:00"), location: "the golf house 京橋八丁堀（東京）", maxAttendees: 1, isAvailable: true, note: null, teeOffTime: null, createdAt: new Date("2026-02-01"), updatedAt: new Date("2026-02-01") },
  // 3/30(月) 場所調整可
  { id: "i-0330a", lessonPlanId: "plan-indoor", lessonPlan: planIndoor, startAt: new Date("2026-03-30T17:00:00+09:00"), endAt: new Date("2026-03-30T17:50:00+09:00"), location: "場所調整可（要相談）", maxAttendees: 1, isAvailable: true, note: null, teeOffTime: null, createdAt: new Date("2026-02-01"), updatedAt: new Date("2026-02-01") },
  { id: "i-0330b", lessonPlanId: "plan-indoor", lessonPlan: planIndoor, startAt: new Date("2026-03-30T18:00:00+09:00"), endAt: new Date("2026-03-30T18:50:00+09:00"), location: "場所調整可（要相談）", maxAttendees: 1, isAvailable: true, note: null, teeOffTime: null, createdAt: new Date("2026-02-01"), updatedAt: new Date("2026-02-01") },
  // 3/31(火) 横浜（中川）
  { id: "i-0331a", lessonPlanId: "plan-indoor", lessonPlan: planIndoor, startAt: new Date("2026-03-31T10:30:00+09:00"), endAt: new Date("2026-03-31T11:20:00+09:00"), location: "golf next24 中川（横浜）", maxAttendees: 1, isAvailable: true, note: null, teeOffTime: null, createdAt: new Date("2026-02-01"), updatedAt: new Date("2026-02-01") },
];

// ------------------------------------------------------------------ Users
export const mockUsers: User[] = [
  {
    id: "user-akira",
    email: "akirahasama@gmail.com",
    name: "挾間 彬",
    phone: null,
    role: "USER",
    avatarUrl: null,
    createdAt: new Date("2026-02-23"),
    updatedAt: new Date("2026-02-23"),
  },
];

// ------------------------------------------------------------------ Reservations
export const mockReservations: Reservation[] = [];

// ------------------------------------------------------------------ InstructorNotes
export const mockInstructorNotes: InstructorNote[] = [];

// ------------------------------------------------------------------ Drills
export const mockDrills: Drill[] = [];

// ------------------------------------------------------------------ RoundScores（マイページ用）
export const mockRoundScores: RoundScore[] = [];

// ------------------------------------------------------------------ UserNotes（ミス共有ノート）
export const mockUserNotes: UserNote[] = [];

// ------------------------------------------------------------------ CustomerDetail（集約）
export const mockCustomerDetails: Record<string, CustomerDetail> = {
  "user-akira": {
    ...mockUsers[0],
    reservations: [],
    instructorNotes: [],
    drills: [],
  },
};
