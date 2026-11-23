"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ja } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, Users, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Schedule } from "@/types";
import {
  calendarDateKey,
  formatCalendarDate,
  formatJst,
  jstCalendarDate,
  jstDateKey,
} from "@/lib/datetime";

type CategoryFilter = "ALL" | "REGULAR" | "ROUND";

const filterOptions: { value: CategoryFilter; label: string }[] = [
  { value: "ALL", label: "すべて" },
  { value: "REGULAR", label: "インドア" },
  { value: "ROUND", label: "ラウンド" },
];

type Props = {
  schedules: Schedule[];
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

export function SchedulePicker({ schedules: rawSchedules }: Props) {
  const schedules = rawSchedules.map(hydrateSchedule);
  const router = useRouter();
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("ALL");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);

  // 日付の判定はすべて日本時間で行う（サーバーは世界標準時で動くため。詳細は lib/datetime.ts）
  const [nowMs] = useState(() => Date.now());
  const todayKey = jstDateKey(nowMs);

  /** これから予約できる枠か（公開中で、開始時刻を過ぎていない） */
  const isBookable = (s: Schedule) => s.isAvailable && s.startAt.getTime() > nowMs;
  const matchesCategory = (s: Schedule, filter: CategoryFilter) =>
    filter === "ALL" || s.lessonPlan.category === filter;

  const bookable = schedules.filter(isBookable);
  const filtered = bookable.filter((s) => matchesCategory(s, categoryFilter));

  // カレンダーで空き枠がある日（日本時間の日付）
  const availableDateKeys = new Set(filtered.map((s) => jstDateKey(s.startAt)));
  const hasAvailable = (cell: Date) => availableDateKeys.has(calendarDateKey(cell));

  // 選択日の空き枠
  const daySlots = selectedDate
    ? filtered
        .filter((s) => jstDateKey(s.startAt) === calendarDateKey(selectedDate))
        .sort((a, b) => a.startAt.getTime() - b.startAt.getTime())
    : [];

  // 最初に表示する月: いちばん近い空き枠のある月（今月に空きが無いとき、空の月を見せない）
  const firstBookable = [...bookable].sort(
    (a, b) => a.startAt.getTime() - b.startAt.getTime()
  )[0];
  const calendarToday = jstCalendarDate(nowMs);
  const initialMonth = firstBookable ? jstCalendarDate(firstBookable.startAt) : calendarToday;

  function handleFilterChange(value: CategoryFilter) {
    setCategoryFilter(value);
    setSelectedScheduleId(null);
    // 選択中の日付にフィルター後の枠がなければ日付選択もリセット
    if (selectedDate) {
      const selectedKey = calendarDateKey(selectedDate);
      const hasSlots = bookable.some(
        (s) => jstDateKey(s.startAt) === selectedKey && matchesCategory(s, value)
      );
      if (!hasSlots) {
        setSelectedDate(undefined);
      }
    }
  }

  function handleProceed() {
    if (!selectedScheduleId) return;
    router.push(`/reserve/${selectedScheduleId}`);
  }

  // フィルター別の件数
  const countMap: Record<CategoryFilter, number> = {
    ALL: bookable.length,
    REGULAR: bookable.filter((s) => s.lessonPlan.category === "REGULAR").length,
    ROUND: bookable.filter((s) => s.lessonPlan.category === "ROUND").length,
  };

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

      {/* カテゴリフィルター */}
      <div className="flex flex-wrap items-center gap-2">
        {filterOptions.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => handleFilterChange(value)}
            className={cn(
              "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-all sm:px-4",
              categoryFilter === value
                ? value === "ROUND"
                  ? "bg-amber-500 text-white shadow-sm"
                  : "bg-stone-800 text-white shadow-sm"
                : "bg-white text-stone-500 ring-1 ring-stone-200 hover:bg-stone-50 hover:text-stone-700"
            )}
          >
            {label}
            <span
              className={cn(
                "text-[10px] tabular-nums rounded-full px-1.5 py-0.5 min-w-[20px] text-center",
                categoryFilter === value
                  ? "bg-white/20 text-white"
                  : "bg-stone-100 text-stone-400"
              )}
            >
              {countMap[value]}
            </span>
          </button>
        ))}
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
            today={calendarToday}
            defaultMonth={initialMonth}
            startMonth={calendarToday}
            disabled={(date) =>
              calendarDateKey(date) < todayKey || !hasAvailable(date)
            }
            modifiers={{ hasSlot: (date) => hasAvailable(date) }}
            modifiersClassNames={{
              hasSlot:
                "[&>button]:after:absolute [&>button]:after:bottom-1 [&>button]:after:left-1/2 [&>button]:after:-translate-x-1/2 [&>button]:after:size-1 [&>button]:after:rounded-full [&>button]:after:bg-stone-700 [&>button]:relative",
            }}
            className="w-full p-0 [--cell-size:clamp(2rem,11vw,2.75rem)] sm:[--cell-size:--spacing(8)]"
            classNames={{ root: "w-full", month: "w-full" }}
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
                  {formatCalendarDate(selectedDate, "M月d日（E）")}
                </p>
                <p className="text-xs text-stone-400">この日の空き枠はありません</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-stone-700">
                {formatCalendarDate(selectedDate, "M月d日（E）")}の空き枠
                <span className="ml-2 text-xs font-normal text-stone-400">
                  {daySlots.length}件
                </span>
              </h3>
              <ul className="flex flex-col gap-2">
                {daySlots.map((slot) => {
                  const isRound = slot.lessonPlan.category === "ROUND";
                  return (
                    <li key={slot.id}>
                      <button
                        onClick={() => setSelectedScheduleId(slot.id)}
                        className={cn(
                          "w-full rounded-xl border p-4 text-left transition-all",
                          selectedScheduleId === slot.id
                            ? isRound
                              ? "border-amber-500 bg-amber-50/50 ring-1 ring-amber-500"
                              : "border-stone-800 bg-stone-50 ring-1 ring-stone-800"
                            : "border-stone-100 hover:border-stone-300 hover:bg-stone-50"
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1.5">
                              <span className="font-semibold text-stone-800 text-sm">
                                {formatJst(slot.startAt, "HH:mm")} – {formatJst(slot.endAt, "HH:mm")}
                              </span>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-[10px]",
                                  isRound
                                    ? "border-amber-200 bg-amber-50 text-amber-700"
                                    : "border-stone-200 text-stone-500"
                                )}
                              >
                                {isRound ? "ラウンド" : "インドア"}
                              </Badge>
                              {slot.allowAnyLocation && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] border-violet-200 bg-violet-50 text-violet-700"
                                >
                                  場所リクエスト可
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-stone-600 mb-1">
                              {slot.allowAnyLocation
                                ? "インドアレッスン（場所リクエスト可）"
                                : slot.lessonPlan.name}
                            </p>
                            {slot.teeOffTime && (
                              <p className="text-[11px] font-medium text-amber-600 mb-1 flex items-center gap-1">
                                <Clock className="size-3" />ティーオフ {slot.teeOffTime}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-3 text-[11px] text-stone-400">
                              {slot.allowAnyLocation ? (
                                <span className="flex items-center gap-1 text-violet-600">
                                  <MapPin className="size-3" />
                                  {slot.location
                                    ? `基本会場：${slot.location}（他の場所もリクエスト可）`
                                    : "場所は予約時にお選びいただけます"}
                                </span>
                              ) : (
                                slot.location && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="size-3" />{slot.location}
                                  </span>
                                )
                              )}
                              <span className="flex items-center gap-1">
                                <Users className="size-3" />定員{slot.maxAttendees}名
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="size-3" />
                                {slot.allowAnyLocation
                                  ? "50/70分"
                                  : `${slot.lessonPlan.duration}分`}
                              </span>
                            </div>
                            {slot.note && (
                              <p className="mt-1.5 text-[11px] text-stone-400 italic">{slot.note}</p>
                            )}
                          </div>
                          <p className="text-sm font-medium text-stone-700 shrink-0 text-right">
                            {slot.allowAnyLocation ? (
                              <span className="text-xs text-violet-600">
                                予約時に確定
                              </span>
                            ) : (
                              `¥${slot.lessonPlan.price.toLocaleString()}`
                            )}
                          </p>
                        </div>
                      </button>
                    </li>
                  );
                })}
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
