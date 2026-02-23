import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "予約管理",
};

export default function AdminReservationsPage() {
  return (
    <div>
      <h1 className="text-2xl font-light tracking-wide mb-6">予約管理</h1>
      <p className="text-muted-foreground">
        予約一覧・ステータス管理（実装予定）
      </p>
    </div>
  );
}
