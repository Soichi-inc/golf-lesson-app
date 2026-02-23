"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";

const registerSchema = z
  .object({
    name: z.string().min(1, "お名前を入力してください").max(50),
    email: z.string().email("メールアドレスの形式が正しくありません"),
    password: z
      .string()
      .min(8, "パスワードは8文字以上で入力してください")
      .max(100),
    confirmPassword: z.string().min(1, "パスワード（確認）を入力してください"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "パスワードが一致しません",
    path: ["confirmPassword"],
  });

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    setServerError(null);
    const supabase = createClient();

    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.name,
        },
      },
    });

    if (error) {
      if (error.message.includes("already registered") || error.message.includes("already exists")) {
        setServerError("このメールアドレスはすでに登録されています");
      } else {
        setServerError("登録に失敗しました。しばらくしてからお試しください");
      }
      return;
    }

    setCompleted(true);
  };

  // 登録完了画面
  if (completed) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
        <div className="w-full max-w-sm text-center">
          <CheckCircle2 className="mx-auto size-14 text-green-500 mb-4" />
          <h1 className="text-xl font-light tracking-wide text-stone-800 mb-2">
            登録が完了しました
          </h1>
          <p className="text-sm text-stone-500 mb-6">
            確認メールをお送りしました。
            <br />
            メール内のリンクをクリックして登録を完了してください。
          </p>
          <Button
            asChild
            className="bg-stone-800 hover:bg-stone-700 text-white rounded-full px-8"
          >
            <Link href="/auth/login">ログインページへ</Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-stone-50 px-4 py-10">
      <div className="w-full max-w-sm">
        {/* ロゴ */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center leading-none mb-6">
            <span className="text-[9px] tracking-[0.25em] text-stone-400 uppercase">Pro Golf</span>
            <span className="text-xl font-semibold text-stone-800 tracking-tight">Lesson</span>
          </Link>
          <h1 className="text-2xl font-light tracking-wide text-stone-800">新規登録</h1>
          <p className="mt-2 text-sm text-stone-500">アカウントを作成してください</p>
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

            {/* 氏名 */}
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-sm text-stone-700">
                お名前
              </Label>
              <Input
                id="name"
                type="text"
                autoComplete="name"
                placeholder="山田 太郎"
                {...register("name")}
                className={errors.name ? "border-red-300 focus-visible:ring-red-300" : ""}
              />
              {errors.name && (
                <p className="text-xs text-red-500">{errors.name.message}</p>
              )}
            </div>

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
                <span className="ml-1 text-xs text-stone-400">（8文字以上）</span>
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
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

            {/* パスワード確認 */}
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-sm text-stone-700">
                パスワード（確認）
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="パスワードを再入力"
                  {...register("confirmPassword")}
                  className={errors.confirmPassword ? "border-red-300 focus-visible:ring-red-300 pr-10" : "pr-10"}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                  aria-label={showConfirm ? "パスワードを隠す" : "パスワードを表示"}
                >
                  {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* 登録ボタン */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-stone-800 hover:bg-stone-700 text-white rounded-full h-10"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  登録中...
                </>
              ) : (
                "アカウントを作成する"
              )}
            </Button>
          </form>
        </div>

        {/* ログインリンク */}
        <p className="mt-6 text-center text-sm text-stone-500">
          すでにアカウントをお持ちの方は{" "}
          <Link
            href="/auth/login"
            className="text-stone-800 font-medium underline underline-offset-2 hover:text-stone-600"
          >
            ログイン
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
