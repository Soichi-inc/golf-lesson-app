import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ReservationForm } from "@/components/customer/reserve/ReservationForm";
import { getScheduleById, getSchedules } from "@/app/actions/schedules";

export const metadata: Metadata = { title: "予約フォーム" };

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ scheduleId: string }> };

export default async function ReservePage({ params }: Props) {
  const { scheduleId } = await params;
  const schedule = await getScheduleById(scheduleId);
  if (!schedule || !schedule.isAvailable) notFound();

  // 場所リクエスト枠の選択肢として、これまで実施実績のあるインドア店舗を抽出
  let existingStores: string[] = [];
  if (schedule.allowAnyLocation && schedule.lessonPlan.category === "REGULAR") {
    const all = await getSchedules();
    const seen = new Set<string>();
    for (const s of all) {
      if (
        !s.allowAnyLocation &&
        s.lessonPlan.category === "REGULAR" &&
        s.location &&
        !seen.has(s.location)
      ) {
        seen.add(s.location);
      }
    }
    existingStores = Array.from(seen).sort();
  }

  return (
    <main className="section-padding">
      <div className="content-container max-w-2xl">
        <div className="mb-8 text-center">
          <p className="mb-2 text-[11px] tracking-[0.3em] text-stone-400 uppercase">Booking</p>
          <h1 className="text-2xl font-light tracking-wide text-stone-800">予約フォーム</h1>
        </div>
        <ReservationForm schedule={schedule} existingStores={existingStores} />
      </div>
    </main>
  );
}
