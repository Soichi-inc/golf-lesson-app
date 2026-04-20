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
  User,
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
  COMPLETED: { label: "レッスン完了", icon: CheckCircle2, className: "bg-blue-50 text-blue-700 border-blue-200" },
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
  const endAt = new Date(schedule.endAt);

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
              <p className="text-lg font-light text-stone-700 mt-1">
                ¥{schedule.lessonPlan.price.toLocaleString()} <span className="text-xs text-stone-400">税込</span>
              </p>
            </div>
            <div className="space-y-2">
              <p className="flex items-center gap-2 text-sm text-stone-600">
                <CalendarDays className="size-4 text-stone-400 shrink-0" />
                {format(startAt, "yyyy年M月d日（E）", { locale: ja })}
              </p>
              <p className="flex items-center gap-2 text-sm text-stone-600">
                <Clock className="size-4 text-stone-400 shrink-0" />
                {format(startAt, "HH:mm")} – {format(endAt, "HH:mm")}（{schedule.lessonPlan.duration}分）
              </p>
              {schedule.location && (
                <p className="flex items-center gap-2 text-sm text-stone-600">
                  <MapPin className="size-4 text-stone-400 shrink-0" />
                  {schedule.location}
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
