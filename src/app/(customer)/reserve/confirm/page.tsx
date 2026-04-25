import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { CalendarDays, MapPin, Clock, CheckCircle2, Hourglass, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { getReservationsByUserId } from "@/app/actions/reservations";

export const metadata: Metadata = { title: "予約状況確認" };

export const dynamic = "force-dynamic";

const STATUS_MAP = {
  PENDING:   { label: "承認待ち",   icon: Hourglass,    className: "bg-yellow-50 text-yellow-700 border-yellow-200", desc: "講師が予約を確認中です。確定までしばらくお待ちください。" },
  CONFIRMED: { label: "予約確定",   icon: CheckCircle2, className: "bg-emerald-50 text-emerald-700 border-emerald-200", desc: "予約が確定しました。当日お会いできるのを楽しみにしています！" },
  COMPLETED: { label: "レッスン実施済", icon: CheckCircle2, className: "bg-blue-50 text-blue-700 border-blue-200", desc: "レッスンが実施済みです。ありがとうございました。" },
  CANCELLED: { label: "キャンセル済", icon: XCircle,      className: "bg-stone-100 text-stone-500 border-stone-200", desc: "この予約はキャンセルされました。" },
} as const;

export default async function ReserveConfirmPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login?next=/reserve/confirm");

  const reservations = await getReservationsByUserId(user.id);

  // 最新の予約を表示
  const latest = reservations.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )[0];

  if (!latest) {
    return (
      <main className="section-padding">
        <div className="content-container max-w-md text-center">
          <p className="text-sm text-stone-500 mb-6">予約が見つかりません</p>
          <Button asChild className="rounded-full bg-stone-800 hover:bg-stone-700">
            <Link href="/schedule">レッスンを予約する</Link>
          </Button>
        </div>
      </main>
    );
  }

  const s = STATUS_MAP[latest.status];
  const Icon = s.icon;
  const schedule = latest.schedule;
  const startAt = new Date(schedule.startAt);
  const isFlexCustom = latest.indoorLocationType === "custom";
  const displayDuration = latest.requestedDuration ?? schedule.lessonPlan.duration;
  const endAt = latest.requestedDuration
    ? new Date(startAt.getTime() + latest.requestedDuration * 60 * 1000)
    : new Date(schedule.endAt);
  const displayLocation = latest.requestedLocation ?? schedule.location;

  return (
    <main className="section-padding">
      <div className="content-container max-w-lg">
        <div className="mb-8 text-center">
          <p className="mb-2 text-[11px] tracking-[0.3em] text-stone-400 uppercase">Reservation Status</p>
          <h1 className="text-2xl font-light tracking-wide text-stone-800">予約状況</h1>
        </div>

        {/* ステータスカード */}
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-stone-100 overflow-hidden">
          <div className="flex items-center gap-3 p-5 border-b border-stone-100">
            <div className={`flex size-10 items-center justify-center rounded-full ${latest.status === "PENDING" ? "bg-yellow-50" : latest.status === "CONFIRMED" ? "bg-emerald-50" : latest.status === "COMPLETED" ? "bg-blue-50" : "bg-stone-100"}`}>
              <Icon className={`size-5 ${latest.status === "PENDING" ? "text-yellow-500" : latest.status === "CONFIRMED" ? "text-emerald-500" : latest.status === "COMPLETED" ? "text-blue-500" : "text-stone-400"}`} />
            </div>
            <div>
              <Badge variant="outline" className={`text-[10px] ${s.className}`}>{s.label}</Badge>
              <p className="text-xs text-stone-500 mt-1">{s.desc}</p>
            </div>
          </div>

          {/* レッスン詳細 */}
          <div className="p-5 space-y-4">
            <div>
              <p className="text-[11px] uppercase tracking-widest text-stone-400 mb-2">レッスン内容</p>
              <p className="text-sm font-medium text-stone-800">{schedule.lessonPlan.name}</p>
              {schedule.allowAnyLocation && (
                <Badge variant="outline" className="mt-1 text-[10px] bg-violet-50 text-violet-700 border-violet-200">
                  場所リクエスト枠
                </Badge>
              )}
              <p className="text-lg font-light text-stone-700 mt-1">¥{(latest.totalPrice ?? schedule.lessonPlan.price).toLocaleString()} <span className="text-xs text-stone-400">税込</span></p>
            </div>

            <div className="space-y-2">
              <p className="flex items-center gap-2 text-sm text-stone-600">
                <CalendarDays className="size-4 text-stone-400 shrink-0" />
                {format(startAt, "yyyy年M月d日（E）", { locale: ja })}
              </p>
              <p className="flex items-center gap-2 text-sm text-stone-600">
                <Clock className="size-4 text-stone-400 shrink-0" />
                {format(startAt, "HH:mm")} – {format(endAt, "HH:mm")}（{displayDuration}分
                {latest.requestedDuration && (
                  <span className="text-violet-600 ml-1">リクエスト</span>
                )}
                ）
              </p>
              {displayLocation && (
                <p className="flex items-center gap-2 text-sm text-stone-600">
                  <MapPin className="size-4 text-stone-400 shrink-0" />
                  {latest.requestedLocation ? (
                    <span className="text-violet-700">
                      {isFlexCustom ? "任意場所：" : "店舗："}
                      {latest.requestedLocation}
                    </span>
                  ) : (
                    schedule.location
                  )}
                </p>
              )}
              {isFlexCustom && (
                <p className="text-xs text-violet-600 leading-relaxed pl-6">
                  予約形式：{latest.requestedDuration}分・{latest.usesTicketPack ? "4回チケット利用" : "単発予約"}
                  <br />
                  ※場所代金・ボール代金等はお客様負担
                </p>
              )}
            </div>

            {latest.concern && (
              <div>
                <p className="text-[11px] uppercase tracking-widest text-stone-400 mb-1">お悩み・ご質問</p>
                <p className="text-sm text-stone-600 bg-stone-50 rounded-xl p-3">{latest.concern}</p>
              </div>
            )}

            <p className="text-[11px] text-stone-400">
              予約日時：{format(new Date(latest.createdAt), "yyyy年M月d日 HH:mm", { locale: ja })}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-3 mt-8">
          <Button asChild variant="outline" className="rounded-full border-stone-300">
            <Link href="/mypage/reservations">予約一覧を見る</Link>
          </Button>
          <Button asChild className="rounded-full bg-stone-800 hover:bg-stone-700">
            <Link href="/">トップに戻る</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
