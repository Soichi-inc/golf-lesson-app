"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  ClipboardList,
  Users,
  FileText,
  BookOpen,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navItems = [
  {
    label: "ダッシュボード",
    href: "/admin",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    label: "スケジュール管理",
    href: "/admin/schedule",
    icon: CalendarDays,
  },
  {
    label: "予約管理",
    href: "/admin/reservations",
    icon: ClipboardList,
  },
  {
    label: "顧客管理",
    href: "/admin/customers",
    icon: Users,
  },
] as const;

const contentItems = [
  {
    label: "プロフィール編集",
    href: "/admin/content/profile",
    icon: FileText,
  },
  {
    label: "レッスンプラン管理",
    href: "/admin/content/plans",
    icon: BookOpen,
  },
] as const;

type NavLinkProps = {
  href: string;
  icon: React.ElementType;
  label: string;
  exact?: boolean;
  onClick?: () => void;
};

function NavLink({ href, icon: Icon, label, exact = false, onClick }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all",
        isActive
          ? "bg-stone-800 text-white font-medium"
          : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
      )}
    >
      <Icon className="size-4 shrink-0" />
      <span className="flex-1">{label}</span>
      {isActive && <ChevronRight className="size-3 opacity-60" />}
    </Link>
  );
}

function SidebarContent({ onClose }: { onClose?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      {/* ロゴ */}
      <div className="px-4 py-5">
        <p className="text-[10px] tracking-[0.15em] text-stone-400 uppercase mb-0.5">
          Mayumi Okumura
        </p>
        <p className="text-base font-semibold text-stone-800 tracking-tight">
          管理画面
        </p>
      </div>

      <Separator />

      {/* メインナビ */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink key={item.href} {...item} onClick={onClose} />
        ))}

        <div className="pt-4">
          <p className="px-3 pb-2 text-[10px] tracking-[0.15em] text-stone-400 uppercase font-medium">
            コンテンツ
          </p>
          {contentItems.map((item) => (
            <NavLink key={item.href} {...item} onClick={onClose} />
          ))}
        </div>
      </nav>

      {/* フッター */}
      <Separator />
      <div className="px-4 py-4">
        <p className="text-xs text-stone-400">ログイン中: プロ管理者</p>
      </div>
    </div>
  );
}

// デスクトップ用固定サイドバー
export function AdminSidebarDesktop() {
  return (
    <aside className="hidden lg:flex w-56 shrink-0 flex-col border-r bg-white h-screen sticky top-0">
      <SidebarContent />
    </aside>
  );
}

// モバイル用ドロワー
export function AdminSidebarMobile() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-label="メニューを開く"
        >
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-56 p-0">
        <div className="absolute right-3 top-3 z-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen(false)}
            aria-label="閉じる"
          >
            <X className="size-4" />
          </Button>
        </div>
        <SidebarContent onClose={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
