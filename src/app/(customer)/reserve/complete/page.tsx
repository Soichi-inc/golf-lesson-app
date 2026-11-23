import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "予約リクエスト受付" };

export default function ReserveCompletePage() {
  return (
    <main className="section-padding">
      <div className="content-container max-w-md text-center">
        <div className="flex justify-center mb-6">
          <div className="flex size-20 items-center justify-center rounded-full bg-emerald-50">
            <CheckCircle2 className="size-10 text-emerald-500" />
          </div>
        </div>
        <h1 className="text-2xl font-light tracking-wide text-stone-800 mb-3">
          予約リクエストを受け付けました
        </h1>
        <p className="text-sm text-stone-500 leading-relaxed mb-3">
          ご登録のメールアドレスに受付メールをお送りしました。
          講師が内容を確認し、承認されるとご予約が確定します。
          確定のご連絡もメールでお届けします。
        </p>
        <p className="text-xs text-stone-400 leading-relaxed mb-8">
          メールが届かない場合は、迷惑メールフォルダをご確認ください。
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <Button asChild variant="outline" className="rounded-full border-stone-300">
            <Link href="/mypage/reservations">予約履歴を確認する</Link>
          </Button>
          <Button asChild className="rounded-full bg-stone-800 hover:bg-stone-700">
            <Link href="/">トップに戻る</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
