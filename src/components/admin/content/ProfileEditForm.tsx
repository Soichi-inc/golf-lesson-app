"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Save,
  Plus,
  X,
  Loader2,
  CheckCircle2,
  User,
  Info,
  Award,
  BookOpen,
  MapPin,
  Instagram,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { saveProfile, type ProfileData } from "@/app/actions/profile";

const locationSchema = z.object({
  name: z.string().min(1, "施設名を入力してください"),
  area: z.string().min(1, "エリアを入力してください"),
});

const formSchema = z.object({
  name: z.string().min(1, "名前を入力してください"),
  nameEn: z.string().min(1, "英語名を入力してください"),
  title: z.string().min(1, "肩書きを入力してください"),
  image: z.string(),
  instagram: z.string(),
  email: z.string().email("正しいメールアドレスを入力してください"),
  bio: z.string().max(1000, "1000文字以内で入力してください"),
  qualifications: z.array(z.object({ value: z.string().min(1, "資格名を入力してください") })),
  teachingPhilosophy: z.array(z.object({ value: z.string().min(1, "内容を入力してください") })),
  locations: z.array(locationSchema),
});

type FormValues = z.infer<typeof formSchema>;

type Props = {
  initialData: ProfileData;
};

export function ProfileEditForm({ initialData }: Props) {
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData.name,
      nameEn: initialData.nameEn,
      title: initialData.title,
      image: initialData.image,
      instagram: initialData.instagram,
      email: initialData.email,
      bio: initialData.bio,
      qualifications: initialData.qualifications.map((v) => ({ value: v })),
      teachingPhilosophy: initialData.teachingPhilosophy.map((v) => ({ value: v })),
      locations: initialData.locations,
    },
  });

  const qualFields = useFieldArray({ control: form.control, name: "qualifications" });
  const philFields = useFieldArray({ control: form.control, name: "teachingPhilosophy" });
  const locFields = useFieldArray({ control: form.control, name: "locations" });

  async function onSubmit(values: FormValues) {
    setSaveStatus("saving");
    setErrorMsg("");

    const profileData: ProfileData = {
      ...values,
      qualifications: values.qualifications.map((q) => q.value),
      teachingPhilosophy: values.teachingPhilosophy.map((p) => p.value),
    };

    const result = await saveProfile(profileData);
    if (result.success) {
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } else {
      setSaveStatus("error");
      setErrorMsg(result.error || "保存に失敗しました");
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

        {/* 基本情報 */}
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-100">
          <div className="flex items-center gap-2 mb-5">
            <User className="size-4 text-stone-500" />
            <h2 className="text-base font-semibold text-stone-800">基本情報</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>名前</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="nameEn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>英語名</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>肩書き</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="instagram"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5">
                    <Instagram className="size-3.5" /> Instagram
                  </FormLabel>
                  <FormControl><Input placeholder="@username" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5">
                    <Mail className="size-3.5" /> メールアドレス
                  </FormLabel>
                  <FormControl><Input type="email" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </section>

        {/* 自己紹介 */}
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-100">
          <div className="flex items-center gap-2 mb-4">
            <Info className="size-4 text-stone-500" />
            <h2 className="text-base font-semibold text-stone-800">自己紹介</h2>
          </div>
          <FormField
            control={form.control}
            name="bio"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea
                    rows={4}
                    className="resize-none text-sm leading-relaxed"
                    placeholder="自己紹介文を入力してください"
                    {...field}
                  />
                </FormControl>
                <p className="text-[11px] text-stone-400 text-right">{field.value.length}/1000</p>
                <FormMessage />
              </FormItem>
            )}
          />
        </section>

        {/* 資格・認定 */}
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Award className="size-4 text-stone-500" />
              <h2 className="text-base font-semibold text-stone-800">資格・認定</h2>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1 text-xs"
              onClick={() => qualFields.append({ value: "" })}
            >
              <Plus className="size-3.5" /> 追加
            </Button>
          </div>
          <div className="space-y-2">
            {qualFields.fields.map((field, index) => (
              <div key={field.id} className="flex gap-2">
                <FormField
                  control={form.control}
                  name={`qualifications.${index}.value`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input placeholder="資格・認定名" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-9 text-stone-400 hover:text-red-500 shrink-0"
                  onClick={() => qualFields.remove(index)}
                >
                  <X className="size-4" />
                </Button>
              </div>
            ))}
            {qualFields.fields.length === 0 && (
              <p className="text-sm text-stone-400 py-3 text-center">資格・認定が登録されていません</p>
            )}
          </div>
        </section>

        {/* 指導方針 */}
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BookOpen className="size-4 text-stone-500" />
              <h2 className="text-base font-semibold text-stone-800">指導方針</h2>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1 text-xs"
              onClick={() => philFields.append({ value: "" })}
            >
              <Plus className="size-3.5" /> 追加
            </Button>
          </div>
          <div className="space-y-2">
            {philFields.fields.map((field, index) => (
              <div key={field.id} className="flex gap-2">
                <FormField
                  control={form.control}
                  name={`teachingPhilosophy.${index}.value`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input placeholder="指導方針" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-9 text-stone-400 hover:text-red-500 shrink-0"
                  onClick={() => philFields.remove(index)}
                >
                  <X className="size-4" />
                </Button>
              </div>
            ))}
            {philFields.fields.length === 0 && (
              <p className="text-sm text-stone-400 py-3 text-center">指導方針が登録されていません</p>
            )}
          </div>
        </section>

        {/* レッスン場所 */}
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MapPin className="size-4 text-stone-500" />
              <h2 className="text-base font-semibold text-stone-800">レッスン場所</h2>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1 text-xs"
              onClick={() => locFields.append({ name: "", area: "" })}
            >
              <Plus className="size-3.5" /> 追加
            </Button>
          </div>
          <div className="space-y-3">
            {locFields.fields.map((field, index) => (
              <div key={field.id} className="flex gap-2">
                <div className="flex-1 grid grid-cols-1 gap-2 sm:grid-cols-[2fr_1fr]">
                  <FormField
                    control={form.control}
                    name={`locations.${index}.name`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input placeholder="施設名" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`locations.${index}.area`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input placeholder="エリア" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-9 text-stone-400 hover:text-red-500 shrink-0"
                  onClick={() => locFields.remove(index)}
                >
                  <X className="size-4" />
                </Button>
              </div>
            ))}
            {locFields.fields.length === 0 && (
              <p className="text-sm text-stone-400 py-3 text-center">レッスン場所が登録されていません</p>
            )}
          </div>
        </section>

        {/* 保存ボタン */}
        <div className="flex items-center justify-end gap-3">
          {saveStatus === "saved" && (
            <span className="flex items-center gap-1.5 text-sm text-green-600">
              <CheckCircle2 className="size-4" /> 保存しました
            </span>
          )}
          {saveStatus === "error" && (
            <span className="text-sm text-red-600">{errorMsg}</span>
          )}
          <Button
            type="submit"
            disabled={saveStatus === "saving"}
            className="gap-1.5 bg-stone-800 hover:bg-stone-700"
          >
            {saveStatus === "saving" ? (
              <>
                <Loader2 className="size-4 animate-spin" /> 保存中...
              </>
            ) : (
              <>
                <Save className="size-4" /> 保存する
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
