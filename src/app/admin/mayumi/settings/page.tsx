import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAccountInfo } from "@/app/actions/account";
import { AccountSettingsForm } from "@/components/admin/settings/AccountSettingsForm";

export const metadata: Metadata = {
  title: "アカウント設定",
};

export default async function AdminSettingsPage() {
  const account = await getAccountInfo();

  if (!account) {
    redirect("/auth/login?next=/admin/mayumi/settings");
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-light tracking-wide mb-1">
          アカウント設定
        </h1>
        <p className="text-sm text-stone-500">
          アカウント情報の確認・変更ができます
        </p>
      </div>

      <AccountSettingsForm account={account} />
    </div>
  );
}
