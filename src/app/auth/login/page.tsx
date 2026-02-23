import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ログイン",
};

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-light tracking-wide text-center mb-8">
          ログイン
        </h1>
        <p className="text-center text-muted-foreground text-sm">
          ログインフォーム（実装予定）
        </p>
      </div>
    </main>
  );
}
