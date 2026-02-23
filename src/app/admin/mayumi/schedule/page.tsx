import type { Metadata } from "next";
import { ScheduleManager } from "@/components/admin/schedule/ScheduleManager";
import { getSchedules, getLessonPlans } from "@/app/actions/schedules";

export const metadata: Metadata = {
  title: "スケジュール管理",
};

export const dynamic = "force-dynamic";

export default async function AdminSchedulePage() {
  const [schedules, lessonPlans] = await Promise.all([
    getSchedules(),
    getLessonPlans(),
  ]);

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
        initialSchedules={schedules}
        lessonPlans={lessonPlans}
      />
    </div>
  );
}
