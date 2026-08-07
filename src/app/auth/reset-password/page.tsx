import type { Metadata } from "next";
import { Suspense } from "react";
import ResetPasswordForm from "./ResetPasswordForm";

export const metadata: Metadata = {
  title: "新しいパスワードの設定",
};

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
      {/* useSearchParams（token_hash読み取り）のためSuspense境界が必要 */}
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </main>
  );
}
