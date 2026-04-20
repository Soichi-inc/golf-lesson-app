"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2 } from "lucide-react";

const schema = z.object({
  email: z.string().email("メールアドレスの形式が正しくありません"),
});

type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormValues) => {
    setServerError(null);
    const supabase = createClient();
    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/auth/reset-password`
        : "/auth/reset-password";

    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo,
    });

    if (error) {
      setServerError("リクエストに失敗しました。しばらく経ってから再度お試しください。");
      return;
    }

    setSent(true);
  };

  if (sent) {
    return (
      <div className="w-full max-w-sm text-center">
        <CheckCircle2 className="mx-auto size-12 text-emerald-500 mb-4" />
        <h1 className="text-xl font-medium text-stone-800 mb-2">
          メールを送信しました
        </h1>
        <p className="text-sm text-stone-500 leading-relaxed">
          入力されたメールアドレス宛にパスワード再設定用のリンクをお送りしました。
          <br />
          メールをご確認のうえ、リンクからパスワードを再設定してください。
        </p>
        <p className="mt-4 text-xs text-stone-400">
          ※届かない場合はスパムフォルダもご確認ください
        </p>
        <Link
          href="/auth/login"
          className="mt-8 inline-block text-sm text-stone-600 hover:text-stone-800 underline underline-offset-2"
        >
          ログイン画面に戻る
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-8">
        <Link
          href="/"
          className="inline-flex flex-col items-center leading-none mb-6"
        >
          <span className="text-[9px] tracking-[0.25em] text-stone-400 uppercase">
            Pro Golf
          </span>
          <span className="text-xl font-semibold text-stone-800 tracking-tight">
            Lesson
          </span>
        </Link>
        <h1 className="text-2xl font-light tracking-wide text-stone-800">
          パスワード再設定
        </h1>
        <p className="mt-2 text-sm text-stone-500">
          ご登録のメールアドレスを入力してください
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          {serverError && (
            <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
              {serverError}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm text-stone-700">
              メールアドレス
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="example@email.com"
              {...register("email")}
              className={errors.email ? "border-red-300" : ""}
            />
            {errors.email && (
              <p className="text-xs text-red-500">{errors.email.message}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-stone-800 hover:bg-stone-700 text-white rounded-full h-10"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                送信中...
              </>
            ) : (
              "再設定メールを送信"
            )}
          </Button>
        </form>
      </div>

      <p className="mt-6 text-center text-sm">
        <Link
          href="/auth/login"
          className="text-stone-500 hover:text-stone-800 underline underline-offset-2"
        >
          ← ログイン画面に戻る
        </Link>
      </p>
    </div>
  );
}
