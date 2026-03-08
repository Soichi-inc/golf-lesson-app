import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { MyReservationList } from "@/components/customer/mypage/MyReservationList";
import { createClient } from "@/lib/supabase/server";
import { getReservationsByUserId } from "@/app/actions/reservations";
import type { Reservation } from "@/types";

export const metadata: Metadata = { title: "予約履歴" };

export const dynamic = "force-dynamic";

export default async function MyReservationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let reservations: Reservation[] = [];
  if (user) {
    reservations = await getReservationsByUserId(user.id);
  }

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
