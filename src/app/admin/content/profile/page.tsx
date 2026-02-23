import type { Metadata } from "next";
import Image from "next/image";
import {
  User,
  Instagram,
  Mail,
  Award,
  BookOpen,
  Info,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "プロフィール編集",
};

/* 現在のプロフィール情報（将来はDB連携） */
const profile = {
  name: "奥村真由美",
  nameEn: "Mayumi Okumura",
  title: "LPGA ティーチングプロフェッショナル会員",
  image: "/mayumi.jpg",
  instagram: "@mayumi_gf",
  email: "mayumi_okumura@outlook.com",
  bio: "ゴルフの楽しさをすべての方にお届けします。初心者の方から経験者の方まで、一人ひとりに合った指導でスコアアップのお手伝いをいたします。",
  qualifications: [
    "LPGA ティーチングプロフェッショナル会員",
    "TrackMan 認定インストラクター",
    "SPORTS BOX AI 認定コーチ",
  ],
  teachingPhilosophy: [
    "一人ひとりに合わせたカスタマイズ指導",
    "最新テクノロジー（TrackMan・SPORTS BOX AI）活用",
    "楽しく続けられるレッスン環境づくり",
    "初心者からシングルまで幅広く対応",
  ],
  locations: [
    { name: "golf next24 中川店", area: "横浜" },
    { name: "the golf house 京橋八丁堀", area: "東京" },
    { name: "PGL パーソナルゴルフラウンジ", area: "東京" },
  ],
};

export default function AdminContentProfilePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-light tracking-wide mb-1">
          プロフィール編集
        </h1>
        <p className="text-sm text-stone-500">
          公開ページに表示されるプロフィール情報を管理します
        </p>
      </div>

      {/* 基本情報 */}
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-100">
        <div className="flex items-center gap-2 mb-5">
          <User className="size-4 text-stone-500" />
          <h2 className="text-base font-semibold text-stone-800">基本情報</h2>
        </div>

        <div className="flex flex-col sm:flex-row gap-6">
          {/* 写真 */}
          <div className="shrink-0">
            <div className="relative w-28 h-28 rounded-2xl overflow-hidden ring-1 ring-stone-100">
              <Image
                src={profile.image}
                alt={profile.name}
                fill
                className="object-cover"
              />
            </div>
            <p className="text-[11px] text-stone-400 mt-2 text-center">
              宣材写真
            </p>
          </div>

          {/* 情報 */}
          <div className="flex-1 space-y-4">
            <div>
              <p className="text-[11px] text-stone-400 mb-1">名前</p>
              <p className="text-sm font-medium text-stone-800">{profile.name}</p>
              <p className="text-xs text-stone-500">{profile.nameEn}</p>
            </div>
            <div>
              <p className="text-[11px] text-stone-400 mb-1">肩書き</p>
              <p className="text-sm text-stone-700">{profile.title}</p>
            </div>
            <div className="flex flex-wrap gap-4">
              <div>
                <p className="text-[11px] text-stone-400 mb-1">Instagram</p>
                <p className="flex items-center gap-1 text-sm text-stone-700">
                  <Instagram className="size-3.5" />
                  {profile.instagram}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-stone-400 mb-1">メール</p>
                <p className="flex items-center gap-1 text-sm text-stone-700">
                  <Mail className="size-3.5" />
                  {profile.email}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 自己紹介 */}
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-100">
        <div className="flex items-center gap-2 mb-4">
          <Info className="size-4 text-stone-500" />
          <h2 className="text-base font-semibold text-stone-800">自己紹介</h2>
        </div>
        <p className="text-sm text-stone-600 leading-relaxed">{profile.bio}</p>
      </section>

      {/* 資格・認定 */}
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-100">
        <div className="flex items-center gap-2 mb-4">
          <Award className="size-4 text-stone-500" />
          <h2 className="text-base font-semibold text-stone-800">資格・認定</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {profile.qualifications.map((q) => (
            <Badge
              key={q}
              variant="outline"
              className="border-stone-200 text-stone-600 text-xs py-1.5 px-3"
            >
              {q}
            </Badge>
          ))}
        </div>
      </section>

      {/* 指導方針 */}
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-100">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="size-4 text-stone-500" />
          <h2 className="text-base font-semibold text-stone-800">指導方針</h2>
        </div>
        <ul className="space-y-2">
          {profile.teachingPhilosophy.map((item) => (
            <li
              key={item}
              className="flex items-start gap-2 text-sm text-stone-600"
            >
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-stone-300" />
              {item}
            </li>
          ))}
        </ul>
      </section>

      {/* レッスン場所 */}
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-100">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-base font-semibold text-stone-800">レッスン場所</h2>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {profile.locations.map(({ name, area }) => (
            <div
              key={name}
              className="rounded-xl bg-stone-50 p-4"
            >
              <p className="text-sm font-medium text-stone-800">{name}</p>
              <p className="text-xs text-stone-500 mt-0.5">{area}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 注意書き */}
      <div className="rounded-xl bg-stone-50 border border-stone-200 p-4">
        <p className="text-xs text-stone-500 leading-relaxed">
          ※ プロフィール情報の編集機能は開発中です。変更が必要な場合は開発者にお問い合わせください。
        </p>
      </div>
    </div>
  );
}
