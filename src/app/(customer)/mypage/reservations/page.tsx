import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { MyReservationList } from "@/components/customer/mypage/MyReservationList";
import { mockReservations } from "@/lib/mock/data";

export const metadata: Metadata = { title: "予約履歴" };

const ME = "user-1";

export default function MyReservationsPage() {
  const reservations = mockReservations.filter((r) => r.userId === ME);

  return (
    <main className="section-padding">
      <div className="content-container max-w-2xl">
        <div className="mb-6">
          <Link
            href="/mypage"
            className="inline-flex items-center gap-1 text-xs text-stone-400 hover:text-stone-600 transition-colors mb-4"
          >
            <ChevronLeft className="size-3.5" />
            マイページ
          </Link>
          <h1 className="text-xl font-light tracking-wide text-stone-800">予約履歴</h1>
        </div>
        <MyReservationList reservations={reservations} />
      </div>
    </main>
  );
}
