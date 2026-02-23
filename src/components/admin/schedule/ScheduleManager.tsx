"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { CalendarDays } from "lucide-react";
import { ScheduleCalendar } from "./ScheduleCalendar";
import { ScheduleList } from "./ScheduleList";
import { ScheduleCreateDialog } from "./ScheduleCreateDialog";
import type { LessonPlan, Schedule } from "@/types";

type Props = {
  initialSchedules: Schedule[];
  lessonPlans: LessonPlan[];
};

export function ScheduleManager({ initialSchedules, lessonPlans }: Props) {
  const [schedules, setSchedules] = useState<Schedule[]>(initialSchedules);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date()
  );

  function handleCreated(
    data: Omit<Schedule, "id" | "createdAt" | "updatedAt" | "lessonPlan">
  ) {
    const plan = lessonPlans.find((p) => p.id === data.lessonPlanId)!;
    const newSchedule: Schedule = {
      ...data,
      id: `sch-${Date.now()}`,
      lessonPlan: plan,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setSchedules((prev) => [...prev, newSchedule]);
  }

  function handleDelete(id: string) {
    setSchedules((prev) => prev.filter((s) => s.id !== id));
  }

  const displayedCount = selectedDate
    ? schedules.filter(
        (s) =>
          s.startAt.getFullYear() === selectedDate.getFullYear() &&
          s.startAt.getMonth() === selectedDate.getMonth() &&
          s.startAt.getDate() === selectedDate.getDate()
      ).length
    : schedules.length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-6 items-start">
      {/* カレンダーパネル */}
      <div className="bg-white rounded-xl border p-5 shadow-sm">
        <ScheduleCalendar
          schedules={schedules}
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
          </div>
          <ScheduleCreateDialog
            lessonPlans={lessonPlans}
            defaultDate={selectedDate}
            onCreated={handleCreated}
          />
        </div>

        {/* 枠一覧 */}
        <ScheduleList
          schedules={schedules}
          selectedDate={selectedDate}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}
