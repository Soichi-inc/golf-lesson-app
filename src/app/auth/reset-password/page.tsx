import type { Metadata } from "next";
import ResetPasswordForm from "./ResetPasswordForm";

export const metadata: Metadata = {
  title: "新しいパスワードの設定",
};

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
      <ResetPasswordForm />
    </main>
  );
}
