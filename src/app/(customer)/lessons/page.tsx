import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "レッスンプラン",
};

export default function LessonsPage() {
  return (
    <main className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-light tracking-wide text-center mb-8">
        レッスンプラン
      </h1>
      <p className="text-center text-muted-foreground">
        レッスンプラン一覧ページ（実装予定）
      </p>
    </main>
  );
}
