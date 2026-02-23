import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "レッスンプラン管理",
};

export default function AdminContentPlansPage() {
  return (
    <div>
      <h1 className="text-2xl font-light tracking-wide mb-6">
        レッスンプラン管理
      </h1>
      <p className="text-muted-foreground">
        プラン・料金の作成・編集（実装予定）
      </p>
    </div>
  );
}
