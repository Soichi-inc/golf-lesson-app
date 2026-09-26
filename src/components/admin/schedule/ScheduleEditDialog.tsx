"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import type { LessonPlan, Schedule } from "@/types";
import {
  ScheduleFormFields,
  scheduleFormSchema,
  resolvePlan,
  buildSchedulePayload,
  scheduleToFormValues,
  type ScheduleFormValues,
  type SchedulePayload,
} from "./ScheduleFormFields";

type Props = {
  /** 編集対象（null で閉じる） */
  schedule: Schedule | null;
  lessonPlans: LessonPlan[];
  /** 予約が入っている枠かどうか（変更時の注意表示に使用） */
  hasReservations: boolean;
  onClose: () => void;
  onUpdated: (scheduleId: string, data: SchedulePayload) => void;
};

export function ScheduleEditDialog({
  schedule,
  lessonPlans,
  hasReservations,
  onClose,
  onUpdated,
}: Props) {
  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: {
      allowAnyLocation: false,
      lessonPlanId: "",
      date: "",
      startTime: "10:00",
      teeOffTime: "",
      location: "",
      note: "",
    },
  });

  // 編集対象が切り替わるたびにフォームへ現在値を流し込む
  useEffect(() => {
    if (schedule) form.reset(scheduleToFormValues(schedule));
  }, [schedule, form]);

  const watchAllowAnyLocation = form.watch("allowAnyLocation");
  const hasIndoorPlan = lessonPlans.some((p) => p.category === "REGULAR");

  function onSubmit(values: ScheduleFormValues) {
    if (!schedule) return;
    const plan = resolvePlan(values, lessonPlans);
    if (!plan) {
      form.setError("lessonPlanId", {
        message: values.allowAnyLocation
          ? "インドアレッスンのプランが登録されていません。先にプランを作成してください。"
          : "レッスンプランを選択してください",
      });
      return;
    }

    onUpdated(schedule.id, buildSchedulePayload(values, plan));
    onClose();
  }

  return (
    <Dialog open={!!schedule} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-medium">空き枠の編集</DialogTitle>
        </DialogHeader>

        {hasReservations && (
          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
            <AlertTriangle className="size-4 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              この枠には予約が入っています。日時や場所を変更した場合は、お客様へのご連絡をお願いします。
            </p>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <ScheduleFormFields form={form} lessonPlans={lessonPlans} />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                キャンセル
              </Button>
              <Button
                type="submit"
                className="bg-stone-800 hover:bg-stone-700"
                disabled={watchAllowAnyLocation && !hasIndoorPlan}
              >
                保存する
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
