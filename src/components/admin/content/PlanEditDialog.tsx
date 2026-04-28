"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Switch } from "@/components/ui/switch";
import type { PlanData } from "@/app/actions/plans";

const formSchema = z.object({
  name: z.string().min(1, "プラン名を入力してください"),
  category: z.enum(["REGULAR", "ROUND", "ONLINE"]),
  tagLabel: z.string().min(1, "タグ名を入力してください"),
  price: z.number().min(0, "料金は0以上で入力してください"),
  priceFrom: z.boolean(),
  priceNote: z.string().optional(),
  duration: z.number().min(1, "所要時間を入力してください"),
  maxAttendees: z.number().min(1, "定員を入力してください"),
  isPublished: z.boolean(),
  description: z.string().optional(),
  highlights: z.array(z.object({ value: z.string() })),
  details: z.array(z.object({ value: z.string() })),
});

type FormValues = z.infer<typeof formSchema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan?: PlanData; // undefined = 新規作成
  onSave: (plan: PlanData) => void;
};

export function PlanEditDialog({ open, onOpenChange, plan, onSave }: Props) {
  const isEditing = !!plan;
  const [saving, setSaving] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: plan
      ? {
          name: plan.name,
          category: plan.category,
          tagLabel: plan.tagLabel,
          price: plan.price,
          priceFrom: !!plan.priceFrom,
          priceNote: plan.priceNote || "",
          duration: plan.duration,
          maxAttendees: plan.maxAttendees,
          isPublished: plan.isPublished,
          description: plan.description || "",
          highlights: (plan.highlights ?? []).map((v) => ({ value: v })),
          details: plan.details.map((v) => ({ value: v })),
        }
      : {
          name: "",
          category: "REGULAR" as const,
          tagLabel: "インドア",
          price: 0,
          priceFrom: false,
          priceNote: "",
          duration: 50,
          maxAttendees: 1,
          isPublished: true,
          description: "",
          highlights: [],
          details: [{ value: "" }],
        },
  });

  const detailFields = useFieldArray({ control: form.control, name: "details" });
  const highlightFields = useFieldArray({ control: form.control, name: "highlights" });

  async function onSubmit(values: FormValues) {
    setSaving(true);
    const cleanedHighlights = values.highlights
      .map((h) => h.value.trim())
      .filter((v) => v.length > 0);
    const cleanedDetails = values.details
      .map((d) => d.value.trim())
      .filter((v) => v.length > 0);

    const planData: PlanData = {
      id: plan?.id || `plan-${Date.now()}`,
      name: values.name,
      category: values.category,
      tagLabel: values.tagLabel,
      price: values.price,
      priceFrom: values.priceFrom || undefined,
      priceNote: values.priceNote || undefined,
      duration: values.duration,
      maxAttendees: values.maxAttendees,
      isPublished: values.isPublished,
      description: values.description?.trim() || undefined,
      highlights: cleanedHighlights.length > 0 ? cleanedHighlights : undefined,
      details: cleanedDetails,
    };
    onSave(planData);
    setSaving(false);
    onOpenChange(false);
  }

  // カテゴリ変更時にtagLabelを自動更新
  function handleCategoryChange(value: string, onChange: (v: string) => void) {
    onChange(value);
    const tagMap: Record<string, string> = {
      REGULAR: "インドア",
      ROUND: "ラウンド",
      ONLINE: "オンライン",
    };
    form.setValue("tagLabel", tagMap[value] || value);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-medium">
            {isEditing ? "プランの編集" : "プランの追加"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* プラン名 */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>プラン名</FormLabel>
                  <FormControl><Input placeholder="例: プライベートレッスン 50分" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* カテゴリ */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>カテゴリ</FormLabel>
                    <Select
                      onValueChange={(v) => handleCategoryChange(v, field.onChange)}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="REGULAR">インドア</SelectItem>
                        <SelectItem value="ROUND">ラウンド</SelectItem>
                        <SelectItem value="ONLINE">オンライン</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tagLabel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>表示タグ</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* 料金・時間 */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>料金（税込）</FormLabel>
                    <FormControl><Input type="number" value={field.value} onChange={(e) => field.onChange(Number(e.target.value))} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="priceNote"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>料金補足（任意）</FormLabel>
                    <FormControl><Input placeholder="例: 1名あたり" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* 料金が下限であるか（〜表示） */}
            <FormField
              control={form.control}
              name="priceFrom"
              render={({ field }) => (
                <FormItem className="flex items-center gap-3 rounded-xl border border-stone-200 p-3">
                  <FormControl>
                    <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="flex-1">
                    <FormLabel className="!mt-0 text-sm text-stone-700 block">
                      料金に「〜」を表示
                    </FormLabel>
                    <p className="text-[11px] text-stone-400 mt-0.5">
                      下限料金を示したいとき（例：¥25,000〜）にONにします
                    </p>
                  </div>
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>所要時間（分）</FormLabel>
                    <FormControl><Input type="number" value={field.value} onChange={(e) => field.onChange(Number(e.target.value))} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="maxAttendees"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>定員</FormLabel>
                    <FormControl><Input type="number" value={field.value} onChange={(e) => field.onChange(Number(e.target.value))} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* 公開設定 */}
            <FormField
              control={form.control}
              name="isPublished"
              render={({ field }) => (
                <FormItem className="flex items-center gap-3 rounded-xl border border-stone-200 p-3">
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="!mt-0 text-sm text-stone-700">
                    公開する
                  </FormLabel>
                </FormItem>
              )}
            />

            {/* 説明 */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>説明文（任意）</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="例: コースを回りながら実戦的なマネジメントを指導。関東圏内対応。"
                      rows={3}
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ハイライト */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <FormLabel>ハイライト（チェックマーク付き表示・任意）</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1 text-xs h-7"
                  onClick={() => highlightFields.append({ value: "" })}
                >
                  <Plus className="size-3" /> 追加
                </Button>
              </div>
              <div className="space-y-2">
                {highlightFields.fields.map((field, index) => (
                  <div key={field.id} className="flex gap-2">
                    <FormField
                      control={form.control}
                      name={`highlights.${index}.value`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl><Input placeholder="例: コースマネジメントを実践で学ぶ" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-9 text-stone-400 hover:text-red-500 shrink-0"
                      onClick={() => highlightFields.remove(index)}
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* 料金詳細 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <FormLabel>料金詳細</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1 text-xs h-7"
                  onClick={() => detailFields.append({ value: "" })}
                >
                  <Plus className="size-3" /> 追加
                </Button>
              </div>
              <div className="space-y-2">
                {detailFields.fields.map((field, index) => (
                  <div key={field.id} className="flex gap-2">
                    <FormField
                      control={form.control}
                      name={`details.${index}.value`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl><Input placeholder="料金の詳細" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-9 text-stone-400 hover:text-red-500 shrink-0"
                      onClick={() => detailFields.remove(index)}
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                キャンセル
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-stone-800 hover:bg-stone-700"
              >
                {saving ? "保存中..." : isEditing ? "更新する" : "追加する"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
