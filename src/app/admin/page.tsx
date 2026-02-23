import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ダッシュボード",
};

export default function AdminDashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-light tracking-wide mb-6">ダッシュボード</h1>
      <p className="text-muted-foreground">
        管理画面ダッシュボード（実装予定）
      </p>
    </div>
  );
}
