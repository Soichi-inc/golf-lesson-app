import Link from "next/link";

export function CustomerFooter() {
  return (
    <footer className="border-t border-stone-100 bg-white">
      <div className="content-container px-4 py-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <p className="text-[10px] tracking-[0.15em] text-stone-400 uppercase mb-0.5">
              Mayumi Okumura
            </p>
            <p className="text-sm font-semibold text-stone-800">Official HP</p>
          </div>

          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-1">
            {[
              { href: "/", label: "トップ" },
              { href: "/lessons", label: "レッスンプラン" },
              { href: "/schedule", label: "スケジュール" },
              { href: "/mypage", label: "マイページ" },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-xs text-stone-500 hover:text-stone-800 transition-colors"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        <nav className="mt-6 flex flex-wrap justify-center gap-x-4 gap-y-1 border-t border-stone-100 pt-4">
          {[
            { href: "/legal/privacy", label: "プライバシーポリシー" },
            { href: "/legal/terms", label: "利用規約" },
            { href: "/legal/tokushoho", label: "特定商取引法に基づく表記" },
            { href: "/legal/cancel-policy", label: "キャンセルポリシー" },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-[11px] text-stone-400 hover:text-stone-700 transition-colors"
            >
              {label}
            </Link>
          ))}
        </nav>

        <p className="mt-6 text-center text-[11px] text-stone-400">
          © {new Date().getFullYear()} Soichi, Inc. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
