import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getAccountInfo } from "@/app/actions/account";
import { AccountEditForm } from "@/components/customer/mypage/AccountEditForm";

export const metadata: Metadata = { title: "アカウント設定" };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const account = await getAccountInfo();
  if (!account) redirect("/auth/login?next=/mypage/account");

  return (
    <main className="section-padding">
      <div className="content-container max-w-xl">
        <div className="mb-6">
          <Link
            href="/mypage"
            className="inline-flex items-center gap-1 text-xs text-stone-400 hover:text-stone-600 transition-colors mb-4"
          >
            <ChevronLeft className="size-3.5" />
            マイページ
          </Link>
          <h1 className="text-xl font-light tracking-wide text-stone-800">
            アカウント設定
          </h1>
          <p className="text-xs text-stone-400 mt-1">
            プロフィール情報・パスワードの変更
          </p>
        </div>

        <AccountEditForm initial={account} />
      </div>
    </main>
  );
}
