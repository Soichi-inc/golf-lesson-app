"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  User,
  Mail,
  Shield,
  Key,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  updateDisplayName,
  updatePassword,
  type AccountInfo,
} from "@/app/actions/account";

// 表示名フォーム
const nameSchema = z.object({
  displayName: z.string().min(1, "表示名を入力してください"),
});

// パスワードフォーム
const passwordSchema = z.object({
  newPassword: z.string().min(6, "6文字以上で入力してください"),
  confirmPassword: z.string().min(6, "6文字以上で入力してください"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "パスワードが一致しません",
  path: ["confirmPassword"],
});

type Props = {
  account: AccountInfo;
};

export function AccountSettingsForm({ account }: Props) {
  return (
    <div className="space-y-8">
      {/* アカウント情報 */}
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-100">
        <div className="flex items-center gap-2 mb-5">
          <Mail className="size-4 text-stone-500" />
          <h2 className="text-base font-semibold text-stone-800">アカウント情報</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="text-[11px] text-stone-400 mb-1">メールアドレス</p>
            <p className="text-sm font-medium text-stone-800">{account.email}</p>
          </div>
          <div>
            <p className="text-[11px] text-stone-400 mb-1">ログイン方法</p>
            <p className="text-sm text-stone-700 capitalize">{account.provider}</p>
          </div>
          <div>
            <p className="text-[11px] text-stone-400 mb-1">権限</p>
            <Badge className={
              account.role === "ADMIN"
                ? "bg-amber-50 text-amber-700 border border-amber-200"
                : "bg-stone-50 text-stone-600 border border-stone-200"
            }>
              <Shield className="size-3 mr-1" />
              {account.role}
            </Badge>
          </div>
        </div>
      </section>

      {/* 表示名変更 */}
      <DisplayNameSection currentName={account.displayName} />

      {/* パスワード変更 */}
      {account.provider === "email" && <PasswordSection />}

      {account.provider !== "email" && (
        <div className="rounded-xl bg-stone-50 border border-stone-200 p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="size-4 text-stone-400 shrink-0 mt-0.5" />
            <p className="text-xs text-stone-500 leading-relaxed">
              ソーシャルログイン（{account.provider}）でサインインしています。パスワードの変更はソーシャルプロバイダー側で行ってください。
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function DisplayNameSection({ currentName }: { currentName: string }) {
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const form = useForm({
    resolver: zodResolver(nameSchema),
    defaultValues: { displayName: currentName },
  });

  async function onSubmit(values: z.infer<typeof nameSchema>) {
    setStatus("saving");
    setErrorMsg("");
    const result = await updateDisplayName(values.displayName);
    if (result.success) {
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 3000);
    } else {
      setStatus("error");
      setErrorMsg(result.error || "更新に失敗しました");
    }
  }

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-100">
      <div className="flex items-center gap-2 mb-5">
        <User className="size-4 text-stone-500" />
        <h2 className="text-base font-semibold text-stone-800">表示名</h2>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="displayName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>表示名</FormLabel>
                <FormControl>
                  <Input placeholder="表示名を入力" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex items-center gap-3">
            <Button
              type="submit"
              disabled={status === "saving"}
              className="bg-stone-800 hover:bg-stone-700"
            >
              {status === "saving" ? (
                <><Loader2 className="size-4 animate-spin mr-1.5" /> 更新中...</>
              ) : (
                "表示名を更新"
              )}
            </Button>
            {status === "saved" && (
              <span className="flex items-center gap-1 text-sm text-green-600">
                <CheckCircle2 className="size-4" /> 更新しました
              </span>
            )}
            {status === "error" && (
              <span className="text-sm text-red-600">{errorMsg}</span>
            )}
          </div>
        </form>
      </Form>
    </section>
  );
}

function PasswordSection() {
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const form = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  async function onSubmit(values: z.infer<typeof passwordSchema>) {
    setStatus("saving");
    setErrorMsg("");
    const result = await updatePassword(values.newPassword);
    if (result.success) {
      setStatus("saved");
      form.reset();
      setTimeout(() => setStatus("idle"), 3000);
    } else {
      setStatus("error");
      setErrorMsg(result.error || "更新に失敗しました");
    }
  }

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-100">
      <div className="flex items-center gap-2 mb-5">
        <Key className="size-4 text-stone-500" />
        <h2 className="text-base font-semibold text-stone-800">パスワード変更</h2>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="newPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>新しいパスワード</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="6文字以上" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>新しいパスワード（確認）</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="もう一度入力" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex items-center gap-3">
            <Button
              type="submit"
              disabled={status === "saving"}
              className="bg-stone-800 hover:bg-stone-700"
            >
              {status === "saving" ? (
                <><Loader2 className="size-4 animate-spin mr-1.5" /> 更新中...</>
              ) : (
                "パスワードを更新"
              )}
            </Button>
            {status === "saved" && (
              <span className="flex items-center gap-1 text-sm text-green-600">
                <CheckCircle2 className="size-4" /> 更新しました
              </span>
            )}
            {status === "error" && (
              <span className="text-sm text-red-600">{errorMsg}</span>
            )}
          </div>
        </form>
      </Form>
    </section>
  );
}
