import type { Metadata } from "next";
import {
  AdminSidebarDesktop,
  AdminSidebarMobile,
} from "@/components/admin/AdminSidebar";

export const metadata: Metadata = {
  title: {
    template: "%s | 管理画面",
    default: "管理画面",
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-stone-50">
      {/* デスクトップ: 固定サイドバー */}
      <AdminSidebarDesktop />

      {/* メインコンテンツ領域 */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* モバイル用トップバー */}
        <header className="flex lg:hidden items-center gap-3 border-b bg-white px-4 py-3 sticky top-0 z-20">
          <AdminSidebarMobile />
          <p className="text-sm font-semibold text-stone-800">管理画面</p>
        </header>

        <main className="flex-1 p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
