// =============================================================================
// ドメイン型定義（Prisma スキーマに対応）
// =============================================================================

export type Role = "USER" | "ADMIN";
export type ReservationStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
export type LessonCategory = "REGULAR" | "ROUND";
export type DrillStatus = "ASSIGNED" | "IN_PROGRESS" | "COMPLETED";

// ------------------------------------------------------------------ User
export type User = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  role: Role;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
};

// ------------------------------------------------------------------ LessonPlan
export type LessonPlan = {
  id: string;
  name: string;
  category: LessonCategory;
  description: string | null;
  price: number;
  duration: number;
  maxAttendees: number;
  isPublished: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

// ------------------------------------------------------------------ Schedule
export type Schedule = {
  id: string;
  lessonPlanId: string;
  lessonPlan: LessonPlan;
  startAt: Date;
  endAt: Date;
  location: string | null;
  maxAttendees: number;
  isAvailable: boolean;
  note: string | null;
  /** ラウンドレッスン用: ティーオフ時刻（例: "8:30"） */
  teeOffTime: string | null;
  createdAt: Date;
  updatedAt: Date;
};

// ------------------------------------------------------------------ Reservation
export type Reservation = {
  id: string;
  userId: string;
  user: User;
  scheduleId: string;
  schedule: Schedule;
  status: ReservationStatus;
  concern: string | null;
  agreedCancelPolicy: boolean;
  agreedPhotoPost: boolean;
  cancelledAt: Date | null;
  cancelReason: string | null;
  createdAt: Date;
  updatedAt: Date;
};

// ------------------------------------------------------------------ InstructorNote
export type InstructorNote = {
  id: string;
  userId: string;
  lessonRecordId: string | null;
  content: string;
  isPrivate: boolean;
  createdAt: Date;
  updatedAt: Date;
};

// ------------------------------------------------------------------ Drill
export type Drill = {
  id: string;
  userId: string;
  lessonRecordId: string | null;
  title: string;
  description: string | null;
  videoUrl: string | null;
  status: DrillStatus;
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

// ------------------------------------------------------------------ RoundScore
export type RoundScore = {
  id: string;
  userId: string;
  playedAt: Date;
  courseName: string;
  score: number;
  outScore: number | null;
  inScore: number | null;
  fairwayHit: number | null;
  putts: number | null;
  memo: string | null;
  createdAt: Date;
  updatedAt: Date;
};

// ------------------------------------------------------------------ UserNote
export type UserNote = {
  id: string;
  userId: string;
  title: string | null;
  content: string;
  category: string | null;
  createdAt: Date;
  updatedAt: Date;
};

// ------------------------------------------------------------------ 顧客カルテ用集約型
export type CustomerDetail = User & {
  reservations: (Reservation & { schedule: Schedule & { lessonPlan: LessonPlan } })[];
  instructorNotes: InstructorNote[];
  drills: Drill[];
};
