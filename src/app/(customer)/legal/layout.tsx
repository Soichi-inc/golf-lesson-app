import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <main className="section-padding">
      <div className="content-container max-w-3xl px-4 py-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-xs text-stone-400 hover:text-stone-600 transition-colors mb-6"
        >
          <ChevronLeft className="size-3.5" />
          トップに戻る
        </Link>
        <article className="legal-content">{children}</article>
      </div>
    </main>
  );
}
