import { CustomerHeader } from "@/components/customer/Header";
import { CustomerFooter } from "@/components/customer/Footer";

// ページタイトルの屋号・説明文は最上位の layout.tsx（奥村真由美ゴルフレッスン）の設定を使う。
// ここで上書きすると、検索結果やタブの表示が「… | Golf Lesson」になってしまう。

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-stone-50">
      <CustomerHeader />
      <div className="flex-1">{children}</div>
      <CustomerFooter />
    </div>
  );
}
