"use client";

import type { UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { Sparkles } from "lucide-react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { LessonPlan, Schedule } from "@/types";

// 空き枠の「登録」と「編集」で同じフォームを使うための共通部品

export const scheduleFormSchema = z
  .object({
    allowAnyLocation: z.boolean(),
    lessonPlanId: z.string().optional(),
    date: z.string().min(1, "日付を入力してください"),
    startTime: z.string().min(1, "開始時刻を入力してください"),
    teeOffTime: z.string().optional(),
    location: z.string().optional(),
    note: z.string().optional(),
  })
  .refine(
    (v) => v.allowAnyLocation || (v.lessonPlanId && v.lessonPlanId.length > 0),
    {
      message: "レッスンプランを選択してください",
      path: ["lessonPlanId"],
    }
  );

export type ScheduleFormValues = z.infer<typeof scheduleFormSchema>;

export type SchedulePayload = Omit<
  Schedule,
  "id" | "createdAt" | "updatedAt" | "lessonPlan" | "isAvailable"
>;

/**
 * フォーム値から実際に使うプランを決める。
 * 場所リクエスト枠はインドアプランのみ対象で、未選択なら先頭のインドアプランを基準にする。
 */
export function resolvePlan(
  values: Pick<ScheduleFormValues, "allowAnyLocation" | "lessonPlanId">,
  lessonPlans: LessonPlan[]
): LessonPlan | undefined {
  if (values.allowAnyLocation) {
    const indoor = lessonPlans.filter((p) => p.category === "REGULAR");
    return indoor.find((p) => p.id === values.lessonPlanId) ?? indoor[0];
  }
  return lessonPlans.find((p) => p.id === values.lessonPlanId);
}

/** フォーム値とプランから保存用データを組み立てる */
export function buildSchedulePayload(
  values: ScheduleFormValues,
  plan: LessonPlan
): SchedulePayload {
  const startAt = new Date(`${values.date}T${values.startTime}:00`);
  const endAt = new Date(startAt.getTime() + plan.duration * 60 * 1000);
  return {
    lessonPlanId: plan.id,
    startAt,
    endAt,
    location: values.location?.trim() || null,
    maxAttendees: plan.maxAttendees,
    note: values.note?.trim() || null,
    teeOffTime: values.allowAnyLocation ? null : values.teeOffTime || null,
    allowAnyLocation: !!values.allowAnyLocation,
  };
}

/** 既存の枠を編集フォームの初期値に変換 */
export function scheduleToFormValues(schedule: Schedule): ScheduleFormValues {
  return {
    allowAnyLocation: schedule.allowAnyLocation,
    lessonPlanId: schedule.lessonPlanId,
    date: format(schedule.startAt, "yyyy-MM-dd"),
    startTime: format(schedule.startAt, "HH:mm"),
    teeOffTime: schedule.teeOffTime ?? "",
    location: schedule.location ?? "",
    note: schedule.note ?? "",
  };
}

type Props = {
  form: UseFormReturn<ScheduleFormValues>;
  lessonPlans: LessonPlan[];
};

export function ScheduleFormFields({ form, lessonPlans }: Props) {
  const watchAllowAnyLocation = form.watch("allowAnyLocation");
  const watchLessonPlanId = form.watch("lessonPlanId");
  const indoorPlans = lessonPlans.filter((p) => p.category === "REGULAR");
  const selectedPlan = resolvePlan(
    { allowAnyLocation: watchAllowAnyLocation, lessonPlanId: watchLessonPlanId },
    lessonPlans
  );
  const planOptions = watchAllowAnyLocation ? indoorPlans : lessonPlans;

  return (
    <>
      {/* 場所リクエスト枠トグル */}
      <FormField
        control={form.control}
        name="allowAnyLocation"
        render={({ field }) => (
          <FormItem>
            <div
              className={`flex items-start gap-3 rounded-xl border p-3 transition-colors ${
                field.value ? "border-violet-300 bg-violet-50" : "border-stone-200"
              }`}
            >
              <Sparkles
                className={`size-4 mt-0.5 shrink-0 ${
                  field.value ? "text-violet-600" : "text-stone-400"
                }`}
              />
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <label
                    htmlFor="allow-any-location-toggle"
                    className="text-sm font-medium text-stone-700 cursor-pointer"
                  >
                    場所リクエスト枠として登録
                  </label>
                  <FormControl>
                    <Switch
                      id="allow-any-location-toggle"
                      checked={!!field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </div>
                <p className="mt-1 text-[11px] text-stone-500 leading-relaxed">
                  ONにすると、お客様は予約時に既存店舗から選ぶか、任意の場所をリクエストできます（50分／70分・単発／4回チケット）。場所代金・ボール代金等はお客様負担です。
                </p>
              </div>
            </div>
          </FormItem>
        )}
      />

      {/* レッスンプラン（場所リクエスト枠ON時はインドアプランから「基準プラン」を選ぶ） */}
      <FormField
        control={form.control}
        name="lessonPlanId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {watchAllowAnyLocation ? "基準プラン（時間・料金の目安）" : "レッスンプラン"}
            </FormLabel>
            <Select
              onValueChange={field.onChange}
              value={watchAllowAnyLocation ? selectedPlan?.id ?? "" : field.value || ""}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="プランを選択" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {planOptions.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.name}（{plan.duration}分 / ¥{plan.price.toLocaleString()}）
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {watchAllowAnyLocation && indoorPlans.length > 0 && (
              <p className="text-[11px] text-stone-500">
                お客様は予約時に、ここで選んだ店舗以外や任意の場所も選べます。
              </p>
            )}
            {watchAllowAnyLocation && indoorPlans.length === 0 && (
              <p className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">
                インドアレッスンのプランが登録されていません。先にレッスンプランを1つ以上登録してください。
              </p>
            )}
            <FormMessage />
          </FormItem>
        )}
      />

      {/* 日付 */}
      <FormField
        control={form.control}
        name="date"
        render={({ field }) => (
          <FormItem>
            <FormLabel>日付</FormLabel>
            <FormControl>
              <Input type="date" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* 開始時刻 */}
      <FormField
        control={form.control}
        name="startTime"
        render={({ field }) => (
          <FormItem>
            <FormLabel>開始時刻</FormLabel>
            <FormControl>
              <Input type="time" {...field} />
            </FormControl>
            {watchAllowAnyLocation && (
              <p className="text-[11px] text-violet-600 mt-1">
                ※1時間刻みでスロットを複数作成してください。お客様が50分／70分を選択します。
              </p>
            )}
            <FormMessage />
          </FormItem>
        )}
      />

      {/* ティーオフ時刻（ラウンドのみ） */}
      {!watchAllowAnyLocation && selectedPlan?.category === "ROUND" && (
        <FormField
          control={form.control}
          name="teeOffTime"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ティーオフ時刻</FormLabel>
              <FormControl>
                <Input type="time" placeholder="例: 08:30" {...field} />
              </FormControl>
              <p className="text-[11px] text-stone-400">
                ゴルフ場のスタート時刻を入力してください
              </p>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {/* 実施場所（場所リクエスト枠でも入力可。空欄なら「予約時に選択」表示） */}
      <FormField
        control={form.control}
        name="location"
        render={({ field }) => (
          <FormItem>
            <FormLabel>実施場所（任意）</FormLabel>
            <FormControl>
              <Input placeholder="例: ○○ゴルフクラブ 打席" {...field} />
            </FormControl>
            {watchAllowAnyLocation && (
              <p className="text-[11px] text-stone-500 leading-relaxed">
                空欄の場合、お客様には「場所は予約時にお選びいただけます」と表示されます。入力すると基本会場として表示され、他の場所もリクエスト可能です。
              </p>
            )}
            <FormMessage />
          </FormItem>
        )}
      />

      {/* メモ */}
      <FormField
        control={form.control}
        name="note"
        render={({ field }) => (
          <FormItem>
            <FormLabel>メモ（任意・非公開）</FormLabel>
            <FormControl>
              <Textarea
                placeholder="例: 雨天中止"
                className="resize-none"
                rows={2}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
