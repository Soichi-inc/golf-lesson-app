"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReservationHistory } from "./ReservationHistory";
import { InstructorNoteEditor } from "./InstructorNoteEditor";
import { DrillList } from "./DrillList";
import type { CustomerDetail } from "@/types";

type Props = {
  customer: CustomerDetail;
};

export function CustomerKarte({ customer }: Props) {
  const completedCount = customer.reservations.filter(
    (r) => r.status === "COMPLETED"
  ).length;

  return (
    <Tabs defaultValue="reservations" className="space-y-4">
      <TabsList className="bg-stone-100">
        <TabsTrigger value="reservations" className="text-xs">
          予約履歴
          {completedCount > 0 && (
            <span className="ml-1.5 text-[10px] bg-stone-300 text-stone-700 rounded-full px-1.5">
              {completedCount}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="notes" className="text-xs">
          指導メモ
          {customer.instructorNotes.length > 0 && (
            <span className="ml-1.5 text-[10px] bg-stone-300 text-stone-700 rounded-full px-1.5">
              {customer.instructorNotes.length}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="drills" className="text-xs">
          ドリル
          {customer.drills.length > 0 && (
            <span className="ml-1.5 text-[10px] bg-stone-300 text-stone-700 rounded-full px-1.5">
              {customer.drills.length}
            </span>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="reservations" className="mt-0">
        <ReservationHistory reservations={customer.reservations} />
      </TabsContent>

      <TabsContent value="notes" className="mt-0">
        <InstructorNoteEditor
          initialNotes={customer.instructorNotes}
          userId={customer.id}
        />
      </TabsContent>

      <TabsContent value="drills" className="mt-0">
        <DrillList drills={customer.drills} userId={customer.id} />
      </TabsContent>
    </Tabs>
  );
}
