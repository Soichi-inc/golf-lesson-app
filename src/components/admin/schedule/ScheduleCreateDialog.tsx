"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import type { LessonPlan, Schedule } from "@/types";
import {
  ScheduleFormFields,
  scheduleFormSchema,
  resolvePlan,
  buildSchedulePayload,
  type ScheduleFormValues,
} from "./ScheduleFormFields";

type Props = {
  lessonPlans: LessonPlan[];
  defaultDate?: Date;
  onCreated: (schedule: Omit<Schedule, "id" | "createdAt" | "updatedAt" | "lessonPlan">) => void;
};

export function ScheduleCreateDialog({ lessonPlans, defaultDate, onCreated }: Props) {
  const [open, setOpen] = useState(false);

  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleFormSchema),
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
  const hasIndoorPlan = lessonPlans.some((p) => p.category === "REGULAR");

  function onSubmit(values: ScheduleFormValues) {
    const plan = resolvePlan(values, lessonPlans);
    if (!plan) {
      form.setError("lessonPlanId", {
        message: values.allowAnyLocation
          ? "インドアレッスンのプランが登録されていません。先にプランを作成してください。"
          : "レッスンプランを選択してください",
      });
      return;
    }

    onCreated({ ...buildSchedulePayload(values, plan), isAvailable: true });
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
            <ScheduleFormFields form={form} lessonPlans={lessonPlans} />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                キャンセル
              </Button>
              <Button
                type="submit"
                className="bg-stone-800 hover:bg-stone-700"
                disabled={watchAllowAnyLocation && !hasIndoorPlan}
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
