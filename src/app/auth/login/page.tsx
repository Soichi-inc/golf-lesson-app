"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2 } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("メールアドレスの形式が正しくありません"),
  password: z.string().min(1, "パスワードを入力してください"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setServerError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      setServerError("メールアドレスまたはパスワードが正しくありません");
      return;
    }

    router.push(next);
    router.refresh();
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
      <div className="w-full max-w-sm">
        {/* ロゴ */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center leading-none mb-6">
            <span className="text-[9px] tracking-[0.25em] text-stone-400 uppercase">Pro Golf</span>
            <span className="text-xl font-semibold text-stone-800 tracking-tight">Lesson</span>
          </Link>
          <h1 className="text-2xl font-light tracking-wide text-stone-800">ログイン</h1>
          <p className="mt-2 text-sm text-stone-500">アカウントにサインインしてください</p>
        </div>

        {/* フォーム */}
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            {/* サーバーエラー */}
            {serverError && (
              <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
                {serverError}
              </div>
            )}

            {/* メール */}
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
                className={errors.email ? "border-red-300 focus-visible:ring-red-300" : ""}
              />
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            {/* パスワード */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm text-stone-700">
                パスワード
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="パスワードを入力"
                  {...register("password")}
                  className={errors.password ? "border-red-300 focus-visible:ring-red-300 pr-10" : "pr-10"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                  aria-label={showPassword ? "パスワードを隠す" : "パスワードを表示"}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500">{errors.password.message}</p>
              )}
            </div>

            {/* ログインボタン */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-stone-800 hover:bg-stone-700 text-white rounded-full h-10"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  ログイン中...
                </>
              ) : (
                "ログイン"
              )}
            </Button>
          </form>
        </div>

        {/* 新規登録リンク */}
        <p className="mt-6 text-center text-sm text-stone-500">
          アカウントをお持ちでない方は{" "}
          <Link
            href="/auth/register"
            className="text-stone-800 font-medium underline underline-offset-2 hover:text-stone-600"
          >
            新規登録
          </Link>
        </p>

        {/* トップに戻る */}
        <p className="mt-3 text-center">
          <Link href="/" className="text-xs text-stone-400 hover:text-stone-600">
            ← トップページに戻る
          </Link>
        </p>
      </div>
    </main>
  );
}
