import type { Metadata } from "next";
import Link from "next/link";
import { Clock, Users, CheckCircle2, MapPin, ChevronRight, CreditCard, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "レッスンプラン",
  description: "奥村真由美プロのゴルフレッスンプラン一覧。プライベートレッスン・ラウンドレッスン・オンラインレッスンをご用意しています。",
};

/* ---------- プランデータ ---------- */
type Plan = {
  id: string;
  name: string;
  category: "REGULAR" | "ROUND" | "ONLINE";
  tagLabel: string;
  description: string;
  price: number;
  priceNote?: string;
  duration: number;
  maxAttendees: number;
  details: string[];
  highlights?: string[];
};

const plans: Plan[] = [
  {
    id: "plan-private-50",
    name: "プライベートレッスン 50分",
    category: "REGULAR",
    tagLabel: "プライベートレッスン",
    description: "マンツーマンで丁寧に指導。SPORTS BOX AI分析も対応します。",
    price: 13000,
    duration: 50,
    maxAttendees: 1,
    details: [
      "golf next24　+¥2,200（80分）",
      "the golf house　+¥5,500（60分）",
      "PGL パーソナルゴルフラウンジ　+¥4,400（55分）",
    ],
    highlights: [
      "スイングの課題を分析・改善",
      "TrackMan / SPORTS BOX AI 分析対応",
      "動画撮影＆フィードバック付き",
    ],
  },
  {
    id: "plan-private-80",
    name: "プライベートレッスン 80分",
    category: "REGULAR",
    tagLabel: "プライベートレッスン",
    description: "じっくり時間をかけて課題を深掘り。動画分析も充実しています。",
    price: 18000,
    duration: 80,
    maxAttendees: 1,
    details: [
      "チケット購入でお得になります",
      "5回チケット（PGL）¥16,500 → 1回¥3,300",
      "詳しくはお問い合わせください",
    ],
    highlights: [
      "50分プランよりじっくり取り組める",
      "複数の課題を1回で深掘り可能",
      "チケット購入でさらにお得",
    ],
  },
  {
    id: "plan-round",
    name: "ラウンドレッスン",
    category: "ROUND",
    tagLabel: "ラウンドレッスン",
    description: "コースを回りながら実戦的なマネジメントを指導。関東圏内対応。",
    price: 17000,
    priceNote: "1名あたり（3名の場合）",
    duration: 240,
    maxAttendees: 3,
    details: [
      "1名 ¥17,000（3名の場合）",
      "1組 ¥50,000（ご友人・お知り合い3名）",
      "別途ラウンド費（プロ料金含む）",
      "ラウンド前後フィードバック・動画撮影あり",
    ],
    highlights: [
      "コースマネジメントを実践で学ぶ",
      "ラウンド前後にフィードバック",
      "動画撮影でフォーム確認",
    ],
  },
  {
    id: "plan-online",
    name: "オンラインレッスン",
    category: "ONLINE",
    tagLabel: "オンライン",
    description: "スマホ1台で受講できるオンラインレッスン。フィードバック付き。",
    price: 3000,
    duration: 25,
    maxAttendees: 1,
    details: [
      "25分 ¥3,000（フィードバックあり）",
      "体験レッスン 25分 ¥1,000",
      "お支払い：現金・銀行振込・PayPay",
    ],
    highlights: [
      "場所を選ばずどこからでも受講可能",
      "体験レッスン ¥1,000 で気軽にお試し",
      "スイング動画を送るだけでOK",
    ],
  },
];

const locations = [
  { name: "golf next24 中川店", area: "横浜", note: "メインスタジオ / ok on golf" },
  { name: "the golf house 京橋八丁堀", area: "東京", note: "メインスタジオ / TrackMan 4" },
  { name: "PGL パーソナルゴルフラウンジ", area: "東京", note: "TrackMan 4" },
];

/* ---------- カードコンポーネント ---------- */
function PlanCard({ plan }: { plan: Plan }) {
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
            <p className="text-2xl font-light text-stone-800">¥{plan.price.toLocaleString()}</p>
            <p className="text-[11px] text-stone-400">{plan.priceNote ?? "税込"}</p>
          </div>
        </div>

        {/* 説明 */}
        <p className="mb-5 text-sm leading-relaxed text-stone-500">{plan.description}</p>

        {/* ハイライト */}
        {plan.highlights && (
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
export default function LessonsPage() {
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
            目的やレベルに合わせて選べる4つのプラン
          </p>
        </div>

        {/* プラン一覧 */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mb-16">
          {plans.map((plan) => (
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
            <div className="flex flex-wrap gap-3">
              {["現金", "銀行振込", "PayPay"].map((method) => (
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
        <section className="mb-16">
          <p className="mb-2 text-center text-[11px] tracking-[0.3em] text-stone-400 uppercase">Location</p>
          <h2 className="mb-8 text-center text-xl font-light tracking-wide text-stone-800 sm:text-2xl">レッスン場所</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {locations.map(({ name, area, note }) => (
              <div
                key={name}
                className="flex items-start gap-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-100"
              >
                <MapPin className="size-4 text-stone-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-stone-800">{name}</p>
                  <p className="text-xs text-stone-500 mt-0.5">{area}</p>
                  <p className="text-[11px] text-stone-400 mt-0.5">{note}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* オンラインレッスン案内 */}
        <section className="mb-16">
          <div className="rounded-2xl bg-sky-50 p-6 sm:p-8 ring-1 ring-sky-100">
            <div className="flex items-center gap-2 mb-3">
              <Smartphone className="size-5 text-sky-500" />
              <h2 className="text-base font-semibold text-stone-800">はじめての方へ</h2>
            </div>
            <p className="text-sm text-stone-600 leading-relaxed mb-4">
              「まずは試してみたい」という方には、オンライン体験レッスン（25分 ¥1,000）がおすすめです。
              スマホ1台でどこからでも受講いただけます。
            </p>
            <Button
              asChild
              className="rounded-full bg-sky-500 hover:bg-sky-600 text-white text-sm"
            >
              <Link href="/schedule">
                体験レッスンを予約する
                <ChevronRight className="size-4 ml-1" />
              </Link>
            </Button>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center">
          <div className="rounded-2xl bg-stone-800 p-8 sm:p-12">
            <p className="mb-3 text-[11px] tracking-[0.3em] text-stone-400 uppercase">Book a Lesson</p>
            <h2 className="mb-4 text-xl font-light tracking-wide text-white sm:text-2xl">
              レッスンを予約する
            </h2>
            <p className="mb-8 text-sm text-stone-400">
              カレンダーから空き枠を選んで、簡単に予約できます
            </p>
            <Button
              asChild
              size="lg"
              className="rounded-full bg-white px-10 text-stone-800 hover:bg-stone-100"
            >
              <Link href="/schedule">空き枠を確認する</Link>
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
}
