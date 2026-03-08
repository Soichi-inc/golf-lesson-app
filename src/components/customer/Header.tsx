"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Menu, X, User, LogOut, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";

const navLinks = [
  { href: "/", label: "トップ", exact: true },
  { href: "/lessons", label: "レッスンプラン" },
  { href: "/schedule", label: "スケジュール" },
  { href: "/mypage", label: "マイページ" },
] as const;

function NavLink({
  href,
  label,
  exact = false,
  onClick,
  mobile = false,
  scrolled = false,
  isHome = false,
}: {
  href: string;
  label: string;
  exact?: boolean;
  onClick?: () => void;
  mobile?: boolean;
  scrolled?: boolean;
  isHome?: boolean;
}) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname.startsWith(href);

  if (mobile) {
    return (
      <Link
        href={href}
        onClick={onClick}
        className={cn(
          "block px-4 py-3 text-base rounded-lg transition-colors",
          isActive
            ? "bg-stone-100 text-stone-900 font-medium"
            : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"
        )}
      >
        {label}
      </Link>
    );
  }

  const transparent = isHome && !scrolled;

  return (
    <Link
      href={href}
      className={cn(
        "text-sm transition-colors duration-300 relative pb-0.5",
        isActive
          ? transparent
            ? "text-white font-medium after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-white"
            : "text-stone-900 font-medium after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-stone-800"
          : transparent
            ? "text-white/70 hover:text-white"
            : "text-stone-500 hover:text-stone-800"
      )}
    >
      {label}
    </Link>
  );
}

export function CustomerHeader() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === "/";

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const transparent = isHome && !scrolled;

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full transition-all duration-500",
        transparent
          ? "bg-transparent border-b border-transparent"
          : "bg-white/95 backdrop-blur-sm border-b border-stone-100 shadow-sm"
      )}
    >
      <div className="content-container flex items-center justify-between h-14 px-4">
        {/* Logo */}
        <Link href="/" className="flex flex-col leading-none">
          <span className={cn(
            "text-[10px] tracking-[0.15em] uppercase transition-colors duration-300",
            transparent ? "text-white/60" : "text-stone-400"
          )}>
            Mayumi Okumura
          </span>
          <span className={cn(
            "text-base font-semibold tracking-tight transition-colors duration-300",
            transparent ? "text-white" : "text-stone-800"
          )}>
            Official HP
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-7">
          {navLinks.map((link) => (
            <NavLink key={link.href} {...link} scrolled={scrolled} isHome={isHome} />
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <Button
            asChild
            size="sm"
            className={cn(
              "hidden sm:flex text-xs h-8 px-4 rounded-full transition-all duration-300",
              transparent
                ? "bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm"
                : "bg-stone-800 hover:bg-stone-700 text-white"
            )}
          >
            <Link href="/schedule">予約する</Link>
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "hidden sm:flex size-8 transition-colors duration-300",
                    transparent ? "text-white hover:bg-white/10" : ""
                  )}
                >
                  <User className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-3 py-2">
                  <p className="text-xs text-stone-500 truncate">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/mypage" className="cursor-pointer">
                    <User className="mr-2 size-4" />
                    マイページ
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-red-600 focus:text-red-600 cursor-pointer"
                >
                  <LogOut className="mr-2 size-4" />
                  ログアウト
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              asChild
              variant="ghost"
              size="icon"
              className={cn(
                "hidden sm:flex size-8 transition-colors duration-300",
                transparent ? "text-white hover:bg-white/10" : ""
              )}
            >
              <Link href="/auth/login" aria-label="ログイン">
                <LogIn className="size-4" />
              </Link>
            </Button>
          )}

          {/* Mobile hamburger */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "md:hidden size-9 transition-colors duration-300",
                  transparent ? "text-white hover:bg-white/10" : ""
                )}
                aria-label="メニュー"
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64 p-0">
              <div className="flex items-center justify-between px-4 py-4 border-b">
                <span className="text-sm font-semibold text-stone-800">メニュー</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setOpen(false)}
                  className="size-8"
                >
                  <X className="size-4" />
                </Button>
              </div>
              <nav className="flex flex-col gap-1 p-3">
                {navLinks.map((link) => (
                  <NavLink
                    key={link.href}
                    {...link}
                    mobile
                    onClick={() => setOpen(false)}
                  />
                ))}
              </nav>
              <div className="px-4 pt-2 pb-4 flex flex-col gap-2">
                <Button
                  asChild
                  className="w-full bg-stone-800 hover:bg-stone-700"
                  onClick={() => setOpen(false)}
                >
                  <Link href="/schedule">レッスンを予約する</Link>
                </Button>
                {user ? (
                  <Button
                    variant="outline"
                    className="w-full text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => {
                      setOpen(false);
                      handleLogout();
                    }}
                  >
                    <LogOut className="mr-2 size-4" />
                    ログアウト
                  </Button>
                ) : (
                  <Button
                    asChild
                    variant="outline"
                    className="w-full"
                    onClick={() => setOpen(false)}
                  >
                    <Link href="/auth/login">
                      <LogIn className="mr-2 size-4" />
                      ログイン
                    </Link>
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
