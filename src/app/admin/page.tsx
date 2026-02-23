import type { Metadata } from "next";
import Link from "next/link";
import { format, isBefore, startOfDay, isSameMonth, isSameDay } from "date-fns";
import { ja } from "date-fns/locale";
import {
  CalendarDays,
  ClipboardList,
  Users,
  TrendingUp,
  Clock,
  MapPin,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { mockSchedules, mockReservations, mockUsers } from "@/lib/mock/data";

export const metadata: Metadata = {
  title: "ダッシュボード",
};

export default function AdminDashboardPage() {
  const today = startOfDay(new Date());
  const thisMonth = new Date();

  // 統計データ
  const pendingReservations = mockReservations.filter(
    (r) => r.status === "PENDING"
  );
  const confirmedReservations = mockReservations.filter(
    (r) => r.status === "CONFIRMED"
  );
  const totalCustomers = mockUsers.length;

  // 今月のスケジュール
  const monthSchedules = mockSchedules.filter((s) =>
    isSameMonth(s.startAt, thisMonth)
  );
  const availableSlots = monthSchedules.filter((s) => s.isAvailable).length;
  const totalSlots = monthSchedules.length;

  // 今日の予定
  const todaySchedules = mockSchedules
    .filter((s) => isSameDay(s.startAt, today))
    .sort((a, b) => a.startAt.getTime() - b.startAt.getTime());

  // 直近の予定（今日以降、最大5件）
  const upcomingSchedules = mockSchedules
    .filter((s) => !isBefore(startOfDay(s.startAt), today))
    .sort((a, b) => a.startAt.getTime() - b.startAt.getTime())
    .slice(0, 5);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-light tracking-wide mb-1">ダッシュボード</h1>
        <p className="text-sm text-stone-500">
          {format(today, "yyyy年M月d日（E）", { locale: ja })}
        </p>
      </div>

      {/* 承認待ちアラート */}
      {pendingReservations.length > 0 && (
        <Link
          href="/admin/reservations"
          className="flex items-center gap-3 rounded-2xl bg-amber-50 border border-amber-200 p-4 hover:bg-amber-100 transition-colors"
        >
          <AlertCircle className="size-5 text-amber-500 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800">
              承認待ちの予約が {pendingReservations.length} 件あります
            </p>
            <p className="text-xs text-amber-600 mt-0.5">
              クリックして予約管理へ移動
            </p>
          </div>
          <ChevronRight className="size-4 text-amber-400" />
        </Link>
      )}

      {/* 統計カード */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={ClipboardList}
          label="承認待ち"
          value={pendingReservations.length}
          suffix="件"
          href="/admin/reservations"
          accent={pendingReservations.length > 0 ? "amber" : "stone"}
        />
        <StatCard
          icon={CalendarDays}
          label="確定済み予約"
          value={confirmedReservations.length}
          suffix="件"
          href="/admin/reservations"
        />
        <StatCard
          icon={Users}
          label="登録顧客"
          value={totalCustomers}
          suffix="名"
          href="/admin/customers"
        />
        <StatCard
          icon={TrendingUp}
          label="今月の空き枠"
          value={availableSlots}
          suffix={`/ ${totalSlots}`}
          href="/admin/schedule"
        />
      </div>

      {/* 直近のスケジュール */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-stone-800">直近のスケジュール</h2>
          <Button variant="ghost" size="sm" asChild className="text-xs text-stone-500">
            <Link href="/admin/schedule">
              すべて表示
              <ChevronRight className="size-3 ml-0.5" />
            </Link>
          </Button>
        </div>

        {upcomingSchedules.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-stone-100">
            <p className="text-sm text-stone-500">直近のスケジュールはありません</p>
          </div>
        ) : (
          <div className="space-y-2">
            {upcomingSchedules.map((schedule) => {
              const isRound = schedule.lessonPlan.category === "ROUND";
              const isToday = isSameDay(schedule.startAt, today);

              return (
                <div
                  key={schedule.id}
                  className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-stone-100"
                >
                  {/* 日付 */}
                  <div className="text-center shrink-0 w-14">
                    <p className="text-[10px] text-stone-400 uppercase">
                      {format(schedule.startAt, "E", { locale: ja })}
                    </p>
                    <p className={`text-lg font-semibold ${isToday ? "text-stone-800" : "text-stone-600"}`}>
                      {format(schedule.startAt, "d")}
                    </p>
                    <p className="text-[10px] text-stone-400">
                      {format(schedule.startAt, "M月")}
                    </p>
                  </div>

                  {/* 区切り */}
                  <div className={`w-0.5 h-10 rounded-full ${isRound ? "bg-amber-300" : "bg-stone-200"}`} />

                  {/* 詳細 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          isRound
                            ? "border-amber-200 bg-amber-50 text-amber-700"
                            : "border-stone-200 text-stone-500"
                        }`}
                      >
                        {isRound ? "ラウンド" : "インドア"}
                      </Badge>
                      {isToday && (
                        <Badge className="bg-stone-800 text-white text-[10px]">
                          今日
                        </Badge>
                      )}
                      {!schedule.isAvailable && (
                        <Badge variant="outline" className="border-red-200 text-red-500 text-[10px]">
                          予約済
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm font-medium text-stone-800 truncate">
                      {schedule.lessonPlan.name}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-stone-400">
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" />
                        {format(schedule.startAt, "HH:mm")} – {format(schedule.endAt, "HH:mm")}
                      </span>
                      {schedule.location && (
                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="size-3 shrink-0" />
                          {schedule.location}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 料金 */}
                  <p className="text-sm text-stone-500 shrink-0">
                    ¥{schedule.lessonPlan.price.toLocaleString()}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* クイックリンク */}
      <section>
        <h2 className="text-base font-semibold text-stone-800 mb-4">クイック操作</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <QuickLink
            href="/admin/schedule"
            icon={CalendarDays}
            label="スケジュール管理"
            description="空き枠の登録・編集"
          />
          <QuickLink
            href="/admin/reservations"
            icon={ClipboardList}
            label="予約管理"
            description="予約の承認・キャンセル"
          />
          <QuickLink
            href="/admin/customers"
            icon={Users}
            label="顧客管理"
            description="顧客一覧・カルテ閲覧"
          />
        </div>
      </section>
    </div>
  );
}

/* ---------- Sub-components ---------- */

function StatCard({
  icon: Icon,
  label,
  value,
  suffix,
  href,
  accent = "stone",
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  suffix: string;
  href: string;
  accent?: "stone" | "amber";
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-100 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`size-4 ${accent === "amber" ? "text-amber-500" : "text-stone-400"}`} />
        <p className="text-xs text-stone-500">{label}</p>
      </div>
      <p className="text-2xl font-light text-stone-800">
        {value}
        <span className="text-sm text-stone-400 ml-1">{suffix}</span>
      </p>
    </Link>
  );
}

function QuickLink({
  href,
  icon: Icon,
  label,
  description,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-stone-100 hover:bg-stone-50 hover:shadow-md transition-all"
    >
      <div className="flex size-10 items-center justify-center rounded-lg bg-stone-100">
        <Icon className="size-5 text-stone-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-stone-800">{label}</p>
        <p className="text-xs text-stone-400">{description}</p>
      </div>
      <ChevronRight className="size-4 text-stone-300" />
    </Link>
  );
}
