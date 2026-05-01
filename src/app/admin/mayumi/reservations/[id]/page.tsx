import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import {
  ChevronLeft,
  CalendarDays,
  Clock,
  MapPin,
  Mail,
  Phone,
  User,
  Users,
  Flag,
  CheckCircle2,
  XCircle,
  Hourglass,
  MessageSquare,
  Camera,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getReservations } from "@/app/actions/reservations";

export const metadata: Metadata = { title: "予約詳細" };

export const dynamic = "force-dynamic";

const STATUS_MAP = {
  PENDING:   { label: "リクエスト中", icon: Hourglass,    className: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  CONFIRMED: { label: "予約確定",     icon: CheckCircle2, className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  COMPLETED: { label: "レッスン実施済", icon: CheckCircle2, className: "bg-blue-50 text-blue-700 border-blue-200" },
  CANCELLED: { label: "キャンセル",   icon: XCircle,      className: "bg-stone-100 text-stone-500 border-stone-200" },
} as const;

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AdminReservationDetailPage({ params }: Props) {
  const { id } = await params;
  const reservations = await getReservations();
  const rsv = reservations.find((r) => r.id === id);

  if (!rsv) notFound();

  const s = STATUS_MAP[rsv.status];
  const Icon = s.icon;
  const schedule = rsv.schedule;
  const startAt = new Date(schedule.startAt);
  const isFlexCustom = rsv.indoorLocationType === "custom";
  const displayDuration = rsv.requestedDuration ?? schedule.lessonPlan.duration;
  const endAt = rsv.requestedDuration
    ? new Date(startAt.getTime() + rsv.requestedDuration * 60 * 1000)
    : new Date(schedule.endAt);
  const displayLocation = rsv.requestedLocation ?? schedule.location;

  return (
    <div>
      <Link
        href="/admin/mayumi/reservations"
        className="inline-flex items-center gap-1 text-xs text-stone-400 hover:text-stone-600 transition-colors mb-4"
      >
        <ChevronLeft className="size-3.5" />
        予約一覧に戻る
      </Link>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-light tracking-wide text-stone-800">予約詳細</h1>
        <Badge variant="outline" className={`text-xs ${s.className}`}>
          <Icon className="size-3 mr-1" />
          {s.label}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 顧客情報 */}
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-stone-100 p-5 sm:p-6">
          <p className="text-[11px] uppercase tracking-widest text-stone-400 mb-4">顧客情報</p>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-stone-100">
                <User className="size-5 text-stone-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-stone-800">{rsv.user.name || "名前未設定"}</p>
                <p className="text-xs text-stone-400">ID: {rsv.userId.slice(0, 8)}...</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-stone-600">
              <Mail className="size-4 text-stone-400 shrink-0" />
              {rsv.user.email}
            </div>
            {rsv.emergencyPhone && (
              <div className="flex items-center gap-2 text-sm text-stone-600">
                <Phone className="size-4 text-stone-400 shrink-0" />
                <a href={`tel:${rsv.emergencyPhone}`} className="underline-offset-2 hover:underline">
                  {rsv.emergencyPhone}
                </a>
                <span className="text-[11px] text-stone-400">（緊急連絡先）</span>
              </div>
            )}
            <Link
              href={`/admin/mayumi/customers/${rsv.userId}`}
              className="inline-block text-xs text-stone-500 underline underline-offset-2 hover:text-stone-700 transition-colors"
            >
              顧客カルテを開く
            </Link>
          </div>
        </div>

        {/* レッスン情報 */}
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-stone-100 p-5 sm:p-6">
          <p className="text-[11px] uppercase tracking-widest text-stone-400 mb-4">レッスン情報</p>
          <div className="space-y-3">
            <div>
              <Badge
                variant="outline"
                className={`text-[10px] mb-2 ${schedule.lessonPlan.category === "ROUND" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-stone-50 text-stone-600 border-stone-200"}`}
              >
                {schedule.lessonPlan.category === "ROUND" ? "ラウンドレッスン" : "インドアレッスン"}
              </Badge>
              <p className="text-sm font-medium text-stone-800">{schedule.lessonPlan.name}</p>
              {schedule.allowAnyLocation && (
                <Badge variant="outline" className="mt-1 text-[10px] bg-violet-50 text-violet-700 border-violet-200">
                  場所リクエスト枠
                </Badge>
              )}
              <p className="text-lg font-light text-stone-700 mt-1">
                ¥{(rsv.totalPrice ?? schedule.lessonPlan.price).toLocaleString()} <span className="text-xs text-stone-400">税込</span>
              </p>
              {rsv.optionSwingVideo && (
                <p className="text-[11px] text-stone-400 mt-0.5">
                  レッスン ¥{((rsv.totalPrice ?? schedule.lessonPlan.price) - 3000).toLocaleString()}
                  {" + "}撮影オプション ¥3,000
                </p>
              )}
            </div>
            <div className="space-y-2">
              <p className="flex items-center gap-2 text-sm text-stone-600">
                <CalendarDays className="size-4 text-stone-400 shrink-0" />
                {format(startAt, "yyyy年M月d日（E）", { locale: ja })}
              </p>
              <p className="flex items-center gap-2 text-sm text-stone-600">
                <Clock className="size-4 text-stone-400 shrink-0" />
                {format(startAt, "HH:mm")} – {format(endAt, "HH:mm")}（{displayDuration}分
                {rsv.requestedDuration && (
                  <span className="text-violet-600 ml-1">リクエスト</span>
                )}
                ）
              </p>
              {displayLocation && (
                <p className="flex items-center gap-2 text-sm text-stone-600">
                  <MapPin className="size-4 text-stone-400 shrink-0" />
                  {rsv.requestedLocation ? (
                    <span className="text-violet-700">
                      {isFlexCustom ? "任意場所：" : "店舗："}
                      {rsv.requestedLocation}
                    </span>
                  ) : (
                    schedule.location
                  )}
                </p>
              )}
              {isFlexCustom && (
                <p className="text-xs text-violet-600 leading-relaxed">
                  予約形式：{rsv.requestedDuration}分・{rsv.usesTicketPack ? "4回チケット利用" : "単発予約"}
                  <br />
                  ※場所代金・ボール代金等はお客様負担
                </p>
              )}
              {rsv.roundBookingType && (
                <p className="flex items-center gap-2 text-sm text-stone-600">
                  {rsv.roundBookingType === "private" ? (
                    <>
                      <User className="size-4 text-stone-400 shrink-0" />
                      貸切予約 / {rsv.roundParticipantCount ?? 1}名
                    </>
                  ) : (
                    <>
                      <Users className="size-4 text-stone-400 shrink-0" />
                      組み合わせ予約
                    </>
                  )}
                </p>
              )}
              {rsv.requestedCourse && (
                <p className="flex items-start gap-2 text-sm text-stone-600">
                  <Flag className="size-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>
                    希望コース：<span className="text-amber-700 font-medium">{rsv.requestedCourse}</span>
                    <br />
                    <span className="text-[11px] text-stone-400">
                      ※お客様指定コースの場合は、講師のラウンド代・食事・交通費を別途
                    </span>
                  </span>
                </p>
              )}
              {rsv.schedule.lessonPlan.category === "ROUND" && (
                <p className="text-[11px] text-stone-400 leading-relaxed">
                  ※上記はレッスン料金のみ。プレー代（コース代・カート代等）はお客様負担
                </p>
              )}
            </div>
          </div>
        </div>

        {/* お悩み・同意事項 */}
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-stone-100 p-5 sm:p-6 lg:col-span-2">
          <p className="text-[11px] uppercase tracking-widest text-stone-400 mb-4">リクエスト内容</p>
          <div className="space-y-4">
            {rsv.concern ? (
              <div className="flex items-start gap-3">
                <MessageSquare className="size-4 text-stone-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-stone-500 mb-1">お悩み・ご質問</p>
                  <p className="text-sm text-stone-700 bg-stone-50 rounded-xl p-3 leading-relaxed">{rsv.concern}</p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-stone-400 flex items-center gap-2">
                <MessageSquare className="size-4" />
                お悩み・ご質問の記載なし
              </p>
            )}

            <div className="flex flex-wrap gap-4 pt-2">
              <div className="flex items-center gap-2 text-xs">
                <ShieldCheck className={`size-4 ${rsv.agreedCancelPolicy ? "text-emerald-500" : "text-stone-300"}`} />
                <span className={rsv.agreedCancelPolicy ? "text-stone-700" : "text-stone-400"}>
                  キャンセルポリシー {rsv.agreedCancelPolicy ? "同意済" : "未同意"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Camera className={`size-4 ${rsv.agreedPhotoPost ? "text-emerald-500" : "text-stone-300"}`} />
                <span className={rsv.agreedPhotoPost ? "text-stone-700" : "text-stone-400"}>
                  撮影・SNS掲載 {rsv.agreedPhotoPost ? "同意済" : "未同意"}
                </span>
              </div>
            </div>

            {rsv.cancelReason && (
              <div className="rounded-xl bg-red-50 border border-red-100 p-3">
                <p className="text-xs font-medium text-red-600 mb-1">キャンセル理由</p>
                <p className="text-sm text-red-700">{rsv.cancelReason}</p>
                {rsv.cancelledAt && (
                  <p className="text-[11px] text-red-400 mt-1">
                    キャンセル日時：{format(new Date(rsv.cancelledAt), "yyyy年M月d日 HH:mm", { locale: ja })}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* メタ情報 */}
      <div className="mt-6 text-[11px] text-stone-400 space-y-1">
        <p>予約ID: {rsv.id}</p>
        <p>予約日時: {format(new Date(rsv.createdAt), "yyyy年M月d日 HH:mm:ss", { locale: ja })}</p>
        <p>最終更新: {format(new Date(rsv.updatedAt), "yyyy年M月d日 HH:mm:ss", { locale: ja })}</p>
      </div>
    </div>
  );
}
