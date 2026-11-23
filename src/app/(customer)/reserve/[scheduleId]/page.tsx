import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarX2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReservationForm } from "@/components/customer/reserve/ReservationForm";
import { getScheduleById, getLessonPlans } from "@/app/actions/schedules";
import { getBookedCountsByScheduleId } from "@/app/actions/reservations";
import type { LessonPlan } from "@/types";

export const metadata: Metadata = { title: "予約フォーム" };

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ scheduleId: string }> };

export default async function ReservePage({ params }: Props) {
  const { scheduleId } = await params;
  const [schedule, bookedCounts] = await Promise.all([
    getScheduleById(scheduleId),
    getBookedCountsByScheduleId(),
  ]);
  if (!schedule || !schedule.isAvailable) notFound();

  // 開始時刻を過ぎた枠・すでに埋まった枠では、入力してもらう前にお知らせする
  // （入力後の送信で初めて「満員です」と出るのを避ける。送信時にもサーバー側で再確認している）
  const booked = bookedCounts[schedule.id];
  const isFull = !!booked && (booked.privateLocked || booked.count >= schedule.maxAttendees);
  const hasStarted = schedule.startAt.getTime() <= new Date().getTime();
  if (hasStarted || isFull) {
    return (
      <main className="section-padding">
        <div className="content-container max-w-md text-center">
          <div className="mb-6 flex justify-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-stone-100">
              <CalendarX2 className="size-7 text-stone-400" aria-hidden />
            </div>
          </div>
          <h1 className="mb-3 text-xl font-light tracking-wide text-stone-800">
            {hasStarted ? "この枠の受付は終了しました" : "この枠は満員になりました"}
          </h1>
          <p className="mb-8 text-sm leading-relaxed text-stone-500">
            お手数ですが、別の日時をお選びください。
          </p>
          <Button asChild className="rounded-full bg-stone-800 px-8 hover:bg-stone-700">
            <Link href="/schedule">空き枠を確認する</Link>
          </Button>
        </div>
      </main>
    );
  }

  // 場所リクエスト枠で「既存店舗」として選択可能なインドアプラン一覧
  let existingPlans: LessonPlan[] = [];
  if (schedule.allowAnyLocation && schedule.lessonPlan.category === "REGULAR") {
    const all = await getLessonPlans();
    existingPlans = all
      .filter((p) => p.category === "REGULAR" && p.isPublished)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }

  return (
    <main className="section-padding">
      <div className="content-container max-w-2xl">
        <div className="mb-8 text-center">
          <p className="mb-2 text-[11px] tracking-[0.3em] text-stone-400 uppercase">Booking</p>
          <h1 className="text-2xl font-light tracking-wide text-stone-800">予約フォーム</h1>
        </div>
        <ReservationForm schedule={schedule} existingPlans={existingPlans} />
      </div>
    </main>
  );
}
