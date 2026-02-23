import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ReservationForm } from "@/components/customer/reserve/ReservationForm";
import { mockSchedules } from "@/lib/mock/data";

export const metadata: Metadata = { title: "予約フォーム" };

type Props = { params: Promise<{ scheduleId: string }> };

export default async function ReservePage({ params }: Props) {
  const { scheduleId } = await params;
  const schedule = mockSchedules.find((s) => s.id === scheduleId && s.isAvailable);
  if (!schedule) notFound();

  return (
    <main className="section-padding">
      <div className="content-container max-w-2xl">
        <div className="mb-8 text-center">
          <p className="mb-2 text-[11px] tracking-[0.3em] text-stone-400 uppercase">Booking</p>
          <h1 className="text-2xl font-light tracking-wide text-stone-800">予約フォーム</h1>
        </div>
        <ReservationForm schedule={schedule} />
      </div>
    </main>
  );
}
