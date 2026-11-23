"use client";

import { useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

const LINE_OFFICIAL_URL = "https://lin.ee/UP2gfpv";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
  /** customer: お客様向けページ / admin: 管理画面 */
  variant: "customer" | "admin";
};

/**
 * ページの表示中にエラーが起きたときの案内画面（error.tsx から使う）
 *
 * データの読み込みに失敗した場合、空のデータや古い初期値を表示して先へ進ませる
 * のではなく、ここで止めて再読み込みを案内する。
 * （読めなかっただけなのに「予約がありません」「メモがありません」と表示すると、
 *   お客様や講師が誤った判断をしてしまうため）
 */
export function ErrorScreen({ error, reset, variant }: Props) {
  const router = useRouter();
  const [isRetrying, startTransition] = useTransition();

  useEffect(() => {
    console.error(error);
  }, [error]);

  // サーバー側のデータを取り直してから、エラー表示を解除する
  const retry = () =>
    startTransition(() => {
      router.refresh();
      reset();
    });

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-5 flex size-14 items-center justify-center rounded-full bg-stone-100">
        <WifiOff className="size-6 text-stone-400" aria-hidden />
      </div>
      <h1 className="mb-3 text-lg font-medium text-stone-800">
        一時的に表示できませんでした
      </h1>
      <p className="mb-8 text-sm leading-relaxed text-stone-500">
        通信が不安定か、サーバーが混み合っている可能性があります。
        <br />
        少し待ってから、もう一度お試しください。
      </p>

      <Button
        onClick={retry}
        disabled={isRetrying}
        className="h-11 w-full max-w-60 rounded-full bg-stone-800 text-white hover:bg-stone-700"
      >
        {isRetrying ? (
          <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
        ) : (
          <RefreshCw className="mr-2 size-4" aria-hidden />
        )}
        もう一度読み込む
      </Button>

      <Link
        href={variant === "admin" ? "/admin/mayumi" : "/"}
        className="mt-5 text-sm text-stone-500 underline underline-offset-4 hover:text-stone-700"
      >
        {variant === "admin" ? "管理画面のトップへ" : "トップページへ"}
      </Link>

      {variant === "customer" && (
        <p className="mt-8 text-xs leading-relaxed text-stone-400">
          何度試しても表示されない場合は、
          <a
            href={LINE_OFFICIAL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-stone-600"
          >
            LINE公式アカウント
          </a>
          からご連絡ください。
        </p>
      )}
    </div>
  );
}
