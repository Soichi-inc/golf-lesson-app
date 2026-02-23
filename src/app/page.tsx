import type { Metadata } from "next";
import Link from "next/link";
import { Award, MapPin, Clock, Users, CheckCircle2, Instagram, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CustomerHeader } from "@/components/customer/Header";
import { CustomerFooter } from "@/components/customer/Footer";
import { mockLessonPlans } from "@/lib/mock/data";
import type { LessonPlan } from "@/types";

export const metadata: Metadata = {
  title: "Golf Lesson | プロゴルファーによるレッスン",
  description: "プロゴルファーによる個人レッスン。通常レッスン・ラウンドレッスンをご用意しています。",
};

const qualifications = [
  { label: "JLPGA認定ティーチングプロ A級" },
  { label: "TPI認定インストラクター Lv.2" },
  { label: "ゴルフフィットネスインストラクター" },
];

const locations = [
  { name: "○○ゴルフクラブ", area: "東京都品川区", days: "月・水・金" },
  { name: "△△練習場", area: "神奈川県横浜市", days: "土・日" },
];

const features = [
  { icon: Users, title: "完全マンツーマン", desc: "一人一人の課題に丁寧に向き合います" },
  { icon: Clock, title: "短期間で上達", desc: "効率的なドリルで最短ルートを歩みます" },
  { icon: CheckCircle2, title: "女性専門の指導経験", desc: "女性ならではの悩みを熟知しています" },
];

function LessonPlanCard({ plan }: { plan: LessonPlan }) {
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
              {isRound ? "ラウンドレッスン" : "通常レッスン"}
            </Badge>
            <h3 className="text-base font-semibold text-stone-800">{plan.name}</h3>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xl font-light text-stone-800">¥{plan.price.toLocaleString()}</p>
            <p className="text-[11px] text-stone-400">税込</p>
          </div>
        </div>
        {plan.description && (
          <p className="mb-5 text-sm leading-relaxed text-stone-500">{plan.description}</p>
        )}
        <div className="mb-6 flex flex-wrap gap-3 text-xs text-stone-500">
          <span className="flex items-center gap-1.5">
            <Clock className="size-3.5" />
            {plan.duration >= 60 ? `${plan.duration / 60}時間` : `${plan.duration}分`}
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
  const publishedPlans = mockLessonPlans.filter((p) => p.isPublished);

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
                あなたのゴルフを、<br />
                <span className="text-gold">次のステージ</span>へ。
              </h1>
              <p className="mb-10 text-base leading-relaxed text-stone-500">
                プロゴルファーによる丁寧な個人指導で、<br className="hidden sm:block" />
                確かな技術と、コースで輝く自信を身につけましょう。
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

        {/* 3つの強み */}
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
                <p className="text-[11px] tracking-[0.2em] text-stone-400 uppercase mb-1">Name</p>
                <h3 className="text-2xl font-medium text-stone-800 mb-1">山田 花子</h3>
                <p className="text-sm text-stone-500 mb-6">Hanako Yamada</p>
                <p className="text-sm leading-7 text-stone-600 mb-8">
                  学生時代からゴルフを始め、プロ転向後は国内女子ツアーで活躍。引退後は「ゴルフをもっと多くの人に楽しんでほしい」という思いでティーチングプロに転身。特に女性ゴルファーの悩みに寄り添い、スイングの基礎からコースマネジメントまで、丁寧に指導することをモットーとしています。
                </p>
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
                <div className="mb-8">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-stone-400 mb-3">活動拠点</p>
                  <ul className="flex flex-col gap-3">
                    {locations.map(({ name, area, days }) => (
                      <li key={name} className="flex items-start gap-2 text-sm">
                        <MapPin className="size-3.5 text-stone-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="font-medium text-stone-700">{name}</p>
                          <p className="text-xs text-stone-500">{area}　{days}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-800 transition-colors">
                  <Instagram className="size-4" />
                  @pro_golf_hanako
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* レッスンプラン */}
        <section className="section-padding">
          <div className="content-container">
            <p className="mb-2 text-center text-[11px] tracking-[0.3em] text-stone-400 uppercase">Lesson Plan</p>
            <h2 className="mb-12 text-center text-2xl font-light tracking-wide text-stone-800 sm:text-3xl">レッスンプラン</h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {publishedPlans.map((plan) => (
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
            <h2 className="mb-5 text-2xl font-light tracking-wide text-white sm:text-3xl">まずは1回、体験してみませんか？</h2>
            <p className="mb-10 text-sm leading-relaxed text-stone-400">今すぐ空き枠を確認して、あなたのペースでレッスンを始めましょう。</p>
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
