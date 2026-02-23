import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "予約確認",
};

export default function ReserveConfirmPage() {
  return (
    <main className="container mx-auto px-4 py-12 max-w-xl">
      <h1 className="text-3xl font-light tracking-wide text-center mb-8">
        予約内容の確認
      </h1>
      <p className="text-center text-muted-foreground">
        予約確認ページ（実装予定）
      </p>
    </main>
  );
}
