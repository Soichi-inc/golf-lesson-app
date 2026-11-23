import Link from "next/link";

/** ログイン・新規登録などの画面上部に出すサイトのロゴ（ヘッダーと同じ表記にそろえる） */
export function AuthLogo() {
  return (
    <Link href="/" className="inline-flex flex-col items-center leading-none mb-6">
      <span className="text-[9px] tracking-[0.25em] text-stone-400 uppercase">
        Mayumi Okumura
      </span>
      <span className="text-xl font-semibold text-stone-800 tracking-tight">
        Official HP
      </span>
    </Link>
  );
}
