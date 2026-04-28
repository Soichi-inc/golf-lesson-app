import type { Metadata } from "next";
import Link from "next/link";
import { Award, MapPin, Clock, Users, CheckCircle2, Instagram, ChevronRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomerHeader } from "@/components/customer/Header";
import { CustomerFooter } from "@/components/customer/Footer";
import { HeroVideo } from "@/components/customer/HeroVideo";
import { AnimatedSection } from "@/components/customer/AnimatedSection";
import { getPlans, type PlanData } from "@/app/actions/plans";
import { getProfile } from "@/app/actions/profile";

export const metadata: Metadata = {
  title: "奥村真由美ゴルフレッスン | LPGA・TPI認定プロによる個人指導",
  description: "LPGA会員・TPI認定インストラクター奥村真由美プロによる個人ゴルフレッスン。横浜・東京を拠点に、身体の特性に合ったスイング作りをサポートします。",
};

export const dynamic = "force-dynamic";

const qualifications = [
  { label: "LPGA（全米女子プロゴルフ協会）メンバー" },
  { label: "Class A ティーチングプロ" },
  { label: "TPI（Titleist Performance Institute）Level 1" },
];

const features = [
  {
    icon: CheckCircle2,
    title: "ミスの原因が自分でわかる",
    desc: "理論×感覚を大切に。自分で理解できるレッスンで再現性を高めます",
    num: "01",
  },
  {
    icon: Users,
    title: "身体・骨格に合ったスイング",
    desc: "TPIに基づき身体の制限・骨格に最適化したスイング作りを指導",
    num: "02",
  },
  {
    icon: Clock,
    title: "崩れにくいスイング",
    desc: "力まなくても当たる。年齢が上がっても続けられるスイングを目指します",
    num: "03",
  },
];

function LessonPlanCard({ plan, index }: { plan: PlanData; index: number }) {
  const isRound = plan.category === "ROUND";
  return (
    <AnimatedSection delay={index * 0.15} className="group">
      <div className="relative overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-200/60 transition-all duration-500 hover:shadow-xl hover:shadow-stone-200/50 hover:-translate-y-1">
        {/* Top accent */}
        <div className={`h-[2px] w-full ${isRound ? "bg-gradient-to-r from-amber-300 via-amber-400 to-amber-300" : "bg-gradient-to-r from-stone-300 via-stone-800 to-stone-300"}`} />
        <div className="p-7 sm:p-8">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <span className={`mb-2 inline-block text-[10px] font-medium tracking-widest uppercase ${isRound ? "text-amber-600" : plan.id === "plan-online" ? "text-blue-600" : "text-stone-400"}`}>
                {isRound ? "Round Lesson" : plan.id === "plan-online" ? "Online" : "Private Lesson"}
              </span>
              <h3 className="text-lg font-medium tracking-wide text-stone-800">{plan.name}</h3>
            </div>
            <div className="text-right shrink-0">
              <p className="text-2xl font-extralight text-stone-800">¥{plan.price.toLocaleString()}</p>
              <p className="text-[10px] tracking-wider text-stone-400">税込</p>
            </div>
          </div>
          {plan.description && (
            <p className="mb-5 text-sm leading-relaxed text-stone-500">{plan.description}</p>
          )}
          <ul className="mb-6 flex flex-col gap-2">
            {plan.details.map((d) => (
              <li key={d} className="flex items-start gap-2 text-xs text-stone-500">
                <span className="mt-1.5 size-1 shrink-0 rounded-full bg-[#b8945f]" />
                {d}
              </li>
            ))}
          </ul>
          <div className="mb-6 flex flex-wrap gap-3 text-xs text-stone-400">
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
            className={`w-full rounded-full text-sm font-light tracking-wider transition-all duration-500 ${
              isRound
                ? "bg-amber-500 hover:bg-amber-600 text-white hover:shadow-lg hover:shadow-amber-200/50"
                : "bg-stone-800 hover:bg-stone-700 text-white hover:shadow-lg hover:shadow-stone-300/50"
            }`}
          >
            <Link href="/schedule">このプランで予約する</Link>
          </Button>
        </div>
      </div>
    </AnimatedSection>
  );
}

export default async function HomePage() {
  const [plans, profile] = await Promise.all([getPlans(), getProfile()]);
  const lessonPlans = plans.filter((p) => p.isPublished);
  const locations = profile.locations ?? [];

  return (
    <div className="flex min-h-screen flex-col bg-stone-50">
      <CustomerHeader />

      <main className="flex-1">

        {/* ========== Hero with Video ========== */}
        <HeroVideo />

        {/* ========== Philosophy / 3 Features ========== */}
        <section className="relative overflow-hidden bg-white py-24 sm:py-32 lg:py-40">
          {/* Decorative background */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-gradient-to-b from-stone-50 to-transparent opacity-60 blur-3xl" />

          <div className="content-container relative px-4">
            <AnimatedSection>
              <p className="mb-3 text-center text-[10px] font-medium tracking-[0.5em] text-[#b8945f] uppercase">Philosophy</p>
              <h2 className="mb-4 text-center text-3xl font-extralight tracking-wider text-stone-800 sm:text-4xl">
                あなたのための<span className="text-[#b8945f]">スイング</span>を。
              </h2>
              <div className="mx-auto mb-16 h-[1px] w-12 bg-[#b8945f]/40 sm:mb-20" />
            </AnimatedSection>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-8">
              {features.map(({ icon: Icon, title, desc, num }, i) => (
                <AnimatedSection key={title} delay={i * 0.2}>
                  <div className="group relative px-2 py-8 text-center sm:px-4">
                    {/* Number watermark */}
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 text-[80px] font-extralight leading-none text-stone-100 transition-colors duration-500 group-hover:text-[#b8945f]/10 select-none">
                      {num}
                    </span>
                    <div className="relative">
                      <div className="mx-auto mb-6 flex size-14 items-center justify-center rounded-full border border-stone-200 transition-all duration-500 group-hover:border-[#b8945f]/40 group-hover:bg-[#b8945f]/5">
                        <Icon className="size-5 text-stone-500 transition-colors duration-500 group-hover:text-[#b8945f]" />
                      </div>
                      <p className="mb-3 text-base font-medium tracking-wide text-stone-800">{title}</p>
                      <p className="text-sm leading-relaxed text-stone-500">{desc}</p>
                    </div>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        {/* ========== Lesson Gallery ========== */}
        <section className="relative overflow-hidden bg-stone-900 py-24 sm:py-32">
          <div className="content-container relative px-4">
            <AnimatedSection>
              <p className="mb-3 text-center text-[10px] font-medium tracking-[0.5em] text-[#b8945f] uppercase">Lesson Scene</p>
              <h2 className="mb-4 text-center text-3xl font-extralight tracking-wider text-white sm:text-4xl">レッスン風景</h2>
              <p className="mx-auto mb-6 max-w-lg text-center text-sm font-light leading-relaxed text-white/50">
                韓国で学んでいる美スイングを、皆様に丁寧にお伝えします。
              </p>
              <div className="mx-auto mb-16 h-[1px] w-12 bg-[#b8945f]/40 sm:mb-20" />
            </AnimatedSection>

            {/* Masonry-style grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
              {[
                { src: "/lesson-1.jpg", alt: "レッスン風景", span: "sm:col-span-2 sm:row-span-2" },
                { src: "/lesson-2.jpg", alt: "スイング指導", span: "" },
                { src: "/lesson-3.jpg", alt: "フォーム確認", span: "" },
                { src: "/lesson-4.jpg", alt: "スイング練習", span: "col-span-2 sm:col-span-1" },
                { src: "/lesson-5.jpg", alt: "スタジオレッスン", span: "col-span-2 sm:col-span-1" },
              ].map((img, i) => (
                <AnimatedSection key={img.src} delay={i * 0.1} className={`${img.span}`}>
                  <div className="group relative overflow-hidden rounded-xl aspect-[3/4] sm:aspect-auto sm:h-full min-h-[200px]">
                    <img
                      src={img.src}
                      alt={img.alt}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/10 transition-all duration-500 group-hover:bg-black/0" />
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        {/* ========== Profile ========== */}
        <section className="relative overflow-hidden bg-stone-900 py-24 sm:py-32 lg:py-40">
          {/* Subtle radial glow */}
          <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#b8945f]/5 blur-[120px]" />

          <div className="content-container relative px-4">
            <div className="flex flex-col items-center gap-16 lg:flex-row lg:gap-20">
              {/* Profile photo */}
              <AnimatedSection direction="left" className="mx-auto w-full max-w-[300px] shrink-0 lg:mx-0 lg:w-72">
                <div className="relative">
                  <div className="absolute -inset-3 rounded-2xl bg-gradient-to-br from-[#b8945f]/20 to-transparent blur-xl" />
                  <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl ring-1 ring-white/10">
                    <img
                      src="/mayumi.jpg"
                      alt="奥村真由美プロ"
                      className="h-full w-full object-cover object-top"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-900/40 to-transparent" />
                  </div>
                </div>
              </AnimatedSection>

              {/* Text */}
              <AnimatedSection direction="right" className="flex-1 min-w-0">
                <p className="mb-1 text-[10px] font-medium tracking-[0.5em] text-[#b8945f] uppercase">Instructor</p>
                <h3 className="mb-1 text-3xl font-extralight tracking-wider text-white sm:text-4xl">奥村 真由美</h3>
                <p className="mb-8 text-sm font-light tracking-wider text-white/40">Mayumi Okumura</p>

                <p className="mb-10 text-sm leading-8 text-white/60">
                  LPGA（全米女子プロゴルフ協会）メンバー・TPI Level 1認定インストラクター。
                  TPIに基づき身体の制限・骨格に合ったスイング作りを指導。
                  「理論×感覚」を大切に、自分で理解できるレッスンを提供します。
                  力まなくても当たるスイング、ミスの原因が自分でわかる、崩れにくい・美しいスイングを一緒に目指しましょう。
                </p>

                {/* Benefits */}
                <div className="mb-10">
                  <p className="mb-4 text-[10px] font-medium tracking-[0.4em] text-white/30 uppercase">What You&apos;ll Gain</p>
                  <ul className="flex flex-col gap-3">
                    {[
                      "力まなくても当たるスイング",
                      "ミスの原因が自分でわかる",
                      "スイングが「崩れにくく」なる",
                      "周りから「綺麗なスイング」と言われる",
                      "年齢が上がっても続けられる",
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-3 text-sm text-white/70">
                        <CheckCircle2 className="size-4 text-[#b8945f] shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Qualifications */}
                <div className="mb-10">
                  <p className="mb-4 text-[10px] font-medium tracking-[0.4em] text-white/30 uppercase">Qualifications</p>
                  <ul className="flex flex-col gap-3">
                    {qualifications.map(({ label }) => (
                      <li key={label} className="flex items-center gap-3 text-sm text-white/70">
                        <Award className="size-4 text-[#b8945f] shrink-0" />
                        {label}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Locations */}
                {locations.length > 0 && (
                  <div className="mb-10">
                    <p className="mb-4 text-[10px] font-medium tracking-[0.4em] text-white/30 uppercase">Locations — Yokohama / Tokyo</p>
                    <ul className="flex flex-col gap-4">
                      {locations.map(({ name, area }) => (
                        <li key={name} className="flex items-start gap-3 text-sm">
                          <MapPin className="size-4 text-white/30 mt-0.5 shrink-0" />
                          <div>
                            <p className="font-medium text-white/80">{name}</p>
                            <p className="text-xs text-white/40">{area}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <a
                  href="https://www.instagram.com/mayumi_gf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-white/40 transition-colors duration-300 hover:text-[#b8945f]"
                >
                  <Instagram className="size-4" />
                  @mayumi_gf
                </a>
              </AnimatedSection>
            </div>
          </div>
        </section>

        {/* ========== Lesson Plans ========== */}
        <section className="relative overflow-hidden py-24 sm:py-32 lg:py-40">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-[#b8945f]/5 blur-[100px]" />

          <div className="content-container relative px-4">
            <AnimatedSection>
              <p className="mb-3 text-center text-[10px] font-medium tracking-[0.5em] text-[#b8945f] uppercase">Lesson Plan</p>
              <h2 className="mb-4 text-center text-3xl font-extralight tracking-wider text-stone-800 sm:text-4xl">レッスンプラン</h2>
              <p className="mb-6 text-center text-sm font-light text-stone-400">お支払い：当日会場にて カード決済（Square）/ 現金 / PayPay / 銀行振込</p>
              <div className="mx-auto mb-16 h-[1px] w-12 bg-[#b8945f]/40 sm:mb-20" />
            </AnimatedSection>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {lessonPlans.map((plan, i) => (
                <LessonPlanCard key={plan.id} plan={plan} index={i} />
              ))}
            </div>

            <AnimatedSection delay={0.5} className="mt-12 text-center">
              <Button asChild variant="outline" className="rounded-full border-stone-300 px-8 text-sm font-light tracking-wider transition-all duration-500 hover:border-[#b8945f] hover:text-[#b8945f]">
                <Link href="/lessons" className="flex items-center gap-2">
                  プラン詳細を見る <ChevronRight className="size-4" />
                </Link>
              </Button>
            </AnimatedSection>
          </div>
        </section>

        {/* ========== CTA ========== */}
        <section className="relative overflow-hidden bg-stone-800 py-24 sm:py-32">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
              backgroundSize: "40px 40px",
            }}
          />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-[#b8945f]/5 blur-[100px]" />

          <div className="content-container relative px-4 text-center">
            <AnimatedSection>
              <p className="mb-4 text-[10px] font-medium tracking-[0.5em] text-[#b8945f] uppercase">Book a Lesson</p>
              <h2 className="mb-6 text-3xl font-extralight tracking-wider text-white sm:text-4xl">
                まずは体験レッスンから
              </h2>
              <p className="mx-auto mb-12 max-w-md text-sm font-light leading-relaxed text-stone-400">
                オンライン体験レッスン 25分 ¥1,000〜。
                <br />
                空き枠を確認して、あなたのペースで始めましょう。
              </p>
              <Link
                href="/schedule"
                className="group inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-10 py-4 text-sm font-light tracking-wider text-white backdrop-blur-sm transition-all duration-500 hover:border-[#b8945f] hover:bg-[#b8945f]/20 hover:shadow-lg hover:shadow-[#b8945f]/10"
              >
                空き枠を確認する
                <ChevronRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </AnimatedSection>
          </div>
        </section>
      </main>
      <CustomerFooter />
    </div>
  );
}
