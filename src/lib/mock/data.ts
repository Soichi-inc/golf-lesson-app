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
    createdAt: new Date("2026-02-01"),
    updatedAt: new Date("2026-02-01"),
  },

  // ============================================================
  // インドアゴルフレッスン (3月)
  // ============================================================
  // 3/1(日) 京橋八丁堀
  { id: "i-0301a", lessonPlanId: "plan-indoor", lessonPlan: planIndoor, startAt: new Date("2026-03-01T17:00:00+09:00"), endAt: new Date("2026-03-01T17:50:00+09:00"), location: "the golf house 京橋八丁堀（東京）", maxAttendees: 1, isAvailable: true, note: null, createdAt: new Date("2026-02-01"), updatedAt: new Date("2026-02-01") },
  { id: "i-0301b", lessonPlanId: "plan-indoor", lessonPlan: planIndoor, startAt: new Date("2026-03-01T18:00:00+09:00"), endAt: new Date("2026-03-01T18:50:00+09:00"), location: "the golf house 京橋八丁堀（東京）", maxAttendees: 1, isAvailable: true, note: null, createdAt: new Date("2026-02-01"), updatedAt: new Date("2026-02-01") },
  // 3/2(月) 横浜（武蔵中原）
  { id: "i-0302a", lessonPlanId: "plan-indoor", lessonPlan: planIndoor, startAt: new Date("2026-03-02T18:00:00+09:00"), endAt: new Date("2026-03-02T18:50:00+09:00"), location: "golf next24 武蔵中原（横浜）", maxAttendees: 1, isAvailable: true, note: null, createdAt: new Date("2026-02-01"), updatedAt: new Date("2026-02-01") },
  // 3/3(火) 横浜（中川）
  { id: "i-0303a", lessonPlanId: "plan-indoor", lessonPlan: planIndoor, startAt: new Date("2026-03-03T10:30:00+09:00"), endAt: new Date("2026-03-03T11:20:00+09:00"), location: "golf next24 中川（横浜）", maxAttendees: 1, isAvailable: true, note: null, createdAt: new Date("2026-02-01"), updatedAt: new Date("2026-02-01") },
  // 3/4(水) 京橋八丁堀
  { id: "i-0304a", lessonPlanId: "plan-indoor", lessonPlan: planIndoor, startAt: new Date("2026-03-04T16:00:00+09:00"), endAt: new Date("2026-03-04T16:50:00+09:00"), location: "the golf house 京橋八丁堀（東京）", maxAttendees: 1, isAvailable: true, note: null, createdAt: new Date("2026-02-01"), updatedAt: new Date("2026-02-01") },
  { id: "i-0304b", lessonPlanId: "plan-indoor", lessonPlan: planIndoor, startAt: new Date("2026-03-04T17:00:00+09:00"), endAt: new Date("2026-03-04T17:50:00+09:00"), location: "the golf house 京橋八丁堀（東京）", maxAttendees: 1, isAvailable: true, note: null, createdAt: new Date("2026-02-01"), updatedAt: new Date("2026-02-01") },
  // 3/6(金) 横浜（中川）
  { id: "i-0306a", lessonPlanId: "plan-indoor", lessonPlan: planIndoor, startAt: new Date("2026-03-06T10:30:00+09:00"), endAt: new Date("2026-03-06T11:20:00+09:00"), location: "golf next24 中川（横浜）", maxAttendees: 1, isAvailable: true, note: null, createdAt: new Date("2026-02-01"), updatedAt: new Date("2026-02-01") },
  // 3/9(月) 場所調整可 + 京橋八丁堀
  { id: "i-0309a", lessonPlanId: "plan-indoor", lessonPlan: planIndoor, startAt: new Date("2026-03-09T12:00:00+09:00"), endAt: new Date("2026-03-09T12:50:00+09:00"), location: "場所調整可（要相談）", maxAttendees: 1, isAvailable: true, note: null, createdAt: new Date("2026-02-01"), updatedAt: new Date("2026-02-01") },
  { id: "i-0309b", lessonPlanId: "plan-indoor", lessonPlan: planIndoor, startAt: new Date("2026-03-09T13:00:00+09:00"), endAt: new Date("2026-03-09T13:50:00+09:00"), location: "場所調整可（要相談）", maxAttendees: 1, isAvailable: true, note: null, createdAt: new Date("2026-02-01"), updatedAt: new Date("2026-02-01") },
  { id: "i-0309c", lessonPlanId: "plan-indoor", lessonPlan: planIndoor, startAt: new Date("2026-03-09T14:00:00+09:00"), endAt: new Date("2026-03-09T14:50:00+09:00"), location: "場所調整可（要相談）", maxAttendees: 1, isAvailable: true, note: null, createdAt: new Date("2026-02-01"), updatedAt: new Date("2026-02-01") },
  { id: "i-0309d", lessonPlanId: "plan-indoor", lessonPlan: planIndoor, startAt: new Date("2026-03-09T15:00:00+09:00"), endAt: new Date("2026-03-09T15:50:00+09:00"), location: "the golf house 京橋八丁堀（東京）", maxAttendees: 1, isAvailable: true, note: null, createdAt: new Date("2026-02-01"), updatedAt: new Date("2026-02-01") },
  { id: "i-0309e", lessonPlanId: "plan-indoor", lessonPlan: planIndoor, startAt: new Date("2026-03-09T16:00:00+09:00"), endAt: new Date("2026-03-09T16:50:00+09:00"), location: "the golf house 京橋八丁堀（東京）", maxAttendees: 1, isAvailable: true, note: null, createdAt: new Date("2026-02-01"), updatedAt: new Date("2026-02-01") },
  { id: "i-0309f", lessonPlanId: "plan-indoor", lessonPlan: planIndoor, startAt: new Date("2026-03-09T17:00:00+09:00"), endAt: new Date("2026-03-09T17:50:00+09:00"), location: "the golf house 京橋八丁堀（東京）", maxAttendees: 1, isAvailable: true, note: null, createdAt: new Date("2026-02-01"), updatedAt: new Date("2026-02-01") },
  // 3/10(火) 横浜（中川）
  { id: "i-0310a", lessonPlanId: "plan-indoor", lessonPlan: planIndoor, startAt: new Date("2026-03-10T10:30:00+09:00"), endAt: new Date("2026-03-10T11:20:00+09:00"), location: "golf next24 中川（横浜）", maxAttendees: 1, isAvailable: true, note: null, createdAt: new Date("2026-02-01"), updatedAt: new Date("2026-02-01") },
  // 3/11(水) 京橋八丁堀
  { id: "i-0311a", lessonPlanId: "plan-indoor", lessonPlan: planIndoor, startAt: new Date("2026-03-11T16:00:00+09:00"), endAt: new Date("2026-03-11T16:50:00+09:00"), location: "the golf house 京橋八丁堀（東京）", maxAttendees: 1, isAvailable: true, note: null, createdAt: new Date("2026-02-01"), updatedAt: new Date("2026-02-01") },
  { id: "i-0311b", lessonPlanId: "plan-indoor", lessonPlan: planIndoor, startAt: new Date("2026-03-11T17:00:00+09:00"), endAt: new Date("2026-03-11T17:50:00+09:00"), location: "the golf house 京橋八丁堀（東京）", maxAttendees: 1, isAvailable: true, note: null, createdAt: new Date("2026-02-01"), updatedAt: new Date("2026-02-01") },
  // 3/13(金) 横浜（中川）
  { id: "i-0313a", lessonPlanId: "plan-indoor", lessonPlan: planIndoor, startAt: new Date("2026-03-13T10:30:00+09:00"), endAt: new Date("2026-03-13T11:20:00+09:00"), location: "golf next24 中川（横浜）", maxAttendees: 1, isAvailable: true, note: null, createdAt: new Date("2026-02-01"), updatedAt: new Date("2026-02-01") },
  // 3/15(日) 京橋八丁堀
  { id: "i-0315a", lessonPlanId: "plan-indoor", lessonPlan: planIndoor, startAt: new Date("2026-03-15T17:00:00+09:00"), endAt: new Date("2026-03-15T17:50:00+09:00"), location: "the golf house 京橋八丁堀（東京）", maxAttendees: 1, isAvailable: true, note: null, createdAt: new Date("2026-02-01"), updatedAt: new Date("2026-02-01") },
  { id: "i-0315b", lessonPlanId: "plan-indoor", lessonPlan: planIndoor, startAt: new Date("2026-03-15T18:00:00+09:00"), endAt: new Date("2026-03-15T18:50:00+09:00"), location: "the golf house 京橋八丁堀（東京）", maxAttendees: 1, isAvailable: true, note: null, createdAt: new Date("2026-02-01"), updatedAt: new Date("2026-02-01") },
  // 3/17(火) 横浜（中川）
  { id: "i-0317a", lessonPlanId: "plan-indoor", lessonPlan: planIndoor, startAt: new Date("2026-03-17T10:30:00+09:00"), endAt: new Date("2026-03-17T11:20:00+09:00"), location: "golf next24 中川（横浜）", maxAttendees: 1, isAvailable: true, note: null, createdAt: new Date("2026-02-01"), updatedAt: new Date("2026-02-01") },
  // 3/18(水) 京橋八丁堀
  { id: "i-0318a", lessonPlanId: "plan-indoor", lessonPlan: planIndoor, startAt: new Date("2026-03-18T16:00:00+09:00"), endAt: new Date("2026-03-18T16:50:00+09:00"), location: "the golf house 京橋八丁堀（東京）", maxAttendees: 1, isAvailable: true, note: null, createdAt: new Date("2026-02-01"), updatedAt: new Date("2026-02-01") },
  { id: "i-0318b", lessonPlanId: "plan-indoor", lessonPlan: planIndoor, startAt: new Date("2026-03-18T17:00:00+09:00"), endAt: new Date("2026-03-18T17:50:00+09:00"), location: "the golf house 京橋八丁堀（東京）", maxAttendees: 1, isAvailable: true, note: null, createdAt: new Date("2026-02-01"), updatedAt: new Date("2026-02-01") },
  // 3/22(日) 京橋八丁堀
  { id: "i-0322a", lessonPlanId: "plan-indoor", lessonPlan: planIndoor, startAt: new Date("2026-03-22T17:00:00+09:00"), endAt: new Date("2026-03-22T17:50:00+09:00"), location: "the golf house 京橋八丁堀（東京）", maxAttendees: 1, isAvailable: true, note: null, createdAt: new Date("2026-02-01"), updatedAt: new Date("2026-02-01") },
  { id: "i-0322b", lessonPlanId: "plan-indoor", lessonPlan: planIndoor, startAt: new Date("2026-03-22T18:00:00+09:00"), endAt: new Date("2026-03-22T18:50:00+09:00"), location: "the golf house 京橋八丁堀（東京）", maxAttendees: 1, isAvailable: true, note: null, createdAt: new Date("2026-02-01"), updatedAt: new Date("2026-02-01") },
  // 3/23(月) 京橋八丁堀
  { id: "i-0323a", lessonPlanId: "plan-indoor", lessonPlan: planIndoor, startAt: new Date("2026-03-23T15:00:00+09:00"), endAt: new Date("2026-03-23T15:50:00+09:00"), location: "the golf house 京橋八丁堀（東京）", maxAttendees: 1, isAvailable: true, note: null, createdAt: new Date("2026-02-01"), updatedAt: new Date("2026-02-01") },
  { id: "i-0323b", lessonPlanId: "plan-indoor", lessonPlan: planIndoor, startAt: new Date("2026-03-23T16:00:00+09:00"), endAt: new Date("2026-03-23T16:50:00+09:00"), location: "the golf house 京橋八丁堀（東京）", maxAttendees: 1, isAvailable: true, note: null, createdAt: new Date("2026-02-01"), updatedAt: new Date("2026-02-01") },
  { id: "i-0323c", lessonPlanId: "plan-indoor", lessonPlan: planIndoor, startAt: new Date("2026-03-23T17:00:00+09:00"), endAt: new Date("2026-03-23T17:50:00+09:00"), location: "the golf house 京橋八丁堀（東京）", maxAttendees: 1, isAvailable: true, note: null, createdAt: new Date("2026-02-01"), updatedAt: new Date("2026-02-01") },
  // 3/24(火) 横浜（中川）
  { id: "i-0324a", lessonPlanId: "plan-indoor", lessonPlan: planIndoor, startAt: new Date("2026-03-24T10:30:00+09:00"), endAt: new Date("2026-03-24T11:20:00+09:00"), location: "golf next24 中川（横浜）", maxAttendees: 1, isAvailable: true, note: null, createdAt: new Date("2026-02-01"), updatedAt: new Date("2026-02-01") },
  // 3/25(水) 京橋八丁堀
  { id: "i-0325a", lessonPlanId: "plan-indoor", lessonPlan: planIndoor, startAt: new Date("2026-03-25T16:00:00+09:00"), endAt: new Date("2026-03-25T16:50:00+09:00"), location: "the golf house 京橋八丁堀（東京）", maxAttendees: 1, isAvailable: true, note: null, createdAt: new Date("2026-02-01"), updatedAt: new Date("2026-02-01") },
  { id: "i-0325b", lessonPlanId: "plan-indoor", lessonPlan: planIndoor, startAt: new Date("2026-03-25T17:00:00+09:00"), endAt: new Date("2026-03-25T17:50:00+09:00"), location: "the golf house 京橋八丁堀（東京）", maxAttendees: 1, isAvailable: true, note: null, createdAt: new Date("2026-02-01"), updatedAt: new Date("2026-02-01") },
  // 3/30(月) 場所調整可
  { id: "i-0330a", lessonPlanId: "plan-indoor", lessonPlan: planIndoor, startAt: new Date("2026-03-30T17:00:00+09:00"), endAt: new Date("2026-03-30T17:50:00+09:00"), location: "場所調整可（要相談）", maxAttendees: 1, isAvailable: true, note: null, createdAt: new Date("2026-02-01"), updatedAt: new Date("2026-02-01") },
  { id: "i-0330b", lessonPlanId: "plan-indoor", lessonPlan: planIndoor, startAt: new Date("2026-03-30T18:00:00+09:00"), endAt: new Date("2026-03-30T18:50:00+09:00"), location: "場所調整可（要相談）", maxAttendees: 1, isAvailable: true, note: null, createdAt: new Date("2026-02-01"), updatedAt: new Date("2026-02-01") },
  // 3/31(火) 横浜（中川）
  { id: "i-0331a", lessonPlanId: "plan-indoor", lessonPlan: planIndoor, startAt: new Date("2026-03-31T10:30:00+09:00"), endAt: new Date("2026-03-31T11:20:00+09:00"), location: "golf next24 中川（横浜）", maxAttendees: 1, isAvailable: true, note: null, createdAt: new Date("2026-02-01"), updatedAt: new Date("2026-02-01") },
];

// ------------------------------------------------------------------ Users
export const mockUsers: User[] = [
  {
    id: "user-1",
    email: "tanaka.yuki@example.com",
    name: "田中 由紀",
    phone: "090-1234-5678",
    role: "USER",
    avatarUrl: null,
    createdAt: new Date("2026-01-15"),
    updatedAt: new Date("2026-01-15"),
  },
  {
    id: "user-2",
    email: "sato.emi@example.com",
    name: "佐藤 恵美",
    phone: "080-9876-5432",
    role: "USER",
    avatarUrl: null,
    createdAt: new Date("2026-01-20"),
    updatedAt: new Date("2026-01-20"),
  },
  {
    id: "user-3",
    email: "yamamoto.akiko@example.com",
    name: "山本 明子",
    phone: null,
    role: "USER",
    avatarUrl: null,
    createdAt: new Date("2026-02-01"),
    updatedAt: new Date("2026-02-01"),
  },
  {
    id: "user-4",
    email: "suzuki.haruka@example.com",
    name: "鈴木 遥",
    phone: "070-1111-2222",
    role: "USER",
    avatarUrl: null,
    createdAt: new Date("2026-02-10"),
    updatedAt: new Date("2026-02-10"),
  },
];

// ------------------------------------------------------------------ Reservations
export const mockReservations: Reservation[] = [
  {
    id: "rsv-1",
    userId: "user-1",
    user: mockUsers[0],
    scheduleId: "sch-1",
    schedule: mockSchedules[0],
    status: "COMPLETED",
    concern: "ドライバーのスライスを直したい",
    agreedCancelPolicy: true,
    agreedPhotoPost: true,
    cancelledAt: null,
    cancelReason: null,
    createdAt: new Date("2026-02-20"),
    updatedAt: new Date("2026-03-10"),
  },
  {
    id: "rsv-2",
    userId: "user-2",
    user: mockUsers[1],
    scheduleId: "sch-5",
    schedule: mockSchedules[4],
    status: "CONFIRMED",
    concern: "アプローチの距離感が掴めない",
    agreedCancelPolicy: true,
    agreedPhotoPost: false,
    cancelledAt: null,
    cancelReason: null,
    createdAt: new Date("2026-02-22"),
    updatedAt: new Date("2026-02-22"),
  },
  {
    id: "rsv-3",
    userId: "user-1",
    user: mockUsers[0],
    scheduleId: "sch-2",
    schedule: mockSchedules[1],
    status: "CONFIRMED",
    concern: null,
    agreedCancelPolicy: true,
    agreedPhotoPost: true,
    cancelledAt: null,
    cancelReason: null,
    createdAt: new Date("2026-02-25"),
    updatedAt: new Date("2026-02-25"),
  },
];

// ------------------------------------------------------------------ InstructorNotes
export const mockInstructorNotes: InstructorNote[] = [
  {
    id: "note-1",
    userId: "user-1",
    lessonRecordId: null,
    content:
      "テイクバックで左肩の回転が不足気味。ハーフウェイバックでの右肘の使い方を意識させる。次回は体幹の回転からのドリルから始める。",
    isPrivate: true,
    createdAt: new Date("2026-03-10T11:30:00"),
    updatedAt: new Date("2026-03-10T11:30:00"),
  },
  {
    id: "note-2",
    userId: "user-1",
    lessonRecordId: null,
    content:
      "グリップが強すぎる傾向あり。フィンガーグリップを意識させたところ、インパクトが格段に改善。自宅でも素振りを継続してほしい。",
    isPrivate: false,
    createdAt: new Date("2026-02-15T12:00:00"),
    updatedAt: new Date("2026-02-15T12:00:00"),
  },
  {
    id: "note-3",
    userId: "user-2",
    lessonRecordId: null,
    content:
      "アプローチはロフトを立てすぎている。ボール位置を少し右足寄りにして、ハンドファーストを意識。距離感は反復練習で必ず改善する。",
    isPrivate: true,
    createdAt: new Date("2026-02-18T14:30:00"),
    updatedAt: new Date("2026-02-18T14:30:00"),
  },
];

// ------------------------------------------------------------------ Drills
export const mockDrills: Drill[] = [
  {
    id: "drill-1",
    userId: "user-1",
    lessonRecordId: null,
    title: "タオルドリル（テイクバック改善）",
    description:
      "脇にタオルを挟み、落とさないようにスイングする。左肩の回転を意識して1日30回。",
    videoUrl: null,
    status: "IN_PROGRESS",
    dueDate: new Date("2026-03-20"),
    createdAt: new Date("2026-03-10"),
    updatedAt: new Date("2026-03-10"),
  },
  {
    id: "drill-2",
    userId: "user-1",
    lessonRecordId: null,
    title: "グリッププレッシャー確認ドリル",
    description:
      "クラブを10本の指で握り、各指の力加減を1〜10で確認する。目標は全体で4〜5の力感。",
    videoUrl: null,
    status: "COMPLETED",
    dueDate: new Date("2026-03-01"),
    createdAt: new Date("2026-02-15"),
    updatedAt: new Date("2026-03-05"),
  },
  {
    id: "drill-3",
    userId: "user-2",
    lessonRecordId: null,
    title: "アプローチ距離感ドリル（10y・20y・30y）",
    description:
      "ピッチングウェッジで10y・20y・30yの3距離を各10球ずつ。毎日練習場で実施する。",
    videoUrl: null,
    status: "ASSIGNED",
    dueDate: new Date("2026-04-01"),
    createdAt: new Date("2026-02-18"),
    updatedAt: new Date("2026-02-18"),
  },
];

// ------------------------------------------------------------------ RoundScores（マイページ用）
export const mockRoundScores: RoundScore[] = [
  {
    id: "score-1",
    userId: "user-1",
    playedAt: new Date("2026-03-08"),
    courseName: "○○カントリークラブ",
    score: 98,
    outScore: 50,
    inScore: 48,
    fairwayHit: 55,
    putts: 34,
    memo: "アイアンが安定してきた。バンカーが課題。",
    createdAt: new Date("2026-03-08"),
    updatedAt: new Date("2026-03-08"),
  },
  {
    id: "score-2",
    userId: "user-1",
    playedAt: new Date("2026-02-22"),
    courseName: "△△ゴルフリゾート",
    score: 103,
    outScore: 54,
    inScore: 49,
    fairwayHit: 45,
    putts: 36,
    memo: "ドライバーが右に出るホールが多かった。",
    createdAt: new Date("2026-02-22"),
    updatedAt: new Date("2026-02-22"),
  },
  {
    id: "score-3",
    userId: "user-1",
    playedAt: new Date("2026-01-18"),
    courseName: "□□ゴルフクラブ",
    score: 107,
    outScore: 55,
    inScore: 52,
    fairwayHit: 40,
    putts: 38,
    memo: null,
    createdAt: new Date("2026-01-18"),
    updatedAt: new Date("2026-01-18"),
  },
];

// ------------------------------------------------------------------ UserNotes（ミス共有ノート）
export const mockUserNotes: UserNote[] = [
  {
    id: "unote-1",
    userId: "user-1",
    title: "バンカーショットのミス",
    content:
      "左足体重のまま振ってしまい、ダフる。クラブヘッドをボールの手前10cmに入れる意識が必要。",
    category: "バンカー",
    createdAt: new Date("2026-03-09"),
    updatedAt: new Date("2026-03-09"),
  },
  {
    id: "unote-2",
    userId: "user-1",
    title: "ティーショットのプッシュアウト",
    content:
      "アドレスで右肩が前に出ているのが原因？インパクトで右に体が流れている気がする。次のレッスンで確認したい。",
    category: "ドライバー",
    createdAt: new Date("2026-02-23"),
    updatedAt: new Date("2026-02-23"),
  },
  {
    id: "unote-3",
    userId: "user-1",
    title: "短いパットを外す",
    content: "1m以内のパットを外すことが多い。ヘッドアップが原因と思われる。ボールを最後まで見る練習をする。",
    category: "パター",
    createdAt: new Date("2026-01-20"),
    updatedAt: new Date("2026-01-20"),
  },
];

// ------------------------------------------------------------------ CustomerDetail（集約）
export const mockCustomerDetails: Record<string, CustomerDetail> = {
  "user-1": {
    ...mockUsers[0],
    reservations: mockReservations
      .filter((r) => r.userId === "user-1")
      .map((r) => ({ ...r, schedule: { ...r.schedule, lessonPlan: r.schedule.lessonPlan } })),
    instructorNotes: mockInstructorNotes.filter((n) => n.userId === "user-1"),
    drills: mockDrills.filter((d) => d.userId === "user-1"),
  },
  "user-2": {
    ...mockUsers[1],
    reservations: mockReservations
      .filter((r) => r.userId === "user-2")
      .map((r) => ({ ...r, schedule: { ...r.schedule, lessonPlan: r.schedule.lessonPlan } })),
    instructorNotes: mockInstructorNotes.filter((n) => n.userId === "user-2"),
    drills: mockDrills.filter((d) => d.userId === "user-2"),
  },
  "user-3": {
    ...mockUsers[2],
    reservations: [],
    instructorNotes: [],
    drills: [],
  },
  "user-4": {
    ...mockUsers[3],
    reservations: [],
    instructorNotes: [],
    drills: [],
  },
};
