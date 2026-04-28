"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Plus, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
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

const formSchema = z
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

type FormValues = z.infer<typeof formSchema>;

type Props = {
  lessonPlans: LessonPlan[];
  defaultDate?: Date;
  onCreated: (schedule: Omit<Schedule, "id" | "createdAt" | "updatedAt" | "lessonPlan">) => void;
};

export function ScheduleCreateDialog({ lessonPlans, defaultDate, onCreated }: Props) {
  const [open, setOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      allowAnyLocation: false,
      lessonPlanId: "",
      date: defaultDate ? format(defaultDate, "yyyy-MM-dd") : "",
      startTime: "10:00",
      teeOffTime: "",
      location: "",
      note: "",
    },
  });

  const watchAllowAnyLocation = form.watch("allowAnyLocation");
  const watchLessonPlanId = form.watch("lessonPlanId");
  // 場所リクエスト枠ON時はインドア(REGULAR)プランの先頭を内部的に利用
  const fallbackPlan = lessonPlans.find((p) => p.category === "REGULAR");
  const selectedPlan = watchAllowAnyLocation
    ? fallbackPlan
    : lessonPlans.find((p) => p.id === watchLessonPlanId);

  function onSubmit(values: FormValues) {
    const plan = values.allowAnyLocation
      ? fallbackPlan
      : lessonPlans.find((p) => p.id === values.lessonPlanId);
    if (!plan) {
      form.setError("lessonPlanId", {
        message: values.allowAnyLocation
          ? "インドアレッスンのプランが登録されていません。先にプランを作成してください。"
          : "レッスンプランを選択してください",
      });
      return;
    }

    const startAt = new Date(`${values.date}T${values.startTime}:00`);
    const endAt = new Date(startAt.getTime() + plan.duration * 60 * 1000);

    onCreated({
      lessonPlanId: plan.id,
      startAt,
      endAt,
      location: values.allowAnyLocation ? null : values.location || null,
      maxAttendees: plan.maxAttendees,
      isAvailable: true,
      note: values.note || null,
      teeOffTime: values.allowAnyLocation ? null : values.teeOffTime || null,
      allowAnyLocation: !!values.allowAnyLocation,
    });

    form.reset();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-stone-800 hover:bg-stone-700 gap-1.5">
          <Plus className="size-4" />
          空き枠を追加
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-medium">空き枠の登録</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* 場所リクエスト枠トグル（最上部に配置） */}
            <FormField
              control={form.control}
              name="allowAnyLocation"
              render={({ field }) => (
                <FormItem>
                  <div
                    className={`flex items-start gap-3 rounded-xl border p-3 transition-colors ${
                      field.value
                        ? "border-violet-300 bg-violet-50"
                        : "border-stone-200"
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
                        ONにすると、この枠はインドアの「場所リクエスト枠」になります。お客様は予約時に既存店舗から選ぶか、任意の場所をリクエスト可能（50分／70分・単発／4回チケット）。場所代金・ボール代金等はお客様負担です。
                      </p>
                    </div>
                  </div>
                </FormItem>
              )}
            />

            {/* レッスンプラン（場所リクエスト枠ONの場合は隠す） */}
            {!watchAllowAnyLocation && (
              <FormField
                control={form.control}
                name="lessonPlanId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>レッスンプラン</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="プランを選択" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {lessonPlans.map((plan) => (
                          <SelectItem key={plan.id} value={plan.id}>
                            {plan.name}（{plan.duration}分 / ¥{plan.price.toLocaleString()}）
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* 場所リクエスト枠ON時のプラン情報表示 */}
            {watchAllowAnyLocation && fallbackPlan && (
              <div className="rounded-xl bg-stone-50 border border-stone-200 px-3 py-2 text-xs text-stone-500">
                <span className="font-medium text-stone-700">プラン：</span>場所リクエスト枠（インドア・お客様が予約時に場所と時間を選択）
              </div>
            )}
            {watchAllowAnyLocation && !fallbackPlan && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">
                インドアレッスンのプランが登録されていません。先にレッスンプランを1つ以上登録してください。
              </div>
            )}

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

            {/* ティーオフ時刻（ラウンドの場合のみ・場所リクエスト枠OFF時のみ） */}
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

            {/* 場所（場所リクエスト枠OFF時のみ） */}
            {!watchAllowAnyLocation && (
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>実施場所（任意）</FormLabel>
                    <FormControl>
                      <Input placeholder="例: ○○ゴルフクラブ 打席" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

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

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                キャンセル
              </Button>
              <Button
                type="submit"
                className="bg-stone-800 hover:bg-stone-700"
                disabled={watchAllowAnyLocation && !fallbackPlan}
              >
                登録する
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
