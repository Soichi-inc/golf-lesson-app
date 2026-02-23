import { Suspense } from "react";
import type { Metadata } from "next";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "ログイン",
};

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
