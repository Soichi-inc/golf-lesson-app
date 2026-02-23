"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { CalendarDays, MapPin, Clock, ChevronLeft, ChevronRight, AlertCircle, Loader2 } from "lucide-react";
import { submitReservation } from "@/app/actions/reserve";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import type { Schedule } from "@/types";

const formSchema = z.object({
  concern: z.string().max(500, "500文字以内で入力してください").optional(),
  agreedCancelPolicy: z.literal(true, {
    error: "キャンセルポリシーへの同意は必須です",
  }),
  agreedPhotoPost: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

const CANCEL_POLICY = `【キャンセルポリシー】
・7日前まで：無料キャンセル
・3〜6日前：レッスン料金の50%をキャンセル料として申し受けます
・前日・当日：レッスン料金の100%をキャンセル料として申し受けます

※やむを得ない事情の場合はご相談ください。`;

type Props = {
  schedule: Schedule;
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

export function ReservationForm({ schedule: rawSchedule }: Props) {
  const schedule = hydrateSchedule(rawSchedule);
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      concern: "",
      agreedCancelPolicy: undefined,
      agreedPhotoPost: false,
    },
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(values: FormValues) {
    try {
      const result = await submitReservation({
        scheduleId: schedule.id,
        concern: values.concern,
        agreedCancelPolicy: values.agreedCancelPolicy,
        agreedPhotoPost: values.agreedPhotoPost,
      });

      if (!result.success) {
        // ログイン必要エラーの場合はログインページへ
        if (result.error === "ログインが必要です") {
          router.push("/login?redirect=/reserve/" + schedule.id);
          return;
        }
        form.setError("root", { message: result.error || "予約に失敗しました" });
        return;
      }

      router.push("/reserve/complete");
    } catch {
      form.setError("root", { message: "通信エラーが発生しました。もう一度お試しください。" });
    }
  }

  return (
    <div className="space-y-6">
      {/* Step インジケーター */}
      <div className="flex items-center gap-2 text-xs text-stone-500">
        <span className="flex size-5 items-center justify-center rounded-full bg-stone-200 text-stone-400 text-[10px] font-bold">1</span>
        <span className="text-stone-400">日時を選ぶ</span>
        <ChevronRight className="size-3 text-stone-300" />
        <span className="flex size-5 items-center justify-center rounded-full bg-stone-800 text-white text-[10px] font-bold">2</span>
        <span className="font-medium text-stone-800">予約フォーム</span>
        <ChevronRight className="size-3 text-stone-300" />
        <span className="flex size-5 items-center justify-center rounded-full bg-stone-200 text-stone-400 text-[10px] font-bold">3</span>
        <span className="text-stone-400">完了</span>
      </div>

      {/* 選択中の枠サマリー */}
      <div className="rounded-2xl bg-stone-800 p-5 text-white">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge className="bg-white/20 text-white border-0 text-[10px]">
                {schedule.lessonPlan.category === "REGULAR" ? "通常レッスン" : "ラウンドレッスン"}
              </Badge>
            </div>
            <p className="font-medium text-base mb-3">{schedule.lessonPlan.name}</p>
            <div className="flex flex-col gap-1.5 text-xs text-stone-300">
              <span className="flex items-center gap-1.5">
                <CalendarDays className="size-3.5 shrink-0" />
                {format(schedule.startAt, "yyyy年M月d日（E）", { locale: ja })}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="size-3.5 shrink-0" />
                {format(schedule.startAt, "HH:mm")} – {format(schedule.endAt, "HH:mm")}
                （{schedule.lessonPlan.duration}分）
              </span>
              {schedule.teeOffTime && (
                <span className="flex items-center gap-1.5 text-amber-300">
                  <Clock className="size-3.5 shrink-0" />
                  ティーオフ {schedule.teeOffTime}
                </span>
              )}
              {schedule.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="size-3.5 shrink-0" />
                  {schedule.location}
                </span>
              )}
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-lg font-light">¥{schedule.lessonPlan.price.toLocaleString()}</p>
            <p className="text-[11px] text-stone-400">税込</p>
          </div>
        </div>
      </div>

      {/* フォーム */}
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-100">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-7">

            {/* お悩み・質問 */}
            <FormField
              control={form.control}
              name="concern"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-stone-700">
                    お悩み・ご質問
                    <span className="ml-2 text-[11px] font-normal text-stone-400">任意</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="例：ドライバーのスライスを直したい、コースに出るのが初めてで不安…など、お気軽にお書きください。"
                      rows={4}
                      className="resize-none text-sm leading-relaxed"
                      {...field}
                    />
                  </FormControl>
                  <p className="text-[11px] text-stone-400 text-right">
                    {(field.value ?? "").length}/500
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* キャンセルポリシー同意 */}
            <FormField
              control={form.control}
              name="agreedCancelPolicy"
              render={({ field }) => (
                <FormItem>
                  <div className="space-y-3">
                    <FormLabel className="text-sm font-medium text-stone-700">
                      キャンセルポリシー
                      <span className="ml-2 text-[11px] font-medium text-red-500">必須</span>
                    </FormLabel>
                    <div className="rounded-xl bg-stone-50 border border-stone-200 p-4">
                      <pre className="whitespace-pre-wrap text-xs leading-6 text-stone-600 font-sans">
                        {CANCEL_POLICY}
                      </pre>
                    </div>
                    <div className="flex items-start gap-3">
                      <FormControl>
                        <Checkbox
                          id="cancel-policy"
                          checked={field.value === true}
                          onCheckedChange={(checked) =>
                            field.onChange(checked === true ? true : undefined)
                          }
                          className="mt-0.5"
                        />
                      </FormControl>
                      <label
                        htmlFor="cancel-policy"
                        className="text-sm text-stone-700 leading-snug cursor-pointer"
                      >
                        上記のキャンセルポリシーを確認し、同意します
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                    </div>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            {/* SNS投稿同意 */}
            <FormField
              control={form.control}
              name="agreedPhotoPost"
              render={({ field }) => (
                <FormItem>
                  <div className="rounded-xl border border-stone-200 p-4">
                    <div className="flex items-start gap-3">
                      <FormControl>
                        <Checkbox
                          id="photo-post"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="mt-0.5"
                        />
                      </FormControl>
                      <div>
                        <label
                          htmlFor="photo-post"
                          className="text-sm font-medium text-stone-700 cursor-pointer"
                        >
                          撮影・SNS掲載への同意
                          <span className="ml-2 text-[11px] font-normal text-stone-400">任意</span>
                        </label>
                        <p className="mt-1 text-xs text-stone-500 leading-relaxed">
                          レッスン中の撮影、およびInstagramなどへの投稿に同意します。
                          お名前や個人情報は掲載しません。
                        </p>
                      </div>
                    </div>
                  </div>
                </FormItem>
              )}
            />

            {/* 注意書き */}
            <div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-100 p-4">
              <AlertCircle className="size-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 leading-relaxed">
                予約リクエスト後、確認メールをお送りします。講師の承認後に予約が確定します。メールが届かない場合はスパムフォルダをご確認ください。
              </p>
            </div>

            {/* エラー表示 */}
            {form.formState.errors.root && (
              <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-100 p-4">
                <AlertCircle className="size-4 text-red-500 shrink-0 mt-0.5" />
                <p className="text-xs text-red-700 leading-relaxed">
                  {form.formState.errors.root.message}
                </p>
              </div>
            )}

            {/* ナビゲーションボタン */}
            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="flex-1 rounded-full border-stone-300"
              >
                <ChevronLeft className="size-4 mr-1" />
                日時選択に戻る
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 rounded-full bg-stone-800 hover:bg-stone-700 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 mr-1.5 animate-spin" />
                    送信中...
                  </>
                ) : (
                  <>
                    予約リクエストを送信
                    <ChevronRight className="size-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
