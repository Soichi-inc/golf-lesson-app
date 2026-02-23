"use client";

import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Clock, MapPin, Trash2, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Schedule } from "@/types";

// 予約済み枠は削除不可、空き枠は confirm で確認後削除
function DeleteConfirm({
  onConfirm,
  disabled,
}: {
  onConfirm: () => void;
  disabled: boolean;
}) {
  if (disabled) {
    return (
      <Button variant="ghost" size="icon" className="size-8 text-stone-300" disabled>
        <Trash2 className="size-3.5" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-8 text-stone-400 hover:text-red-500 hover:bg-red-50"
      onClick={() => {
        if (confirm("この空き枠を削除しますか？")) onConfirm();
      }}
    >
      <Trash2 className="size-3.5" />
    </Button>
  );
}

type Props = {
  schedules: Schedule[];
  selectedDate: Date | undefined;
  onDelete: (id: string) => void;
};

export function ScheduleList({ schedules, selectedDate, onDelete }: Props) {
  const filtered = selectedDate
    ? schedules.filter(
        (s) =>
          s.startAt.getFullYear() === selectedDate.getFullYear() &&
          s.startAt.getMonth() === selectedDate.getMonth() &&
          s.startAt.getDate() === selectedDate.getDate()
      )
    : schedules;

  const sorted = [...filtered].sort(
    (a, b) => a.startAt.getTime() - b.startAt.getTime()
  );

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-stone-400 border-2 border-dashed rounded-xl">
        <p className="text-sm">
          {selectedDate
            ? `${format(selectedDate, "M月d日", { locale: ja })} の空き枠はありません`
            : "空き枠がありません"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sorted.map((schedule) => (
        <ScheduleCard
          key={schedule.id}
          schedule={schedule}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

function ScheduleCard({
  schedule,
  onDelete,
}: {
  schedule: Schedule;
  onDelete: (id: string) => void;
}) {
  const isBooked = !schedule.isAvailable;

  return (
    <Card className={isBooked ? "border-amber-200 bg-amber-50/50" : "bg-white"}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          {/* 左: 時刻・プラン情報 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <Badge
                variant={isBooked ? "secondary" : "outline"}
                className={
                  isBooked
                    ? "bg-amber-100 text-amber-700 border-amber-200 text-[10px]"
                    : "text-[10px] text-stone-600"
                }
              >
                {isBooked ? "予約済み" : "空き"}
              </Badge>
              <Badge
                variant="outline"
                className="text-[10px] text-stone-500 border-stone-200"
              >
                {schedule.lessonPlan.category === "REGULAR"
                  ? "通常"
                  : "ラウンド"}
              </Badge>
            </div>

            <p className="font-medium text-stone-800 text-sm mb-1">
              {schedule.lessonPlan.name}
            </p>

            <div className="flex flex-col gap-1 text-xs text-stone-500">
              <span className="flex items-center gap-1.5">
                <Clock className="size-3" />
                {format(schedule.startAt, "HH:mm")} –{" "}
                {format(schedule.endAt, "HH:mm")}
              </span>
              {schedule.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="size-3" />
                  {schedule.location}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Users className="size-3" />
                定員 {schedule.maxAttendees}名
              </span>
            </div>

            {schedule.note && (
              <p className="mt-2 text-[11px] text-stone-400 bg-stone-50 rounded px-2 py-1">
                {schedule.note}
              </p>
            )}
          </div>

          {/* 右: 削除ボタン */}
          <DeleteConfirm
            onConfirm={() => onDelete(schedule.id)}
            disabled={isBooked}
          />
        </div>
      </CardContent>
    </Card>
  );
}
