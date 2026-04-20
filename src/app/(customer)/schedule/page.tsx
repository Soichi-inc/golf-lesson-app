import type { Metadata } from "next";
import { SchedulePicker } from "@/components/customer/reserve/SchedulePicker";
import { getSchedules } from "@/app/actions/schedules";
import { getBookedCountsByScheduleId } from "@/app/actions/reservations";

export const metadata: Metadata = { title: "スケジュール" };

export const dynamic = "force-dynamic";

export default async function SchedulePage() {
  // 公開スケジュール + 予約数を並行取得
  const [allSchedules, bookedCounts] = await Promise.all([
    getSchedules(),
    getBookedCountsByScheduleId(),
  ]);

  // 公開中 かつ 定員未満 の枠のみ渡す
  const availableSchedules = allSchedules.filter((s) => {
    if (!s.isAvailable) return false;
    const booked = bookedCounts[s.id] ?? 0;
    return booked < s.maxAttendees;
  });

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
