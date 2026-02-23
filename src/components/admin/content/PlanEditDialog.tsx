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
  priceNote: z.string().optional(),
  duration: z.number().min(1, "所要時間を入力してください"),
  maxAttendees: z.number().min(1, "定員を入力してください"),
  isPublished: z.boolean(),
  details: z.array(z.object({ value: z.string().min(1, "内容を入力してください") })),
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
          priceNote: plan.priceNote || "",
          duration: plan.duration,
          maxAttendees: plan.maxAttendees,
          isPublished: plan.isPublished,
          details: plan.details.map((v) => ({ value: v })),
        }
      : {
          name: "",
          category: "REGULAR" as const,
          tagLabel: "インドア",
          price: 0,
          priceNote: "",
          duration: 50,
          maxAttendees: 1,
          isPublished: true,
          details: [{ value: "" }],
        },
  });

  const detailFields = useFieldArray({ control: form.control, name: "details" });

  async function onSubmit(values: FormValues) {
    setSaving(true);
    const planData: PlanData = {
      id: plan?.id || `plan-${Date.now()}`,
      name: values.name,
      category: values.category,
      tagLabel: values.tagLabel,
      price: values.price,
      priceNote: values.priceNote || undefined,
      duration: values.duration,
      maxAttendees: values.maxAttendees,
      isPublished: values.isPublished,
      details: values.details.map((d) => d.value),
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
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
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
