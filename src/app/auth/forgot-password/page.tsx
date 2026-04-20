import type { Metadata } from "next";
import ForgotPasswordForm from "./ForgotPasswordForm";

export const metadata: Metadata = {
  title: "パスワードをお忘れの方",
};

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
      <ForgotPasswordForm />
    </main>
  );
}
