"use client";

import { useState, useEffect } from "react";
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

const schema = z
  .object({
    password: z.string().min(8, "8文字以上で入力してください"),
    passwordConfirm: z.string(),
  })
  .refine((d) => d.password === d.passwordConfirm, {
    path: ["passwordConfirm"],
    message: "パスワードが一致しません",
  });

type FormValues = z.infer<typeof schema>;

export default function ResetPasswordForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [canReset, setCanReset] = useState(false);

  // セッションを確認（メールリンクからアクセスした場合はセッションが存在するはず）
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      setCanReset(!!data.session);
    });
  }, []);

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
    const { error } = await supabase.auth.updateUser({
      password: data.password,
    });

    if (error) {
      setServerError("パスワードの更新に失敗しました。再度お試しください。");
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push("/auth/login"), 2500);
  };

  if (success) {
    return (
      <div className="w-full max-w-sm text-center">
        <CheckCircle2 className="mx-auto size-12 text-emerald-500 mb-4" />
        <h1 className="text-xl font-medium text-stone-800 mb-2">
          パスワードを更新しました
        </h1>
        <p className="text-sm text-stone-500">
          ログイン画面に移動します…
        </p>
      </div>
    );
  }

  if (!canReset) {
    return (
      <div className="w-full max-w-sm text-center">
        <h1 className="text-xl font-medium text-stone-800 mb-2">
          リンクが無効です
        </h1>
        <p className="text-sm text-stone-500 mb-6">
          リンクの有効期限が切れているか、既に使用済みの可能性があります。
        </p>
        <Link
          href="/auth/forgot-password"
          className="inline-block text-sm text-stone-800 underline underline-offset-2"
        >
          再度メールを送信する
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-light tracking-wide text-stone-800">
          新しいパスワード
        </h1>
        <p className="mt-2 text-sm text-stone-500">
          新しいパスワードを設定してください
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
            <Label htmlFor="password" className="text-sm text-stone-700">
              新しいパスワード
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="8文字以上"
                {...register("password")}
                className={`pr-10 ${errors.password ? "border-red-300" : ""}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-500">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="passwordConfirm" className="text-sm text-stone-700">
              新しいパスワード（確認）
            </Label>
            <Input
              id="passwordConfirm"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="再度入力してください"
              {...register("passwordConfirm")}
              className={errors.passwordConfirm ? "border-red-300" : ""}
            />
            {errors.passwordConfirm && (
              <p className="text-xs text-red-500">
                {errors.passwordConfirm.message}
              </p>
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
                更新中...
              </>
            ) : (
              "パスワードを更新"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
