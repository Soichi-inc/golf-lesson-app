"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format, isSameDay, isBefore, startOfDay } from "date-fns";
import { ja } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, Users, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Schedule } from "@/types";

type Props = {
  schedules: Schedule[];
};

export function SchedulePicker({ schedules }: Props) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);

  const today = startOfDay(new Date());

  // 選択日の空き枠（今日以降のもの）
  const daySlots = selectedDate
    ? schedules.filter(
        (s) => s.isAvailable && isSameDay(s.startAt, selectedDate)
      )
    : [];

  // カレンダーで空き枠がある日（今日以降）
  const availableDates = schedules
    .filter((s) => s.isAvailable && !isBefore(startOfDay(s.startAt), today))
    .map((s) => s.startAt);

  function hasAvailable(date: Date) {
    return availableDates.some((d) => isSameDay(d, date));
  }

  function handleProceed() {
    if (!selectedScheduleId) return;
    router.push(`/reserve/${selectedScheduleId}`);
  }

  return (
    <div className="space-y-6">
      {/* Step インジケーター */}
      <div className="flex items-center gap-2 text-xs text-stone-500">
        <span className="flex size-5 items-center justify-center rounded-full bg-stone-800 text-white text-[10px] font-bold">1</span>
        <span className="font-medium text-stone-800">日時を選ぶ</span>
        <ChevronRight className="size-3 text-stone-300" />
        <span className="flex size-5 items-center justify-center rounded-full bg-stone-200 text-stone-400 text-[10px] font-bold">2</span>
        <span className="text-stone-400">予約フォーム</span>
        <ChevronRight className="size-3 text-stone-300" />
        <span className="flex size-5 items-center justify-center rounded-full bg-stone-200 text-stone-400 text-[10px] font-bold">3</span>
        <span className="text-stone-400">完了</span>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[auto_1fr]">
        {/* カレンダーパネル */}
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-100">
          {/* 凡例 */}
          <div className="mb-4 flex items-center gap-4 text-[11px] text-stone-500">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-stone-700 inline-block" />
              空き枠あり
            </span>
          </div>

          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(d) => {
              setSelectedDate(d);
              setSelectedScheduleId(null);
            }}
            locale={ja}
            disabled={(date) =>
              isBefore(startOfDay(date), today) || !hasAvailable(date)
            }
            modifiers={{ hasSlot: (date) => hasAvailable(date) }}
            modifiersClassNames={{
              hasSlot:
                "[&>button]:after:absolute [&>button]:after:bottom-1 [&>button]:after:left-1/2 [&>button]:after:-translate-x-1/2 [&>button]:after:size-1 [&>button]:after:rounded-full [&>button]:after:bg-stone-700 [&>button]:relative",
            }}
          />
        </div>

        {/* 時間枠選択パネル */}
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-100">
          {!selectedDate ? (
            <div className="flex h-full min-h-[200px] items-center justify-center text-center">
              <div>
                <p className="text-sm font-medium text-stone-600 mb-1">カレンダーから日付を選んでください</p>
                <p className="text-xs text-stone-400">●マークがついた日に空き枠があります</p>
              </div>
            </div>
          ) : daySlots.length === 0 ? (
            <div className="flex h-full min-h-[200px] items-center justify-center text-center">
              <div>
                <p className="text-sm font-medium text-stone-600 mb-1">
                  {format(selectedDate, "M月d日（E）", { locale: ja })}
                </p>
                <p className="text-xs text-stone-400">この日の空き枠はありません</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-stone-700">
                {format(selectedDate, "M月d日（E）", { locale: ja })}の空き枠
              </h3>
              <ul className="flex flex-col gap-2">
                {daySlots.map((slot) => (
                  <li key={slot.id}>
                    <button
                      onClick={() => setSelectedScheduleId(slot.id)}
                      className={cn(
                        "w-full rounded-xl border p-4 text-left transition-all",
                        selectedScheduleId === slot.id
                          ? "border-stone-800 bg-stone-50 ring-1 ring-stone-800"
                          : "border-stone-100 hover:border-stone-300 hover:bg-stone-50"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <span className="font-semibold text-stone-800 text-sm">
                              {format(slot.startAt, "HH:mm")} – {format(slot.endAt, "HH:mm")}
                            </span>
                            <Badge
                              variant="outline"
                              className="text-[10px] border-stone-200 text-stone-500"
                            >
                              {slot.lessonPlan.category === "REGULAR" ? "通常" : "ラウンド"}
                            </Badge>
                          </div>
                          <p className="text-xs text-stone-600 mb-1">{slot.lessonPlan.name}</p>
                          <div className="flex flex-wrap gap-3 text-[11px] text-stone-400">
                            {slot.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="size-3" />{slot.location}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Users className="size-3" />定員{slot.maxAttendees}名
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="size-3" />{slot.lessonPlan.duration}分
                            </span>
                          </div>
                        </div>
                        <p className="text-sm font-medium text-stone-700 shrink-0">
                          ¥{slot.lessonPlan.price.toLocaleString()}
                        </p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>

              {/* 次へボタン */}
              <Button
                onClick={handleProceed}
                disabled={!selectedScheduleId}
                className="w-full rounded-full bg-stone-800 hover:bg-stone-700 disabled:opacity-40"
              >
                この枠で予約フォームへ進む
                <ChevronRight className="size-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
