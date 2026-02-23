import type { Metadata } from "next";
import Link from "next/link";
import { Award, MapPin, Clock, Users, CheckCircle2, Instagram, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CustomerHeader } from "@/components/customer/Header";
import { CustomerFooter } from "@/components/customer/Footer";
import type { LessonPlan } from "@/types";

export const metadata: Metadata = {
  title: "奥村真由美ゴルフレッスン | LPGA・TPI認定プロによる個人指導",
  description: "LPGA会員・TPI認定インストラクター奥村真由美プロによる個人ゴルフレッスン。横浜・東京を拠点に、身体の特性に合ったスイング作りをサポートします。",
};

const qualifications = [
  { label: "LPGA（全米女子プロゴルフ協会）メンバー" },
  { label: "Class A ティーチングプロ" },
  { label: "TPI（Titleist Performance Institute）Level 1" },
];

const locations = [
  { name: "golf next24 中川店", area: "横浜", note: "メインスタジオ / ok on golf" },
  { name: "the golf house 京橋八丁堀", area: "東京", note: "メインスタジオ / TrackMan 4" },
  { name: "PGL パーソナルゴルフラウンジ", area: "東京", note: "TrackMan 4" },
];

const features = [
  {
    icon: CheckCircle2,
    title: "ミスの原因が自分でわかる",
    desc: "理論×感覚を大切に。自分で理解できるレッスンで再現性を高めます",
  },
  {
    icon: Users,
    title: "身体・骨格に合ったスイング",
    desc: "TPIに基づき身体の制限・骨格に最適化したスイング作りを指導",
  },
  {
    icon: Clock,
    title: "崩れにくいスイング",
    desc: "力まなくても当たる。年齢が上がっても続けられるスイングを目指します",
  },
];

// レッスンプランをページ内で定義（モックデータを使わず直接記載）
const lessonPlans: (LessonPlan & { details: string[] })[] = [
  {
    id: "plan-private-50",
    name: "プライベートレッスン 50分",
    category: "REGULAR",
    description: "マンツーマンで丁寧に指導。SPORTS BOX AI分析も対応します。",
    price: 13000,
    duration: 50,
    maxAttendees: 1,
    isPublished: true,
    displayOrder: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    details: [
      "golf next24　+¥2,200（80分）",
      "the golf house　+¥5,500（60分）",
      "PGL パーソナルゴルフラウンジ　+¥4,400（55分）",
    ],
  },
  {
    id: "plan-private-80",
    name: "プライベートレッスン 80分",
    category: "REGULAR",
    description: "じっくり時間をかけて課題を深掘り。動画分析も充実しています。",
    price: 18000,
    duration: 80,
    maxAttendees: 1,
    isPublished: true,
    displayOrder: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    details: [
      "チケット購入でお得になります",
      "5回チケット（PGL）¥16,500 → 1回¥3,300",
      "詳しくはお問い合わせください",
    ],
  },
  {
    id: "plan-round",
    name: "ラウンドレッスン",
    category: "ROUND",
    description: "コースを回りながら実戦的なマネジメントを指導。関東圏内対応。",
    price: 17000,
    duration: 240,
    maxAttendees: 3,
    isPublished: true,
    displayOrder: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
    details: [
      "1名 ¥17,000（3名の場合）",
      "1組 ¥50,000（ご友人・お知り合い3名）",
      "別途ラウンド費（プロ料金含む）",
      "ラウンド前後フィードバック・動画撮影あり",
    ],
  },
  {
    id: "plan-online",
    name: "オンラインレッスン",
    category: "REGULAR",
    description: "スマホ1台で受講できるオンラインレッスン。フィードバック付き。",
    price: 3000,
    duration: 25,
    maxAttendees: 1,
    isPublished: true,
    displayOrder: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
    details: [
      "25分 ¥3,000（フィードバックあり）",
      "体験レッスン 25分 ¥1,000",
      "お支払い：現金・銀行振込・PayPay",
    ],
  },
];

function LessonPlanCard({ plan }: { plan: typeof lessonPlans[number] }) {
  const isRound = plan.category === "ROUND";
  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-100 transition-shadow hover:shadow-md">
      <div className={`h-1.5 w-full ${isRound ? "bg-amber-400" : "bg-stone-700"}`} />
      <div className="p-6 sm:p-7">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <Badge
              variant="outline"
              className={`mb-2 text-[10px] ${isRound ? "border-amber-200 bg-amber-50 text-amber-700" : "border-stone-200 bg-stone-50 text-stone-600"}`}
            >
              {isRound ? "ラウンドレッスン" : plan.id === "plan-online" ? "オンライン" : "プライベートレッスン"}
            </Badge>
            <h3 className="text-base font-semibold text-stone-800">{plan.name}</h3>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xl font-light text-stone-800">¥{plan.price.toLocaleString()}</p>
            <p className="text-[11px] text-stone-400">税込</p>
          </div>
        </div>
        {plan.description && (
          <p className="mb-4 text-sm leading-relaxed text-stone-500">{plan.description}</p>
        )}
        <ul className="mb-5 flex flex-col gap-1.5">
          {plan.details.map((d) => (
            <li key={d} className="flex items-start gap-1.5 text-xs text-stone-500">
              <span className="mt-1 size-1 shrink-0 rounded-full bg-stone-300" />
              {d}
            </li>
          ))}
        </ul>
        <div className="mb-5 flex flex-wrap gap-3 text-xs text-stone-400">
          <span className="flex items-center gap-1.5">
            <Clock className="size-3.5" />
            {plan.duration}分
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="size-3.5" />
            定員{plan.maxAttendees}名
          </span>
        </div>
        <Button
          asChild
          className={`w-full rounded-full text-sm ${isRound ? "bg-amber-500 hover:bg-amber-600 text-white" : "bg-stone-800 hover:bg-stone-700 text-white"}`}
        >
          <Link href="/schedule">このプランで予約する</Link>
        </Button>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-stone-50">
      <CustomerHeader />
      <main className="flex-1">

        {/* Hero */}
        <section className="relative overflow-hidden bg-white">
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_#f5f0e8_0%,_transparent_60%)]" />
          <div className="content-container section-padding relative">
            <div className="max-w-xl">
              <p className="mb-4 text-[11px] tracking-[0.3em] text-stone-400 uppercase">Pro Golf Lesson</p>
              <h1 className="mb-6 text-4xl font-light leading-snug tracking-wide text-stone-800 sm:text-5xl">
                美しいスイングで、<br />
                <span className="text-gold">ゴルフをもっと楽しく。</span>
              </h1>
              <p className="mb-10 text-base leading-relaxed text-stone-500">
                LPGA会員・TPI認定インストラクターが、<br className="hidden sm:block" />
                あなたの身体と骨格に合ったスイングを一緒に作ります。
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg" className="rounded-full bg-stone-800 px-8 text-white hover:bg-stone-700">
                  <Link href="/schedule">空き枠を確認する</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-full border-stone-300 px-8 text-stone-700 hover:bg-stone-50">
                  <Link href="/lessons">レッスンプランを見る</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* 3つの特徴 */}
        <section className="section-padding">
          <div className="content-container">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {features.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex flex-col items-center rounded-2xl bg-white p-7 text-center shadow-sm">
                  <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-stone-100">
                    <Icon className="size-5 text-stone-600" />
                  </div>
                  <p className="mb-1.5 text-sm font-semibold text-stone-800">{title}</p>
                  <p className="text-xs leading-relaxed text-stone-500">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* プロフィール */}
        <section className="bg-white section-padding">
          <div className="content-container">
            <p className="mb-2 text-center text-[11px] tracking-[0.3em] text-stone-400 uppercase">Instructor</p>
            <h2 className="mb-12 text-center text-2xl font-light tracking-wide text-stone-800 sm:text-3xl">プロフィール</h2>
            <div className="flex flex-col items-start gap-10 lg:flex-row lg:gap-16">
              {/* アバタープレースホルダー */}
              <div className="mx-auto w-full max-w-[260px] shrink-0 lg:mx-0 lg:w-64">
                <div className="aspect-[3/4] w-full rounded-2xl bg-gradient-to-b from-stone-100 to-stone-200 flex items-end justify-center pb-6">
                  <p className="text-xs text-stone-400">プロフィール写真</p>
                </div>
              </div>
              {/* テキスト */}
              <div className="flex-1 min-w-0">
                <p className="text-[11px] tracking-[0.2em] text-stone-400 uppercase mb-1">Instructor</p>
                <h3 className="text-2xl font-medium text-stone-800 mb-1">奥村 真由美</h3>
                <p className="text-sm text-stone-500 mb-6">Mayumi Okumura</p>
                <p className="text-sm leading-7 text-stone-600 mb-8">
                  LPGA（全米女子プロゴルフ協会）メンバー・TPI Level 1認定インストラクター。
                  TPIに基づき身体の制限・骨格に合ったスイング作りを指導。
                  「理論×感覚」を大切に、自分で理解できるレッスンを提供します。
                  力まなくても当たるスイング、ミスの原因が自分でわかる、崩れにくい・美しいスイングを一緒に目指しましょう。
                  SPORTS BOX AI分析にも対応しています。
                </p>
                {/* 受講で得られること */}
                <div className="mb-8">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-stone-400 mb-3">受講で得られること</p>
                  <ul className="flex flex-col gap-2">
                    {[
                      "力まなくても当たるスイング",
                      "ミスの原因が自分でわかる",
                      "スイングが「崩れにくく」なる",
                      "周りから「綺麗なスイング」と言われる",
                      "年齢が上がっても続けられる",
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-stone-700">
                        <CheckCircle2 className="size-3.5 text-gold shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                {/* 資格 */}
                <div className="mb-8">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-stone-400 mb-3">資格・認定</p>
                  <ul className="flex flex-col gap-2">
                    {qualifications.map(({ label }) => (
                      <li key={label} className="flex items-center gap-2 text-sm text-stone-700">
                        <Award className="size-3.5 text-gold shrink-0" />
                        {label}
                      </li>
                    ))}
                  </ul>
                </div>
                {/* 活動拠点 */}
                <div className="mb-8">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-stone-400 mb-3">活動拠点　YOKOHAMA / TOKYO</p>
                  <ul className="flex flex-col gap-3">
                    {locations.map(({ name, area, note }) => (
                      <li key={name} className="flex items-start gap-2 text-sm">
                        <MapPin className="size-3.5 text-stone-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="font-medium text-stone-700">{name}</p>
                          <p className="text-xs text-stone-500">{area}　{note}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                <a
                  href="https://www.instagram.com/mayumi_golf_pro"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-800 transition-colors"
                >
                  <Instagram className="size-4" />
                  @mayumi_golf_pro
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* レッスンプラン */}
        <section className="section-padding">
          <div className="content-container">
            <p className="mb-2 text-center text-[11px] tracking-[0.3em] text-stone-400 uppercase">Lesson Plan</p>
            <h2 className="mb-4 text-center text-2xl font-light tracking-wide text-stone-800 sm:text-3xl">レッスンプラン</h2>
            <p className="mb-12 text-center text-sm text-stone-400">お支払い：現金 / 銀行振込 / PayPay</p>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {lessonPlans.map((plan) => (
                <LessonPlanCard key={plan.id} plan={plan} />
              ))}
            </div>
            <div className="mt-8 text-center">
              <Button asChild variant="outline" className="rounded-full border-stone-300 px-8">
                <Link href="/lessons" className="flex items-center gap-2">
                  プラン詳細を見る <ChevronRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-stone-800 section-padding">
          <div className="content-container text-center">
            <p className="mb-3 text-[11px] tracking-[0.3em] text-stone-400 uppercase">Book a Lesson</p>
            <h2 className="mb-5 text-2xl font-light tracking-wide text-white sm:text-3xl">まずは体験レッスンから</h2>
            <p className="mb-10 text-sm leading-relaxed text-stone-400">
              オンライン体験レッスン 25分 ¥1,000〜。<br />
              空き枠を確認して、あなたのペースで始めましょう。
            </p>
            <Button asChild size="lg" className="rounded-full bg-white px-10 text-stone-800 hover:bg-stone-100">
              <Link href="/schedule">空き枠を確認する</Link>
            </Button>
          </div>
        </section>
      </main>
      <CustomerFooter />
    </div>
  );
}
