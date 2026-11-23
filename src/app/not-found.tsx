import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "ページが見つかりません",
};

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-stone-50 px-6 py-16 text-center">
      <p className="mb-3 text-xs tracking-[0.3em] text-stone-400">404</p>
      <h1 className="mb-3 text-lg font-medium text-stone-800">
        ページが見つかりません
      </h1>
      <p className="mb-8 max-w-sm text-sm leading-relaxed text-stone-500">
        お探しのページは移動または削除された可能性があります。
        下のボタンからお進みください。
      </p>
      <div className="flex w-full max-w-60 flex-col gap-3">
        <Link
          href="/"
          className="flex h-11 items-center justify-center rounded-full bg-stone-800 text-sm text-white hover:bg-stone-700"
        >
          トップページへ
        </Link>
        <Link
          href="/schedule"
          className="flex h-11 items-center justify-center rounded-full border border-stone-300 text-sm text-stone-700 hover:bg-stone-100"
        >
          レッスンの空き状況を見る
        </Link>
      </div>
    </div>
  );
}
