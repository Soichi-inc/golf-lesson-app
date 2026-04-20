"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Mail, User, Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateDisplayName, updatePhone, updatePassword, type AccountInfo } from "@/app/actions/account";

type Props = { initial: AccountInfo };

// プロフィールフォーム
const profileSchema = z.object({
  displayName: z.string().trim().min(1, "氏名を入力してください").max(60),
  phone: z
    .string()
    .trim()
    .refine((v) => v === "" || /^[0-9+\-() ]{8,20}$/.test(v), "電話番号の形式が正しくありません")
    .optional()
    .or(z.literal("")),
});
type ProfileValues = z.infer<typeof profileSchema>;

// パスワードフォーム
const passwordSchema = z
  .object({
    password: z.string().min(8, "8文字以上で入力してください"),
    passwordConfirm: z.string(),
  })
  .refine((d) => d.password === d.passwordConfirm, {
    path: ["passwordConfirm"],
    message: "パスワードが一致しません",
  });
type PasswordValues = z.infer<typeof passwordSchema>;

export function AccountEditForm({ initial }: Props) {
  return (
    <div className="space-y-6">
      {/* アカウント情報（メールアドレス表示のみ） */}
      <section className="rounded-2xl bg-white ring-1 ring-stone-100 shadow-sm p-5 sm:p-6">
        <h2 className="text-sm font-medium text-stone-800 mb-4 flex items-center gap-1.5">
          <Mail className="size-4 text-stone-500" />
          アカウント
        </h2>
        <div>
          <Label className="text-xs text-stone-500">メールアドレス</Label>
          <p className="mt-1 text-sm text-stone-700">{initial.email}</p>
          <p className="mt-1 text-[11px] text-stone-400">
            ※メールアドレスの変更は、お手数ですが管理者までご連絡ください
          </p>
        </div>
      </section>

      {/* プロフィール編集 */}
      <ProfileSection initial={initial} />

      {/* パスワード変更 */}
      <PasswordSection />
    </div>
  );
}

// ---------------------------------------------------------------------------
// プロフィール編集セクション
// ---------------------------------------------------------------------------
function ProfileSection({ initial }: { initial: AccountInfo }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: initial.displayName,
      phone: initial.phone,
    },
  });

  const onSubmit = (values: ProfileValues) => {
    setMessage(null);
    startTransition(async () => {
      // 名前と電話番号を両方更新
      const nameResult = await updateDisplayName(values.displayName);
      if (!nameResult.success) {
        setMessage({ type: "error", text: nameResult.error || "更新に失敗しました" });
        return;
      }
      const phoneResult = await updatePhone(values.phone || "");
      if (!phoneResult.success) {
        setMessage({ type: "error", text: phoneResult.error || "更新に失敗しました" });
        return;
      }
      setMessage({ type: "success", text: "プロフィールを更新しました" });
      reset(values);
    });
  };

  return (
    <section className="rounded-2xl bg-white ring-1 ring-stone-100 shadow-sm p-5 sm:p-6">
      <h2 className="text-sm font-medium text-stone-800 mb-4 flex items-center gap-1.5">
        <User className="size-4 text-stone-500" />
        プロフィール
      </h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="displayName" className="text-sm text-stone-700">
            氏名
          </Label>
          <Input
            id="displayName"
            {...register("displayName")}
            className={errors.displayName ? "border-red-300" : ""}
          />
          {errors.displayName && (
            <p className="text-xs text-red-500">{errors.displayName.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="phone" className="text-sm text-stone-700 flex items-center gap-1">
            電話番号
            <span className="text-[10px] text-stone-400">（任意）</span>
          </Label>
          <Input
            id="phone"
            type="tel"
            placeholder="090-0000-0000"
            {...register("phone")}
            className={errors.phone ? "border-red-300" : ""}
          />
          {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
        </div>

        {message && (
          <div
            className={`rounded-lg px-3 py-2 text-xs ${
              message.type === "success"
                ? "bg-emerald-50 border border-emerald-100 text-emerald-700"
                : "bg-red-50 border border-red-100 text-red-600"
            }`}
          >
            {message.type === "success" && <CheckCircle2 className="inline size-3.5 mr-1" />}
            {message.text}
          </div>
        )}

        <Button
          type="submit"
          disabled={isPending || !isDirty}
          className="bg-stone-800 hover:bg-stone-700 text-white rounded-full h-9 px-6"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              保存中...
            </>
          ) : (
            "保存する"
          )}
        </Button>
      </form>
    </section>
  );
}

// ---------------------------------------------------------------------------
// パスワード変更セクション
// ---------------------------------------------------------------------------
function PasswordSection() {
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
  });

  const onSubmit = (values: PasswordValues) => {
    setMessage(null);
    startTransition(async () => {
      const result = await updatePassword(values.password);
      if (result.success) {
        setMessage({ type: "success", text: "パスワードを更新しました" });
        reset({ password: "", passwordConfirm: "" });
      } else {
        setMessage({ type: "error", text: result.error || "更新に失敗しました" });
      }
    });
  };

  return (
    <section className="rounded-2xl bg-white ring-1 ring-stone-100 shadow-sm p-5 sm:p-6">
      <h2 className="text-sm font-medium text-stone-800 mb-4 flex items-center gap-1.5">
        <Lock className="size-4 text-stone-500" />
        パスワード変更
      </h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
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
              aria-label={showPassword ? "パスワードを隠す" : "パスワードを表示"}
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
            <p className="text-xs text-red-500">{errors.passwordConfirm.message}</p>
          )}
        </div>

        {message && (
          <div
            className={`rounded-lg px-3 py-2 text-xs ${
              message.type === "success"
                ? "bg-emerald-50 border border-emerald-100 text-emerald-700"
                : "bg-red-50 border border-red-100 text-red-600"
            }`}
          >
            {message.type === "success" && <CheckCircle2 className="inline size-3.5 mr-1" />}
            {message.text}
          </div>
        )}

        <Button
          type="submit"
          disabled={isPending}
          variant="outline"
          className="rounded-full h-9 px-6 border-stone-300 text-stone-700"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              更新中...
            </>
          ) : (
            "パスワードを更新"
          )}
        </Button>

      </form>
    </section>
  );
}
