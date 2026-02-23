import type { Metadata } from "next";
import { SchedulePicker } from "@/components/customer/reserve/SchedulePicker";
import { getSchedules } from "@/app/actions/schedules";

export const metadata: Metadata = { title: "スケジュール" };

export const dynamic = "force-dynamic";

export default async function SchedulePage() {
  const allSchedules = await getSchedules();

  // 公開中の空き枠のみ渡す
  const availableSchedules = allSchedules.filter((s) => s.isAvailable);

  return (
    <main className="section-padding">
      <div className="content-container">
        <div className="mb-8 text-center">
          <p className="mb-2 text-[11px] tracking-[0.3em] text-stone-400 uppercase">Booking</p>
          <h1 className="text-2xl font-light tracking-wide text-stone-800 sm:text-3xl">
            レッスンを予約する
          </h1>
          <p className="mt-3 text-sm text-stone-500">
            ご希望の日時をカレンダーから選んでください
          </p>
        </div>
        <SchedulePicker schedules={availableSchedules} />
      </div>
    </main>
  );
}
