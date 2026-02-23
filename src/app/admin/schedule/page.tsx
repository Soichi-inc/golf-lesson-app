import type { Metadata } from "next";
import { ScheduleManager } from "@/components/admin/schedule/ScheduleManager";
import { mockSchedules, mockLessonPlans } from "@/lib/mock/data";

export const metadata: Metadata = {
  title: "スケジュール管理",
};

export default function AdminSchedulePage() {
  return (
    <div className="space-y-6">
      {/* ページヘッダー */}
      <div>
        <h1 className="text-2xl font-light tracking-wide text-stone-800">
          スケジュール管理
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          レッスンの空き枠を登録・管理します
        </p>
      </div>

      {/* スケジュール管理コンポーネント */}
      <ScheduleManager
        initialSchedules={mockSchedules}
        lessonPlans={mockLessonPlans}
      />
    </div>
  );
}
