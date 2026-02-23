import type { Metadata } from "next";
import {
  Clock,
  Users,
  CheckCircle2,
  DollarSign,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "レッスンプラン管理",
};

/* 現在のプランデータ（将来はDB連携） */
type Plan = {
  id: string;
  name: string;
  category: "REGULAR" | "ROUND" | "ONLINE";
  tagLabel: string;
  price: number;
  priceNote?: string;
  duration: number;
  maxAttendees: number;
  isPublished: boolean;
  details: string[];
};

const plans: Plan[] = [
  {
    id: "plan-private-50",
    name: "プライベートレッスン 50分",
    category: "REGULAR",
    tagLabel: "インドア",
    price: 13000,
    duration: 50,
    maxAttendees: 1,
    isPublished: true,
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
    tagLabel: "インドア",
    price: 18000,
    duration: 80,
    maxAttendees: 1,
    isPublished: true,
    details: [
      "チケット購入でお得",
      "5回チケット（PGL）¥16,500 → 1回¥3,300",
    ],
  },
  {
    id: "plan-round",
    name: "ラウンドレッスン",
    category: "ROUND",
    tagLabel: "ラウンド",
    price: 17000,
    priceNote: "1名あたり（3名の場合）",
    duration: 240,
    maxAttendees: 3,
    isPublished: true,
    details: [
      "1名 ¥17,000（3名の場合）",
      "1組 ¥50,000（ご友人・お知り合い3名）",
      "別途ラウンド費（プロ料金含む）",
    ],
  },
  {
    id: "plan-online",
    name: "オンラインレッスン",
    category: "ONLINE",
    tagLabel: "オンライン",
    price: 3000,
    duration: 25,
    maxAttendees: 1,
    isPublished: true,
    details: [
      "25分 ¥3,000（フィードバックあり）",
      "体験レッスン 25分 ¥1,000",
    ],
  },
];

const colorMap: Record<string, { badge: string; bar: string }> = {
  REGULAR: { badge: "border-stone-200 bg-stone-50 text-stone-600", bar: "bg-stone-700" },
  ROUND: { badge: "border-amber-200 bg-amber-50 text-amber-700", bar: "bg-amber-400" },
  ONLINE: { badge: "border-sky-200 bg-sky-50 text-sky-700", bar: "bg-sky-400" },
};

export default function AdminContentPlansPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-light tracking-wide mb-1">
          レッスンプラン管理
        </h1>
        <p className="text-sm text-stone-500">
          公開されているレッスンプランの一覧です
        </p>
      </div>

      {/* サマリー */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-stone-100 text-center">
          <p className="text-2xl font-light text-stone-800">{plans.length}</p>
          <p className="text-xs text-stone-500 mt-1">プラン数</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-stone-100 text-center">
          <p className="text-2xl font-light text-stone-800">
            {plans.filter((p) => p.isPublished).length}
          </p>
          <p className="text-xs text-stone-500 mt-1">公開中</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-stone-100 text-center">
          <p className="text-2xl font-light text-stone-800">
            {new Set(plans.map((p) => p.category)).size}
          </p>
          <p className="text-xs text-stone-500 mt-1">カテゴリ数</p>
        </div>
      </div>

      {/* プラン一覧 */}
      <div className="space-y-4">
        {plans.map((plan) => {
          const c = colorMap[plan.category];
          return (
            <div
              key={plan.id}
              className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-100"
            >
              <div className={`h-1 w-full ${c.bar}`} />
              <div className="p-5">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Badge variant="outline" className={`text-[10px] ${c.badge}`}>
                        {plan.tagLabel}
                      </Badge>
                      {plan.isPublished ? (
                        <Badge className="bg-green-50 text-green-600 border border-green-200 text-[10px]">
                          <CheckCircle2 className="size-3 mr-0.5" />
                          公開中
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-stone-400 text-[10px]">
                          非公開
                        </Badge>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-stone-800">
                      {plan.name}
                    </h3>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-light text-stone-800">
                      ¥{plan.price.toLocaleString()}
                    </p>
                    <p className="text-[11px] text-stone-400">
                      {plan.priceNote ?? "税込"}
                    </p>
                  </div>
                </div>

                {/* メタ */}
                <div className="flex flex-wrap gap-4 mb-4 text-xs text-stone-500">
                  <span className="flex items-center gap-1.5">
                    <Clock className="size-3.5" />
                    {plan.duration}分
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="size-3.5" />
                    {plan.maxAttendees === 1
                      ? "マンツーマン"
                      : `定員${plan.maxAttendees}名`}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <DollarSign className="size-3.5" />
                    現金・振込・PayPay
                  </span>
                </div>

                {/* 料金詳細 */}
                <div className="rounded-xl bg-stone-50 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400 mb-2">
                    料金詳細
                  </p>
                  <ul className="space-y-1">
                    {plan.details.map((d) => (
                      <li
                        key={d}
                        className="flex items-start gap-1.5 text-xs text-stone-600"
                      >
                        <span className="mt-1.5 size-1 shrink-0 rounded-full bg-stone-300" />
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 注意書き */}
      <div className="rounded-xl bg-stone-50 border border-stone-200 p-4">
        <p className="text-xs text-stone-500 leading-relaxed">
          ※ レッスンプランの追加・編集機能は開発中です。変更が必要な場合は開発者にお問い合わせください。
        </p>
      </div>
    </div>
  );
}
