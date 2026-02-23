import type { Metadata } from "next";
import { getProfile } from "@/app/actions/profile";
import { ProfileEditForm } from "@/components/admin/content/ProfileEditForm";

export const metadata: Metadata = {
  title: "プロフィール編集",
};

export default async function AdminContentProfilePage() {
  const profile = await getProfile();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-light tracking-wide mb-1">
          プロフィール編集
        </h1>
        <p className="text-sm text-stone-500">
          公開ページに表示されるプロフィール情報を管理します
        </p>
      </div>

      <ProfileEditForm initialData={profile} />
    </div>
  );
}
