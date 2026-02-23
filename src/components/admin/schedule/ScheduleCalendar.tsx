"use client";

import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Schedule } from "@/types";
import { format, isSameDay } from "date-fns";
import { ja } from "date-fns/locale";

type Props = {
  schedules: Schedule[];
  selectedDate: Date | undefined;
  onSelectDate: (date: Date | undefined) => void;
};

export function ScheduleCalendar({ schedules, selectedDate, onSelectDate }: Props) {
  const [month, setMonth] = useState<Date>(new Date());

  // 日付ごとの枠数を集計
  const scheduledDates = schedules.map((s) => s.startAt);
  const bookedDates = schedules.filter((s) => !s.isAvailable).map((s) => s.startAt);

  function getDayStatus(date: Date): "booked" | "available" | "none" {
    const hasBooked = bookedDates.some((d) => isSameDay(d, date));
    const hasAvailable = scheduledDates.some((d) => isSameDay(d, date));
    if (hasBooked && !hasAvailable) return "booked";
    if (hasAvailable) return "available";
    return "none";
  }

  return (
    <div className="flex flex-col gap-4">
      {/* 凡例 */}
      <div className="flex items-center gap-4 text-xs text-stone-500">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-stone-800 inline-block" />
          空き枠あり
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-amber-400 inline-block" />
          予約済み
        </span>
      </div>

      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={onSelectDate}
        month={month}
        onMonthChange={setMonth}
        locale={ja}
        className="w-full"
        classNames={{
          month: "w-full",
          table: "w-full",
          cell: "flex-1",
        }}
        modifiers={{
          hasAvailable: (date) => getDayStatus(date) === "available",
          hasBooked: (date) => getDayStatus(date) === "booked",
        }}
        modifiersClassNames={{
          hasAvailable: "[&>button]:after:absolute [&>button]:after:bottom-1 [&>button]:after:left-1/2 [&>button]:after:-translate-x-1/2 [&>button]:after:size-1 [&>button]:after:rounded-full [&>button]:after:bg-stone-700 [&>button]:relative",
          hasBooked: "[&>button]:after:absolute [&>button]:after:bottom-1 [&>button]:after:left-1/2 [&>button]:after:-translate-x-1/2 [&>button]:after:size-1 [&>button]:after:rounded-full [&>button]:after:bg-amber-400 [&>button]:relative",
        }}
      />
    </div>
  );
}
