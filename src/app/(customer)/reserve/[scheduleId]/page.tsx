import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ReservationForm } from "@/components/customer/reserve/ReservationForm";
import { getScheduleById, getLessonPlans } from "@/app/actions/schedules";
import type { LessonPlan } from "@/types";

export const metadata: Metadata = { title: "予約フォーム" };

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ scheduleId: string }> };

export default async function ReservePage({ params }: Props) {
  const { scheduleId } = await params;
  const schedule = await getScheduleById(scheduleId);
  if (!schedule || !schedule.isAvailable) notFound();

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
