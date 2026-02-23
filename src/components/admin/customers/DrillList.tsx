"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import {
  Dumbbell,
  CalendarDays,
  ExternalLink,
  Plus,
  Trash2,
  Video,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { addDrill, deleteDrill } from "@/app/actions/drills";
import type { Drill } from "@/types";

const STATUS_MAP: Record<
  Drill["status"],
  { label: string; className: string }
> = {
  ASSIGNED: {
    label: "未着手",
    className: "bg-stone-100 text-stone-600 border-stone-200",
  },
  IN_PROGRESS: {
    label: "取り組み中",
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
  COMPLETED: {
    label: "完了",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
};

const drillSchema = z.object({
  title: z.string().min(1, "タイトルを入力してください"),
  description: z.string().optional(),
  videoUrl: z.string().url("正しいURLを入力してください").optional().or(z.literal("")),
  dueDate: z.string().optional(),
});

type DrillFormValues = z.infer<typeof drillSchema>;

/** Date文字列→Date変換 */
function ensureDate(v: Date | string): Date {
  return v instanceof Date ? v : new Date(v);
}

function hydrateDrill(d: Drill): Drill {
  return {
    ...d,
    dueDate: d.dueDate ? ensureDate(d.dueDate) : null,
    createdAt: ensureDate(d.createdAt),
    updatedAt: ensureDate(d.updatedAt),
  };
}

type Props = {
  drills: Drill[];
  userId: string;
};

export function DrillList({ drills: rawDrills, userId }: Props) {
  const router = useRouter();
  const [drills, setDrills] = useState<Drill[]>(rawDrills.map(hydrateDrill));
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const form = useForm<DrillFormValues>({
    resolver: zodResolver(drillSchema),
    defaultValues: {
      title: "",
      description: "",
      videoUrl: "",
      dueDate: "",
    },
  });

  async function onSubmit(values: DrillFormValues) {
    setSaving(true);
    const result = await addDrill({
      userId,
      title: values.title,
      description: values.description,
      videoUrl: values.videoUrl || undefined,
      dueDate: values.dueDate ? new Date(values.dueDate).toISOString() : undefined,
    });
    setSaving(false);

    if (result.success && result.drill) {
      setDrills((prev) => [hydrateDrill(result.drill!), ...prev]);
      form.reset({ title: "", description: "", videoUrl: "", dueDate: "" });
      setShowForm(false);
      router.refresh();
    } else {
      alert(result.error || "ドリルの保存に失敗しました");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("このドリルを削除しますか？")) return;

    const deleted = drills.find((d) => d.id === id);
    setDrills((prev) => prev.filter((d) => d.id !== id));

    const result = await deleteDrill(id);
    if (!result.success) {
      if (deleted) setDrills((prev) => [...prev, deleted]);
      alert(result.error || "削除に失敗しました");
    } else {
      router.refresh();
    }
  }

  const sorted = [...drills].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );

  return (
    <div className="space-y-4">
      {/* 追加ボタン / フォーム */}
      {!showForm ? (
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => setShowForm(true)}
        >
          <Plus className="size-4" />
          ドリルを追加
        </Button>
      ) : (
        <Card className="border-stone-300 bg-stone-50">
          <CardContent className="p-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                {/* タイトル */}
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">タイトル</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="例：ハーフスイング100球"
                          className="bg-white"
                          autoFocus
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 説明 */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">
                        説明
                        <span className="ml-1 text-stone-400 font-normal">任意</span>
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="ドリルの詳細・ポイントなど"
                          rows={3}
                          className="bg-white resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 動画URL */}
                <FormField
                  control={form.control}
                  name="videoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">
                        <Video className="size-3 inline mr-1" />
                        動画URL
                        <span className="ml-1 text-stone-400 font-normal">任意</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://youtube.com/..."
                          className="bg-white"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 目標日 */}
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">
                        <CalendarDays className="size-3 inline mr-1" />
                        目標日
                        <span className="ml-1 text-stone-400 font-normal">任意</span>
                      </FormLabel>
                      <FormControl>
                        <Input type="date" className="bg-white" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-center gap-2">
                  <Button
                    type="submit"
                    size="sm"
                    disabled={saving}
                    className="bg-stone-800 hover:bg-stone-700"
                  >
                    {saving ? "保存中..." : "追加する"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      form.reset();
                      setShowForm(false);
                    }}
                  >
                    キャンセル
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {/* ドリル一覧 */}
      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-stone-400 border-2 border-dashed rounded-xl">
          <Dumbbell className="size-8 mb-2 opacity-40" />
          <p className="text-sm">ドリルが登録されていません</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((drill) => {
            const status = STATUS_MAP[drill.status];
            return (
              <Card key={drill.id} className="bg-white">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <p className="font-medium text-stone-800 text-sm">
                          {drill.title}
                        </p>
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${status.className}`}
                        >
                          {status.label}
                        </Badge>
                      </div>

                      {drill.description && (
                        <p className="text-xs text-stone-600 leading-relaxed mb-2 whitespace-pre-wrap">
                          {drill.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-stone-400">
                        <span>
                          割り当て:{" "}
                          {format(drill.createdAt, "yyyy/MM/dd", {
                            locale: ja,
                          })}
                        </span>
                        {drill.dueDate && (
                          <span className="flex items-center gap-1">
                            <CalendarDays className="size-3" />
                            目標:{" "}
                            {format(drill.dueDate, "yyyy/MM/dd", {
                              locale: ja,
                            })}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {drill.videoUrl && (
                        <a
                          href={drill.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-stone-400 hover:text-stone-700 transition-colors p-1"
                        >
                          <ExternalLink className="size-4" />
                        </a>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-stone-300 hover:text-red-400 hover:bg-red-50"
                        onClick={() => handleDelete(drill.id)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
