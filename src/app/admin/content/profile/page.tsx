import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "プロフィール編集",
};

export default function AdminContentProfilePage() {
  return (
    <div>
      <h1 className="text-2xl font-light tracking-wide mb-6">
        プロフィール編集
      </h1>
      <p className="text-muted-foreground">
        経歴・資格・指導方針の編集（実装予定）
      </p>
    </div>
  );
}
