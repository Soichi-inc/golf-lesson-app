import type { Metadata } from "next";
import { getPlans } from "@/app/actions/plans";
import { PlanListManager } from "@/components/admin/content/PlanListManager";

export const metadata: Metadata = {
  title: "レッスンプラン管理",
};

export default async function AdminContentPlansPage() {
  const plans = await getPlans();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-light tracking-wide mb-1">
          レッスンプラン管理
        </h1>
        <p className="text-sm text-stone-500">
          レッスンプランの追加・編集・削除ができます
        </p>
      </div>

      <PlanListManager initialPlans={plans} />
    </div>
  );
}
