import type { Metadata } from "next";
import Link from "next/link";
import { Clock, Users, CheckCircle2, MapPin, ChevronRight, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getPlans, type PlanData } from "@/app/actions/plans";
import { getProfile } from "@/app/actions/profile";

export const metadata: Metadata = {
  title: "レッスンプラン",
  description: "奥村真由美プロのゴルフレッスンプラン一覧。プライベートレッスン・ラウンドレッスン・オンラインレッスンをご用意しています。",
};

export const dynamic = "force-dynamic";

/* ---------- カードコンポーネント ---------- */
function PlanCard({ plan }: { plan: PlanData }) {
  const colorMap = {
    REGULAR: { bar: "bg-stone-700", badge: "border-stone-200 bg-stone-50 text-stone-600", btn: "bg-stone-800 hover:bg-stone-700" },
    ROUND:   { bar: "bg-amber-400", badge: "border-amber-200 bg-amber-50 text-amber-700", btn: "bg-amber-500 hover:bg-amber-600" },
    ONLINE:  { bar: "bg-sky-400", badge: "border-sky-200 bg-sky-50 text-sky-700", btn: "bg-sky-500 hover:bg-sky-600" },
  };
  const c = colorMap[plan.category];

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-100 transition-shadow hover:shadow-md">
      <div className={`h-1.5 w-full ${c.bar}`} />
      <div className="p-6 sm:p-7">
        {/* ヘッド */}
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <Badge variant="outline" className={`mb-2 text-[10px] ${c.badge}`}>
              {plan.tagLabel}
            </Badge>
            <h3 className="text-lg font-semibold text-stone-800">{plan.name}</h3>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-light text-stone-800">
              ¥{plan.price.toLocaleString()}
              {plan.priceFrom && <span className="text-base text-stone-500">〜</span>}
            </p>
            <p className="text-[11px] text-stone-400">{plan.priceNote ?? "税込"}</p>
          </div>
        </div>

        {/* 説明 */}
        {plan.description && (
          <p className="mb-5 text-sm leading-relaxed text-stone-500 whitespace-pre-wrap">
            {plan.description}
          </p>
        )}

        {/* ハイライト */}
        {plan.highlights && plan.highlights.length > 0 && (
          <ul className="mb-5 flex flex-col gap-1.5">
            {plan.highlights.map((h) => (
              <li key={h} className="flex items-center gap-2 text-sm text-stone-700">
                <CheckCircle2 className="size-3.5 text-stone-400 shrink-0" />
                {h}
              </li>
            ))}
          </ul>
        )}

        {/* 料金詳細 */}
        {plan.details.length > 0 && (
          <div className="mb-5 rounded-xl bg-stone-50 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-stone-400 mb-2">料金詳細</p>
            <ul className="flex flex-col gap-1.5">
              {plan.details.map((d) => (
                <li key={d} className="flex items-start gap-1.5 text-xs text-stone-600">
                  <span className="mt-1.5 size-1 shrink-0 rounded-full bg-stone-300" />
                  {d}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* メタ */}
        <div className="mb-5 flex flex-wrap gap-3 text-xs text-stone-400">
          <span className="flex items-center gap-1.5">
            <Clock className="size-3.5" />
            {plan.duration}分
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="size-3.5" />
            {plan.maxAttendees === 1 ? "マンツーマン" : `定員${plan.maxAttendees}名`}
          </span>
        </div>

        {/* CTA */}
        <Button
          asChild
          className={`w-full rounded-full text-sm text-white ${c.btn}`}
        >
          <Link href="/schedule">
            空き枠を確認する
            <ChevronRight className="size-4 ml-1" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

/* ---------- ページ ---------- */
export default async function LessonsPage() {
  const [plans, profile] = await Promise.all([getPlans(), getProfile()]);
  const publishedPlans = plans.filter((p) => p.isPublished);
  const locations = profile.locations ?? [];

  return (
    <main className="section-padding">
      <div className="content-container">
        {/* ヘッダー */}
        <div className="mb-10 text-center">
          <p className="mb-2 text-[11px] tracking-[0.3em] text-stone-400 uppercase">Lesson Plan</p>
          <h1 className="text-2xl font-light tracking-wide text-stone-800 sm:text-3xl">
            レッスンプラン
          </h1>
          <p className="mt-3 text-sm text-stone-500">
            目的やレベルに合わせて選べるプラン
          </p>
        </div>

        {/* プラン一覧 */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mb-16">
          {publishedPlans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </div>

        {/* お支払い方法 */}
        <section className="mb-16">
          <div className="rounded-2xl bg-white p-6 sm:p-8 shadow-sm ring-1 ring-stone-100">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="size-5 text-stone-500" />
              <h2 className="text-base font-semibold text-stone-800">お支払い方法</h2>
            </div>
            <p className="text-xs text-stone-500 mb-3">
              レッスン当日に会場にてお支払いいただきます。銀行振込のみ事前のご対応をお願いいたします。
            </p>
            <div className="flex flex-wrap gap-3">
              {["カード決済（Square）", "現金", "PayPay", "銀行振込"].map((method) => (
                <span
                  key={method}
                  className="inline-flex items-center rounded-full bg-stone-100 px-4 py-1.5 text-sm text-stone-700"
                >
                  {method}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* レッスン場所 */}
        {locations.length > 0 && (
          <section className="mb-16">
            <p className="mb-2 text-center text-[11px] tracking-[0.3em] text-stone-400 uppercase">Location</p>
            <h2 className="mb-8 text-center text-xl font-light tracking-wide text-stone-800 sm:text-2xl">レッスン場所</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {locations.map(({ name, area }) => (
                <div
                  key={name}
                  className="flex items-start gap-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-100"
                >
                  <MapPin className="size-4 text-stone-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-stone-800">{name}</p>
                    <p className="text-xs text-stone-500 mt-0.5">{area}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* オンラインレッスン案内 */}
        <section className="mb-16">
          <div className="rounded-2xl bg-sky-50 p-6 sm:p-8 ring-1 ring-sky-100">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-sky-600">Online Lesson</p>
            <h2 className="mb-3 text-lg font-semibold text-stone-800">体験レッスン ¥1,000 から</h2>
            <p className="mb-4 text-sm leading-relaxed text-stone-600">
              場所や移動時間を気にせず、スマホ1台で受講できるオンラインレッスン。
              スイング動画を撮ってお送りいただくだけで、丁寧にフィードバックします。
            </p>
            <Button asChild size="sm" className="rounded-full bg-sky-500 hover:bg-sky-600 text-white">
              <Link href="/schedule">空き枠を確認する</Link>
            </Button>
          </div>
        </section>

        {/* 予約CTA */}
        <section className="mb-4 text-center">
          <Button
            asChild
            size="lg"
            className="rounded-full bg-stone-800 hover:bg-stone-700 px-8"
          >
            <Link href="/schedule">
              空き枠を確認する
              <ChevronRight className="size-4 ml-1" />
            </Link>
          </Button>
        </section>
      </div>
    </main>
  );
}
