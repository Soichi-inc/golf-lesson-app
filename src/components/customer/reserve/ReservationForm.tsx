"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { CalendarDays, MapPin, Clock, ChevronLeft, ChevronRight, AlertCircle, Loader2, Video, CreditCard, Users, User as UserIcon, Store, Sparkles } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import type { LessonPlan, Schedule } from "@/types";
import {
  calcRoundPrice,
  PRIVATE_PRICE_PER_PERSON,
  SHARED_PRICE_PER_PERSON,
} from "@/lib/round-pricing";
import {
  INDOOR_FLEX_PRICES,
  calcIndoorFlexPrice,
} from "@/lib/indoor-flex-pricing";

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
  roundParticipantCount: z.number().optional(),
  // インドア・場所リクエスト枠用
  indoorLocationType: z.enum(["existing", "custom"]).optional(),
  /** indoorLocationType === "existing" の場合：選択した既存プランID */
  existingPlanId: z.string().optional(),
  /** indoorLocationType === "custom" の場合：自由記述の場所 */
  customLocation: z.string().max(120, "120文字以内で入力してください").optional(),
  requestedDuration: z.union([z.literal(50), z.literal(70)]).optional(),
  usesTicketPack: z.boolean().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const CANCEL_POLICY = `【キャンセルポリシー】
・7日前まで：無料キャンセル
・3〜6日前：レッスン料金の50%をキャンセル料として申し受けます
・前日・当日：レッスン料金の100%をキャンセル料として申し受けます

※やむを得ない事情の場合はご相談ください。`;

type Props = {
  schedule: Schedule;
  /** インドア・場所リクエスト枠で「既存店舗を選ぶ」場合の選択肢（インドアプラン一覧） */
  existingPlans?: LessonPlan[];
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

export function ReservationForm({ schedule: rawSchedule, existingPlans = [] }: Props) {
  const schedule = hydrateSchedule(rawSchedule);
  const router = useRouter();
  const isRound = schedule.lessonPlan.category === "ROUND";
  const isIndoorFlex = !isRound && schedule.allowAnyLocation;

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
      // インドア・場所リクエスト枠の初期値
      indoorLocationType: isIndoorFlex ? "existing" : undefined,
      existingPlanId: "",
      customLocation: "",
      requestedDuration: isIndoorFlex ? 50 : undefined,
      usesTicketPack: false,
    },
  });

  const { isSubmitting } = form.formState;
  const watchSwingVideo = form.watch("optionSwingVideo");
  const watchBookingType = form.watch("roundBookingType");
  const watchParticipantCount = form.watch("roundParticipantCount");
  const watchIndoorType = form.watch("indoorLocationType");
  const watchExistingPlanId = form.watch("existingPlanId");
  const watchCustomLocation = form.watch("customLocation");
  const watchDuration = form.watch("requestedDuration");
  const watchUsesTicketPack = form.watch("usesTicketPack");

  const selectedExistingPlan = existingPlans.find((p) => p.id === watchExistingPlanId);

  // レッスン料金の計算
  let lessonPrice = schedule.lessonPlan.price;
  if (isRound) {
    lessonPrice = calcRoundPrice(
      watchBookingType ?? "private",
      Number(watchParticipantCount ?? 1)
    );
  } else if (isIndoorFlex && watchIndoorType === "custom") {
    const dur = (watchDuration ?? 50) as 50 | 70;
    lessonPrice = calcIndoorFlexPrice(dur, !!watchUsesTicketPack);
  } else if (isIndoorFlex && watchIndoorType === "existing" && selectedExistingPlan) {
    lessonPrice = selectedExistingPlan.price;
  }

  const totalPrice = lessonPrice + (watchSwingVideo ? OPTION_SWING_VIDEO_PRICE : 0);

  // 表示用の場所・時間
  const displayLocation = isIndoorFlex
    ? watchIndoorType === "existing"
      ? selectedExistingPlan?.name || "（店舗を選択してください）"
      : (watchCustomLocation?.trim() || "（場所をリクエストしてください）")
    : schedule.location;

  const displayDuration = isIndoorFlex
    ? watchIndoorType === "custom"
      ? (watchDuration ?? 50)
      : selectedExistingPlan?.duration ?? schedule.lessonPlan.duration
    : schedule.lessonPlan.duration;

  const displayEndAt =
    isIndoorFlex &&
    ((watchIndoorType === "custom") ||
      (watchIndoorType === "existing" && !!selectedExistingPlan))
      ? new Date(schedule.startAt.getTime() + displayDuration * 60 * 1000)
      : schedule.endAt;

  async function onSubmit(values: FormValues) {
    try {
      // インドア・場所リクエスト枠用のバリデーション
      let customLocationTrimmed: string | undefined;
      if (isIndoorFlex) {
        if (values.indoorLocationType === "existing") {
          if (!values.existingPlanId) {
            form.setError("existingPlanId", { message: "店舗を選択してください" });
            return;
          }
        } else if (values.indoorLocationType === "custom") {
          const trimmed = (values.customLocation ?? "").trim();
          if (!trimmed) {
            form.setError("customLocation", { message: "ご希望の場所を入力してください" });
            return;
          }
          customLocationTrimmed = trimmed;
        } else {
          form.setError("indoorLocationType", { message: "場所の選択方法を選んでください" });
          return;
        }
      }

      const result = await submitReservation({
        scheduleId: schedule.id,
        concern: values.concern,
        agreedCancelPolicy: values.agreedCancelPolicy,
        agreedPhotoPost: values.agreedPhotoPost,
        optionSwingVideo: values.optionSwingVideo,
        roundBookingType: isRound ? values.roundBookingType : undefined,
        roundParticipantCount: isRound ? Number(values.roundParticipantCount) : undefined,
        indoorLocationType: isIndoorFlex ? values.indoorLocationType : undefined,
        existingPlanId:
          isIndoorFlex && values.indoorLocationType === "existing"
            ? values.existingPlanId
            : undefined,
        requestedLocation:
          isIndoorFlex && values.indoorLocationType === "custom"
            ? customLocationTrimmed
            : undefined,
        requestedDuration:
          isIndoorFlex && values.indoorLocationType === "custom"
            ? values.requestedDuration
            : undefined,
        usesTicketPack:
          isIndoorFlex && values.indoorLocationType === "custom"
            ? !!values.usesTicketPack
            : undefined,
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
              {isIndoorFlex && (
                <Badge className="bg-violet-500/30 text-violet-100 border-0 text-[10px]">
                  場所リクエスト可
                </Badge>
              )}
            </div>
            <p className="font-medium text-base mb-3">{schedule.lessonPlan.name}</p>
            <div className="flex flex-col gap-1.5 text-xs text-stone-300">
              <span className="flex items-center gap-1.5">
                <CalendarDays className="size-3.5 shrink-0" />
                {format(schedule.startAt, "yyyy年M月d日（E）", { locale: ja })}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="size-3.5 shrink-0" />
                {format(schedule.startAt, "HH:mm")} – {format(displayEndAt, "HH:mm")}
                （{displayDuration}分）
              </span>
              {schedule.teeOffTime && (
                <span className="flex items-center gap-1.5 text-amber-300">
                  <Clock className="size-3.5 shrink-0" />
                  ティーオフ {schedule.teeOffTime}
                </span>
              )}
              {displayLocation && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="size-3.5 shrink-0" />
                  {displayLocation}
                </span>
              )}
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-lg font-light">¥{totalPrice.toLocaleString()}</p>
            <p className="text-[11px] text-stone-400">税込</p>
            {(watchSwingVideo || isRound || (isIndoorFlex && watchIndoorType === "custom")) && (
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
            {isIndoorFlex && watchIndoorType === "custom" && (
              <p className="text-[10px] text-violet-200 mt-1 leading-relaxed">
                ※場所代金・ボール代金等は別途お客様負担
              </p>
            )}
          </div>
        </div>
      </div>

      {/* フォーム */}
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-100">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-7">

            {/* インドア・場所リクエスト枠: 場所選択 */}
            {isIndoorFlex && (
              <FormField
                control={form.control}
                name="indoorLocationType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-stone-700">
                      場所の選択
                      <span className="ml-2 text-[11px] font-medium text-red-500">必須</span>
                    </FormLabel>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {/* 既存店舗から選ぶ */}
                      <button
                        type="button"
                        onClick={() => field.onChange("existing")}
                        className={`rounded-xl border p-4 text-left transition-colors ${
                          field.value === "existing"
                            ? "border-violet-500 bg-violet-50"
                            : "border-stone-200 hover:bg-stone-50"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <Store className="size-3.5 text-stone-600" />
                          <span className="text-sm font-medium text-stone-800">既存店舗から選ぶ</span>
                        </div>
                        <p className="text-[11px] text-stone-500 leading-relaxed">
                          通常のインドア店舗・プランから選択。各プランの時間・料金がそのまま適用されます。
                        </p>
                      </button>

                      {/* 任意の場所をリクエスト */}
                      <button
                        type="button"
                        onClick={() => field.onChange("custom")}
                        className={`rounded-xl border p-4 text-left transition-colors ${
                          field.value === "custom"
                            ? "border-violet-500 bg-violet-50"
                            : "border-stone-200 hover:bg-stone-50"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <Sparkles className="size-3.5 text-stone-600" />
                          <span className="text-sm font-medium text-stone-800">任意の場所をリクエスト</span>
                        </div>
                        <p className="text-[11px] text-stone-500 leading-relaxed">
                          ご希望の練習場・施設を指定。50分／70分から選択可能。場所代金・ボール代金等はお客様負担。
                        </p>
                      </button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* インドア・場所リクエスト枠: 既存店舗（プラン）の選択 */}
            {isIndoorFlex && watchIndoorType === "existing" && (
              <FormField
                control={form.control}
                name="existingPlanId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-stone-700">
                      ご希望のプラン・店舗
                      <span className="ml-2 text-[11px] font-medium text-red-500">必須</span>
                    </FormLabel>
                    {existingPlans.length === 0 ? (
                      <p className="text-xs text-stone-500 rounded-xl bg-stone-50 border border-stone-200 p-3">
                        現在、選択可能な店舗プランがありません。「任意の場所をリクエスト」を選んでください。
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 gap-2">
                        {existingPlans.map((plan) => {
                          const selected = field.value === plan.id;
                          return (
                            <button
                              key={plan.id}
                              type="button"
                              onClick={() => field.onChange(plan.id)}
                              className={`rounded-xl border p-3 text-left transition-colors ${
                                selected
                                  ? "border-stone-800 bg-stone-50"
                                  : "border-stone-200 hover:bg-stone-50"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <span className="flex items-center gap-1.5 text-sm text-stone-800">
                                  <MapPin className="size-3.5 text-stone-500 shrink-0" />
                                  {plan.name}
                                </span>
                                <span className="shrink-0 text-xs text-stone-600">
                                  {plan.duration}分 / ¥{plan.price.toLocaleString()}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* インドア・場所リクエスト枠: 任意の場所入力 + 時間 + 4回チケット */}
            {isIndoorFlex && watchIndoorType === "custom" && (
              <>
                <FormField
                  control={form.control}
                  name="customLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-stone-700">
                        ご希望の場所
                        <span className="ml-2 text-[11px] font-medium text-red-500">必須</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="例：○○ゴルフレンジ、××打ちっぱなし、住所など"
                          className="text-sm"
                          {...field}
                        />
                      </FormControl>
                      <p className="text-[11px] text-stone-400 mt-1">
                        施設名や住所などをご記入ください。場所代金・ボール代金等は当日現地でお客様にてお支払いください。
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="requestedDuration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-stone-700">
                        レッスン時間
                        <span className="ml-2 text-[11px] font-medium text-red-500">必須</span>
                      </FormLabel>
                      <div className="grid grid-cols-2 gap-2">
                        {([50, 70] as const).map((dur) => {
                          const selected = field.value === dur;
                          const single = INDOOR_FLEX_PRICES[dur].single;
                          const pack = INDOOR_FLEX_PRICES[dur].ticketPack;
                          return (
                            <button
                              key={dur}
                              type="button"
                              onClick={() => field.onChange(dur)}
                              className={`rounded-xl border p-3 text-center transition-colors ${
                                selected
                                  ? "border-violet-500 bg-violet-50"
                                  : "border-stone-200 hover:bg-stone-50"
                              }`}
                            >
                              <p className="text-sm font-semibold text-stone-800">{dur}分</p>
                              <p className="text-[11px] text-stone-500 mt-1 leading-relaxed">
                                単発 ¥{single.toLocaleString()}<br />
                                4回チケット ¥{pack.toLocaleString()}/回
                              </p>
                            </button>
                          );
                        })}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="usesTicketPack"
                  render={({ field }) => (
                    <FormItem>
                      <div className={`rounded-xl border p-4 transition-colors ${field.value ? "border-violet-300 bg-violet-50/50" : "border-stone-200"}`}>
                        <div className="flex items-start gap-3">
                          <FormControl>
                            <Checkbox
                              id="ticket-pack"
                              checked={!!field.value}
                              onCheckedChange={field.onChange}
                              className="mt-0.5"
                            />
                          </FormControl>
                          <div className="flex-1">
                            <label
                              htmlFor="ticket-pack"
                              className="text-sm font-medium text-stone-700 cursor-pointer"
                            >
                              4回チケットで予約する
                            </label>
                            <p className="mt-1 text-[11px] text-stone-500 leading-relaxed">
                              4回チケットご利用の場合、1回あたりの料金が割安になります。
                              チェックを入れると4回チケット価格で計算されます（単発予約の場合はチェックを外してください）。
                            </p>
                          </div>
                        </div>
                      </div>
                    </FormItem>
                  )}
                />

                <div className="flex items-start gap-2 rounded-xl bg-violet-50 border border-violet-100 p-4">
                  <AlertCircle className="size-4 text-violet-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-violet-700 leading-relaxed">
                    任意の場所をリクエストの場合、レッスン料金に加えて
                    <strong>場所代金・ボール代金等はお客様負担</strong>
                    となります。当日現地で別途お支払いください。
                  </p>
                </div>
              </>
            )}

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
                          枠全体を独占。1名（マンツーマン）〜3名まで。他のお客様は参加しません。
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
