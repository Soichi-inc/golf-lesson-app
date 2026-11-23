import Link from "next/link";

/** 管理画面内で、対象（顧客・予約など）が見つからなかったときの表示 */
export default function AdminNotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col items-center justify-center px-6 py-16 text-center">
      <h1 className="mb-3 text-lg font-medium text-stone-800">
        見つかりませんでした
      </h1>
      <p className="mb-8 text-sm leading-relaxed text-stone-500">
        すでに削除されたか、URLが変わった可能性があります。
      </p>
      <Link
        href="/admin/mayumi"
        className="flex h-11 w-full max-w-60 items-center justify-center rounded-full bg-stone-800 text-sm text-white hover:bg-stone-700"
      >
        管理画面のトップへ
      </Link>
    </div>
  );
}
