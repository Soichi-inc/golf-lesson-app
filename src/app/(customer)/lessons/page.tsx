import type { Metadata } from "next";
import Link from "next/link";
import { Clock, Users, CheckCircle2, MapPin, ChevronRight, CreditCard, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getPlans, type PlanData } from "@/app/actions/plans";
import { getProfile } from "@/app/actions/profile";

export const metadata: Metadata = {
  title: "レッスンプラン",
  description: "奥村真由美プロのゴルフレッスンプラン一覧。インドアレッスン・ラウンドレッスン・オンラインレッスンをご用意しています。",
};

export const dynamic = "force-dynamic";

/** 公式LINE（お問い合わせ・場所リクエスト・オンライン日程調整の窓口） */
const LINE_OFFICIAL_URL = "https://lin.ee/UP2gfpv";

/* ---------- インドアプラン料金表（管理画面の値と統一） ---------- */
type IndoorRow = {
  facility: string;
  duration: number; // 50 or 70
  single: number;
  packageTotal: number;
  packageUnit: number;
  locations: string;
  highlight?: boolean;
};

const indoorRows: IndoorRow[] = [
  {
    facility: "THE GOLF HOUSE",
    duration: 50,
    single: 20000,
    packageTotal: 72000,
    packageUnit: 18000,
    locations: "京橋・白金高輪・武蔵小山",
  },
  {
    facility: "GOLF NEXT24",
    duration: 50,
    single: 17000,
    packageTotal: 64000,
    packageUnit: 16000,
    locations: "中川・武蔵中原・藤沢善行",
  },
  {
    facility: "GOLF NEXT24",
    duration: 70,
    single: 23000,
    packageTotal: 86000,
    packageUnit: 21500,
    locations: "中川・武蔵中原・藤沢善行",
  },
  {
    facility: "任意の場所",
    duration: 50,
    single: 15500,
    packageTotal: 56000,
    packageUnit: 14000,
    locations: "ご希望の場所（要相談）",
    highlight: true,
  },
  {
    facility: "任意の場所",
    duration: 70,
    single: 21000,
    packageTotal: 80000,
    packageUnit: 20000,
    locations: "ご希望の場所（要相談）",
    highlight: true,
  },
];

/* ---------- インドアレッスン専用カード（料金表） ---------- */
function IndoorLessonCard() {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-100">
      <div className="h-1.5 w-full bg-stone-700" />
      <div className="p-6 sm:p-8">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <Badge variant="outline" className="mb-2 text-[10px] border-stone-200 bg-stone-50 text-stone-600">
              インドアレッスン
            </Badge>
            <h3 className="text-xl font-semibold text-stone-800">マンツーマン プライベートレッスン</h3>
            <p className="mt-2 text-sm text-stone-500 leading-relaxed">
              スイングの課題を分析・改善。TrackMan / SPORTS BOX AI 対応。動画撮影＆フィードバック付き。
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-light text-stone-800">
              ¥15,500<span className="text-base text-stone-500">〜</span>
            </p>
            <p className="text-[11px] text-stone-400">50分〜（税込）</p>
          </div>
        </div>

        <ul className="mb-5 flex flex-wrap gap-x-4 gap-y-1.5">
          {[
            "TrackMan / SPORTS BOX AI 対応",
            "動画撮影＆フィードバック付き",
            "4回チケットでお得",
          ].map((h) => (
            <li key={h} className="flex items-center gap-1.5 text-xs text-stone-600">
              <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
              {h}
            </li>
          ))}
        </ul>

        {/* PCテーブル */}
        <div className="rounded-xl border border-stone-200 overflow-hidden">
          <div className="hidden sm:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200">
                  <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-widest text-stone-500">プラン</th>
                  <th className="text-right px-4 py-2.5 text-[11px] font-semibold uppercase tracking-widest text-stone-500">単発</th>
                  <th className="text-right px-4 py-2.5 text-[11px] font-semibold uppercase tracking-widest text-stone-500">4回チケット</th>
                  <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-widest text-stone-500">場所</th>
                </tr>
              </thead>
              <tbody>
                {indoorRows.map((row, i) => (
                  <tr
                    key={`${row.facility}-${row.duration}`}
                    className={`${i !== indoorRows.length - 1 ? "border-b border-stone-100" : ""} ${
                      row.highlight ? "bg-amber-50/40" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-stone-800">
                        {row.facility} {row.duration}分
                      </p>
                      {row.highlight && (
                        <span className="inline-block mt-0.5 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                          リクエスト可
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-stone-700 tabular-nums">
                      ¥{row.single.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      <p className="text-stone-700">¥{row.packageTotal.toLocaleString()}</p>
                      <p className="text-[11px] text-emerald-600">¥{row.packageUnit.toLocaleString()}/回</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-stone-500">
                      <span className="inline-flex items-start gap-1">
                        <MapPin className="size-3 text-stone-400 mt-0.5 shrink-0" />
                        {row.locations}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* SP: カード */}
          <div className="sm:hidden divide-y divide-stone-100">
            {indoorRows.map((row) => (
              <div
                key={`${row.facility}-${row.duration}-sp`}
                className={`p-4 ${row.highlight ? "bg-amber-50/40" : ""}`}
              >
                <div className="mb-2">
                  <p className="text-sm font-semibold text-stone-800">
                    {row.facility} {row.duration}分
                  </p>
                  {row.highlight && (
                    <span className="inline-block mt-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                      リクエスト可
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 mb-2 text-xs">
                  <div className="rounded bg-stone-50 p-2">
                    <p className="text-[10px] text-stone-400 uppercase tracking-wider mb-0.5">単発</p>
                    <p className="text-sm text-stone-800 tabular-nums">¥{row.single.toLocaleString()}</p>
                  </div>
                  <div className="rounded bg-emerald-50/60 p-2">
                    <p className="text-[10px] text-emerald-700 uppercase tracking-wider mb-0.5">4回チケット</p>
                    <p className="text-sm text-stone-800 tabular-nums">¥{row.packageTotal.toLocaleString()}</p>
                    <p className="text-[10px] text-emerald-600 tabular-nums">¥{row.packageUnit.toLocaleString()}/回</p>
                  </div>
                </div>
                <p className="text-[11px] text-stone-500 flex items-start gap-1">
                  <MapPin className="size-3 text-stone-400 mt-0.5 shrink-0" />
                  {row.locations}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 任意の場所の補足 */}
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/40 p-4">
          <div className="flex items-start gap-2">
            <MessageCircle className="size-4 text-amber-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-stone-800 mb-1">上記以外の場所でも受講可能</p>
              <p className="text-xs text-stone-600 leading-relaxed">
                ご希望の練習場・スタジオでもレッスンを承ります（任意の場所枠）。
                まずはLINEまたは予約フォームよりご相談ください。
              </p>
            </div>
            <Button asChild size="sm" className="rounded-full bg-[#06C755] hover:bg-[#05b04c] text-white text-xs gap-1 shrink-0">
              <Link href={LINE_OFFICIAL_URL} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="size-3.5" />
                LINE相談
              </Link>
            </Button>
          </div>
        </div>

        <Button asChild className="mt-5 w-full rounded-full bg-stone-800 hover:bg-stone-700 text-white text-sm">
          <Link href="/schedule">
            空き枠を確認する
            <ChevronRight className="size-4 ml-1" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

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

        {/* メタ（ラウンドはコースにより所要時間が変わるため分数を出さない） */}
        <div className="mb-5 flex flex-wrap gap-3 text-xs text-stone-400">
          {plan.duration > 0 && plan.category !== "ROUND" && (
            <span className="flex items-center gap-1.5">
              <Clock className="size-3.5" />
              {plan.duration}分
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Users className="size-3.5" />
            {plan.maxAttendees === 1 ? "マンツーマン" : `定員${plan.maxAttendees}名`}
          </span>
        </div>

        {/* CTA: オンライン系は日程をLINEで調整するため、予約導線ではなくLINE誘導 */}
        {plan.category === "ONLINE" ? (
          <>
            <p className="mb-3 text-center text-xs text-stone-500">
              日程はLINEにてお問い合わせください
            </p>
            <Button
              asChild
              className="w-full rounded-full bg-[#06C755] hover:bg-[#05b04c] text-sm text-white gap-1.5"
            >
              <Link href={LINE_OFFICIAL_URL} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="size-4" />
                LINEにてお問い合わせ
              </Link>
            </Button>
          </>
        ) : (
          <Button
            asChild
            className={`w-full rounded-full text-sm text-white ${c.btn}`}
          >
            <Link href="/schedule">
              空き枠を確認する
              <ChevronRight className="size-4 ml-1" />
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}

/* ---------- ページ ---------- */
export default async function LessonsPage() {
  const [plans, profile] = await Promise.all([getPlans(), getProfile()]);
  // インドア(REGULAR)は固定の料金表で表示するため、動的プラン一覧からは除外
  const publishedPlans = plans.filter((p) => p.isPublished && p.category !== "REGULAR");
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

        {/* インドアレッスン（料金表） */}
        <div className="mb-6">
          <IndoorLessonCard />
        </div>

        {/* その他のプラン（ラウンド・オンライン） */}
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
            <h2 className="mb-3 text-lg font-semibold text-stone-800">ワンポイントアドバイス ¥1,500 から</h2>
            <p className="mb-4 text-sm leading-relaxed text-stone-600">
              場所や移動時間を気にせず、スマホ1台で受講できるオンラインレッスン。
              スイング動画を撮ってお送りいただくだけで、丁寧にフィードバックします。
              日程はLINEにてお問い合わせください。
            </p>
            <Button
              asChild
              size="sm"
              className="rounded-full bg-[#06C755] hover:bg-[#05b04c] text-white gap-1.5"
            >
              <Link href={LINE_OFFICIAL_URL} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="size-3.5" />
                LINEにてお問い合わせ
              </Link>
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
