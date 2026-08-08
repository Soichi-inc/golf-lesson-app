"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { CalendarDays } from "lucide-react";
import { ScheduleCalendar } from "./ScheduleCalendar";
import { ScheduleList } from "./ScheduleList";
import { ScheduleCreateDialog } from "./ScheduleCreateDialog";
import { addSchedule, deleteSchedule } from "@/app/actions/schedules";
import type { LessonPlan, Schedule } from "@/types";

type Props = {
  initialSchedules: Schedule[];
  lessonPlans: LessonPlan[];
  /** スケジュールIDごとの予約状況（キャンセル除く件数） */
  bookedCounts?: Record<string, { count: number; privateLocked: boolean }>;
};

/** Date文字列→Date変換（Server→Clientのシリアライゼーション対策） */
function ensureDate(v: Date | string): Date {
  return v instanceof Date ? v : new Date(v);
}

function hydrateSchedule(s: Schedule): Schedule {
  return {
    ...s,
    startAt: ensureDate(s.startAt),
    endAt: ensureDate(s.endAt),
    createdAt: ensureDate(s.createdAt),
    updatedAt: ensureDate(s.updatedAt),
    lessonPlan: {
      ...s.lessonPlan,
      createdAt: ensureDate(s.lessonPlan.createdAt),
      updatedAt: ensureDate(s.lessonPlan.updatedAt),
    },
  };
}

function hydrateLessonPlan(p: LessonPlan): LessonPlan {
  return {
    ...p,
    createdAt: ensureDate(p.createdAt),
    updatedAt: ensureDate(p.updatedAt),
  };
}

export function ScheduleManager({ initialSchedules, lessonPlans, bookedCounts }: Props) {
  const router = useRouter();
  const [schedules, setSchedules] = useState<Schedule[]>(
    initialSchedules.map(hydrateSchedule)
  );
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date()
  );
  const [saving, setSaving] = useState(false);
  // 予約が入った枠はデフォルトで一覧から隠す（トグルで表示可能）
  const [showBooked, setShowBooked] = useState(false);

  const hydratedPlans = lessonPlans.map(hydrateLessonPlan);

  /** 予約（キャンセル除く）が1件でも入っている枠か */
  const isBooked = (s: Schedule) => (bookedCounts?.[s.id]?.count ?? 0) > 0;

  const bookedTotal = schedules.filter(isBooked).length;
  const visibleSchedules = showBooked
    ? schedules
    : schedules.filter((s) => !isBooked(s));

  async function handleCreated(
    data: Omit<Schedule, "id" | "createdAt" | "updatedAt" | "lessonPlan">
  ) {
    const plan = hydratedPlans.find((p) => p.id === data.lessonPlanId)!;
    const newSchedule: Schedule = {
      ...data,
      id: `sch-${Date.now()}`,
      lessonPlan: plan,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // 楽観的にUI更新
    setSchedules((prev) => [...prev, newSchedule]);
    setSaving(true);

    // サーバーに永続化
    const result = await addSchedule({
      lessonPlanId: data.lessonPlanId,
      lessonPlan: plan,
      startAt: data.startAt,
      endAt: data.endAt,
      location: data.location,
      maxAttendees: data.maxAttendees,
      isAvailable: data.isAvailable,
      note: data.note,
      teeOffTime: data.teeOffTime,
      allowAnyLocation: data.allowAnyLocation,
    });

    setSaving(false);

    if (result.success && result.schedule) {
      // サーバーから返ったIDで置き換え
      setSchedules((prev) =>
        prev.map((s) =>
          s.id === newSchedule.id ? hydrateSchedule(result.schedule!) : s
        )
      );
      router.refresh();
    } else {
      // 失敗時はロールバック
      setSchedules((prev) => prev.filter((s) => s.id !== newSchedule.id));
      alert(result.error || "スケジュールの保存に失敗しました");
    }
  }

  async function handleDelete(id: string) {
    // 楽観的にUI更新
    const deleted = schedules.find((s) => s.id === id);
    setSchedules((prev) => prev.filter((s) => s.id !== id));

    const result = await deleteSchedule(id);
    if (!result.success) {
      // ロールバック
      if (deleted) {
        setSchedules((prev) => [...prev, deleted]);
      }
      alert(result.error || "スケジュールの削除に失敗しました");
    } else {
      router.refresh();
    }
  }

  const displayedCount = selectedDate
    ? visibleSchedules.filter(
        (s) =>
          s.startAt.getFullYear() === selectedDate.getFullYear() &&
          s.startAt.getMonth() === selectedDate.getMonth() &&
          s.startAt.getDate() === selectedDate.getDate()
      ).length
    : visibleSchedules.length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-6 items-start">
      {/* カレンダーパネル */}
      <div className="bg-white rounded-xl border p-5 shadow-sm">
        <ScheduleCalendar
          schedules={visibleSchedules}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
      </div>

      {/* 右側: 空き枠一覧 */}
      <div className="space-y-4">
        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="size-4 text-stone-500" />
            <h2 className="text-sm font-medium text-stone-700">
              {selectedDate
                ? format(selectedDate, "M月d日（E）", { locale: ja })
                : "すべての空き枠"}
              <span className="ml-2 text-stone-400 font-normal">
                {displayedCount}件
              </span>
            </h2>
            {saving && (
              <span className="text-xs text-stone-400 animate-pulse">
                保存中...
              </span>
            )}
          </div>
          <ScheduleCreateDialog
            lessonPlans={hydratedPlans}
            defaultDate={selectedDate}
            onCreated={handleCreated}
          />
        </div>

        {/* 予約済み枠の表示トグル（予約が入った枠はデフォルト非表示） */}
        {bookedTotal > 0 && (
          <button
            type="button"
            onClick={() => setShowBooked((v) => !v)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors ${
              showBooked
                ? "border-amber-300 bg-amber-50 text-amber-700"
                : "border-stone-200 bg-white text-stone-500 hover:bg-stone-50"
            }`}
          >
            <span
              className={`inline-block size-1.5 rounded-full ${
                showBooked ? "bg-amber-500" : "bg-stone-300"
              }`}
            />
            {showBooked
              ? "予約済みの枠を隠す"
              : `予約済みの枠を表示（${bookedTotal}件）`}
          </button>
        )}

        {/* 枠一覧 */}
        <ScheduleList
          schedules={visibleSchedules}
          selectedDate={selectedDate}
          onDelete={handleDelete}
          bookedCounts={bookedCounts}
        />
      </div>
    </div>
  );
}
