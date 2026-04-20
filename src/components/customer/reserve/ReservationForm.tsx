"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { CalendarDays, MapPin, Clock, ChevronLeft, ChevronRight, AlertCircle, Loader2, Video, CreditCard, Users, User as UserIcon } from "lucide-react";
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
import {
  calcRoundPrice,
  PRIVATE_PRICE_PER_PERSON,
  SHARED_PRICE_PER_PERSON,
} from "@/lib/round-pricing";

const OPTION_SWING_VIDEO_PRICE = 3000;

const formSchema = z.object({
  concern: z.string().max(500, "500文字以内で入力してください").optional(),
  agreedCancelPolicy: z.literal(true, {
    error: "キャンセルポリシーへの同意は必須です",
  }),
  agreedPhotoPost: z.boolean(),
  optionSwingVideo: z.boolean(),
  // ラウンドレッスン用
  roundBookingType: z.enum(["private", "shared"]).optional(),
  roundParticipantCount: z.coerce.number().int().min(1).max(3).optional(),
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
  const isRound = schedule.lessonPlan.category === "ROUND";

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      concern: "",
      agreedCancelPolicy: undefined,
      agreedPhotoPost: false,
      optionSwingVideo: false,
      // ラウンドレッスンの初期値：貸切/1名
      roundBookingType: isRound ? "private" : undefined,
      roundParticipantCount: isRound ? 1 : undefined,
    },
  });

  const { isSubmitting } = form.formState;
  const watchSwingVideo = form.watch("optionSwingVideo");
  const watchBookingType = form.watch("roundBookingType");
  const watchParticipantCount = form.watch("roundParticipantCount");

  // レッスン料金の計算
  const lessonPrice = isRound
    ? calcRoundPrice(
        watchBookingType ?? "private",
        Number(watchParticipantCount ?? 1)
      )
    : schedule.lessonPlan.price;

  const totalPrice = lessonPrice + (watchSwingVideo ? OPTION_SWING_VIDEO_PRICE : 0);

  async function onSubmit(values: FormValues) {
    try {
      const result = await submitReservation({
        scheduleId: schedule.id,
        concern: values.concern,
        agreedCancelPolicy: values.agreedCancelPolicy,
        agreedPhotoPost: values.agreedPhotoPost,
        optionSwingVideo: values.optionSwingVideo,
        roundBookingType: isRound ? values.roundBookingType : undefined,
        roundParticipantCount: isRound ? Number(values.roundParticipantCount) : undefined,
      });

      if (!result.success) {
        // ログイン必要エラーの場合はログインページへ
        if (result.error === "ログインが必要です") {
          router.push(`/auth/login?next=/reserve/${schedule.id}`);
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
            <p className="text-lg font-light">¥{totalPrice.toLocaleString()}</p>
            <p className="text-[11px] text-stone-400">税込</p>
            {(watchSwingVideo || isRound) && (
              <p className="text-[10px] text-stone-400 mt-1 leading-relaxed">
                レッスン ¥{lessonPrice.toLocaleString()}
                {watchSwingVideo && ` + 撮影 ¥${OPTION_SWING_VIDEO_PRICE.toLocaleString()}`}
              </p>
            )}
            {isRound && (
              <p className="text-[10px] text-amber-300 mt-1">
                ※別途プレー費あり
              </p>
            )}
          </div>
        </div>
      </div>

      {/* フォーム */}
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-100">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-7">

            {/* ラウンドレッスン専用: 予約タイプ選択 */}
            {isRound && (
              <FormField
                control={form.control}
                name="roundBookingType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-stone-700">
                      予約タイプ
                      <span className="ml-2 text-[11px] font-medium text-red-500">必須</span>
                    </FormLabel>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {/* 貸切 */}
                      <button
                        type="button"
                        onClick={() => field.onChange("private")}
                        className={`rounded-xl border p-4 text-left transition-colors ${
                          field.value === "private"
                            ? "border-amber-500 bg-amber-50"
                            : "border-stone-200 hover:bg-stone-50"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <UserIcon className="size-3.5 text-stone-600" />
                          <span className="text-sm font-medium text-stone-800">貸切予約</span>
                        </div>
                        <p className="text-[11px] text-stone-500 leading-relaxed">
                          1〜3名で枠を貸切。同伴者を連れての予約も可能です。
                        </p>
                      </button>

                      {/* 組み合わせ */}
                      <button
                        type="button"
                        onClick={() => field.onChange("shared")}
                        className={`rounded-xl border p-4 text-left transition-colors ${
                          field.value === "shared"
                            ? "border-amber-500 bg-amber-50"
                            : "border-stone-200 hover:bg-stone-50"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <Users className="size-3.5 text-stone-600" />
                          <span className="text-sm font-medium text-stone-800">組み合わせ予約</span>
                        </div>
                        <p className="text-[11px] text-stone-500 leading-relaxed">
                          他のお客様と相席。2名以上集まったら開催します。
                        </p>
                        <p className="text-[11px] text-stone-700 font-medium mt-1">
                          ¥{SHARED_PRICE_PER_PERSON.toLocaleString()} / 人
                        </p>
                      </button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* ラウンドレッスン専用: 参加人数（貸切時のみ） */}
            {isRound && watchBookingType === "private" && (
              <FormField
                control={form.control}
                name="roundParticipantCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-stone-700">
                      参加人数
                      <span className="ml-2 text-[11px] font-medium text-red-500">必須</span>
                    </FormLabel>
                    <div className="grid grid-cols-3 gap-2">
                      {[1, 2, 3].map((n) => {
                        const perPerson = PRIVATE_PRICE_PER_PERSON[n as 1 | 2 | 3];
                        const total = perPerson * n;
                        const selected = Number(field.value) === n;
                        return (
                          <button
                            key={n}
                            type="button"
                            onClick={() => field.onChange(n)}
                            className={`rounded-xl border p-3 text-center transition-colors ${
                              selected
                                ? "border-amber-500 bg-amber-50"
                                : "border-stone-200 hover:bg-stone-50"
                            }`}
                          >
                            <p className="text-sm font-semibold text-stone-800">{n}名</p>
                            <p className="text-[10px] text-stone-500 mt-0.5">
                              ¥{perPerson.toLocaleString()}/人
                            </p>
                            <p className="text-[11px] font-medium text-stone-700 mt-1">
                              計 ¥{total.toLocaleString()}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-[11px] text-stone-400 mt-1.5">
                      ※同伴者の方の情報はレッスン当日にご確認させていただきます。
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

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

            {/* 撮影オプション */}
            <FormField
              control={form.control}
              name="optionSwingVideo"
              render={({ field }) => (
                <FormItem>
                  <div className="space-y-3">
                    <FormLabel className="text-sm font-medium text-stone-700">
                      撮影オプション
                      <span className="ml-2 text-[11px] font-normal text-stone-400">任意</span>
                    </FormLabel>
                    <div className={`rounded-xl border p-4 transition-colors ${field.value ? "border-amber-300 bg-amber-50/50" : "border-stone-200"}`}>
                      <div className="flex items-start gap-3">
                        <FormControl>
                          <Checkbox
                            id="swing-video"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="mt-0.5"
                          />
                        </FormControl>
                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <label
                              htmlFor="swing-video"
                              className="text-sm font-medium text-stone-700 cursor-pointer flex items-center gap-1.5"
                            >
                              <Video className="size-3.5 text-stone-500" />
                              スイング動画＋ポイント解説
                            </label>
                            <span className="text-sm font-semibold text-stone-800 shrink-0">
                              ¥{OPTION_SWING_VIDEO_PRICE.toLocaleString()}
                              <span className="text-[10px] font-normal text-stone-400 ml-0.5">税込</span>
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-stone-500 leading-relaxed">
                            レッスンで撮影したスイング動画を元に、ポイントを解説。復習や自主練習に活用できます。
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </FormItem>
              )}
            />

            {/* お支払い方法 */}
            <div className="rounded-xl bg-stone-50 border border-stone-200 p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <CreditCard className="size-3.5 text-stone-500" />
                <p className="text-sm font-medium text-stone-700">お支払い方法</p>
              </div>
              <p className="text-xs text-stone-500 leading-relaxed">
                当日会場にてお支払いいただきます。カード決済（Square）・現金・PayPayに対応しております。
              </p>
            </div>

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
