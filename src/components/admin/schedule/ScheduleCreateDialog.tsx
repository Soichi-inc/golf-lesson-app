"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { LessonPlan, Schedule } from "@/types";

const formSchema = z.object({
  lessonPlanId: z.string().min(1, "レッスンプランを選択してください"),
  date: z.string().min(1, "日付を入力してください"),
  startTime: z.string().min(1, "開始時刻を入力してください"),
  location: z.string().optional(),
  note: z.string().optional(),
});

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
      lessonPlanId: "",
      date: defaultDate ? format(defaultDate, "yyyy-MM-dd") : "",
      startTime: "10:00",
      location: "",
      note: "",
    },
  });

  function onSubmit(values: FormValues) {
    const plan = lessonPlans.find((p) => p.id === values.lessonPlanId);
    if (!plan) return;

    const startAt = new Date(`${values.date}T${values.startTime}:00`);
    const endAt = new Date(startAt.getTime() + plan.duration * 60 * 1000);

    onCreated({
      lessonPlanId: values.lessonPlanId,
      startAt,
      endAt,
      location: values.location || null,
      maxAttendees: plan.maxAttendees,
      isAvailable: true,
      note: values.note || null,
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

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-medium">空き枠の登録</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* レッスンプラン */}
            <FormField
              control={form.control}
              name="lessonPlanId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>レッスンプラン</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 場所 */}
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
              <Button type="submit" className="bg-stone-800 hover:bg-stone-700">
                登録する
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
