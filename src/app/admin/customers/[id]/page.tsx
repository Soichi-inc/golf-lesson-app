import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Mail, Phone, CalendarDays } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CustomerKarte } from "@/components/admin/customers/CustomerKarte";
import { mockCustomerDetails } from "@/lib/mock/data";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

export const metadata: Metadata = {
  title: "顧客カルテ",
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AdminCustomerDetailPage({ params }: Props) {
  const { id } = await params;
  const customer = mockCustomerDetails[id];

  if (!customer) notFound();

  const initials = customer.name
    ? customer.name.split(/\s+/).map((n) => n[0]).join("").slice(0, 2)
    : customer.email[0].toUpperCase();

  const completedCount = customer.reservations.filter(
    (r) => r.status === "COMPLETED"
  ).length;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* 戻るリンク */}
      <Button asChild variant="ghost" size="sm" className="-ml-2 text-stone-500">
        <Link href="/admin/customers">
          <ChevronLeft className="size-4 mr-1" />
          顧客一覧に戻る
        </Link>
      </Button>

      {/* 顧客プロフィールカード */}
      <div className="bg-white rounded-xl border shadow-sm p-6">
        <div className="flex items-start gap-5">
          {/* アバター */}
          <Avatar className="size-16 shrink-0">
            <AvatarFallback className="bg-stone-200 text-stone-600 text-xl font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>

          {/* 基本情報 */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl font-medium text-stone-800">
                {customer.name ?? "（名前未設定）"}
              </h1>
              {completedCount > 0 && (
                <Badge
                  variant="secondary"
                  className="bg-stone-100 text-stone-600 text-xs"
                >
                  {completedCount}回受講済み
                </Badge>
              )}
            </div>

            <div className="flex flex-col gap-1.5 mt-2 text-sm text-stone-500">
              <span className="flex items-center gap-2">
                <Mail className="size-3.5" />
                {customer.email}
              </span>
              {customer.phone && (
                <span className="flex items-center gap-2">
                  <Phone className="size-3.5" />
                  {customer.phone}
                </span>
              )}
              <span className="flex items-center gap-2">
                <CalendarDays className="size-3.5" />
                登録日:{" "}
                {format(customer.createdAt, "yyyy年M月d日", { locale: ja })}
              </span>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* カルテ（タブ） */}
      <CustomerKarte customer={customer} />
    </div>
  );
}
