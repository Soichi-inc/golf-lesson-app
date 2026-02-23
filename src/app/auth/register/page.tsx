import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "新規登録",
};

export default function RegisterPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-light tracking-wide text-center mb-8">
          新規登録
        </h1>
        <p className="text-center text-muted-foreground text-sm">
          会員登録フォーム（実装予定）
        </p>
      </div>
    </main>
  );
}
