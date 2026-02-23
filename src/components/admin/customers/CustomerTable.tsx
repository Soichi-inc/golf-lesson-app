"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, ChevronRight, UserCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import type { User } from "@/types";

type Props = {
  users: User[];
  reservationCounts: Record<string, number>;
};

export function CustomerTable({ users, reservationCounts }: Props) {
  const [query, setQuery] = useState("");

  const filtered = users.filter((u) => {
    const q = query.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.phone?.includes(q)
    );
  });

  return (
    <div className="space-y-4">
      {/* 検索バー */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-stone-400" />
        <Input
          placeholder="名前・メールアドレス・電話番号で検索"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9 bg-white"
        />
      </div>

      {/* 件数 */}
      <p className="text-xs text-stone-500">
        {filtered.length} 件表示中（全 {users.length} 件）
      </p>

      {/* テーブル */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-stone-400">
            <UserCircle2 className="size-10 mb-3 opacity-40" />
            <p className="text-sm">該当する顧客が見つかりません</p>
          </div>
        ) : (
          <ul className="divide-y divide-stone-100">
            {filtered.map((user) => (
              <CustomerRow
                key={user.id}
                user={user}
                reservationCount={reservationCounts[user.id] ?? 0}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function CustomerRow({
  user,
  reservationCount,
}: {
  user: User;
  reservationCount: number;
}) {
  const initials = user.name
    ? user.name
        .split(/\s+/)
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
    : user.email[0].toUpperCase();

  return (
    <li>
      <Link
        href={`/admin/mayumi/customers/${user.id}`}
        className="flex items-center gap-4 px-5 py-4 hover:bg-stone-50 transition-colors"
      >
        {/* アバター */}
        <Avatar className="size-10 shrink-0">
          <AvatarFallback className="bg-stone-200 text-stone-600 text-sm font-medium">
            {initials}
          </AvatarFallback>
        </Avatar>

        {/* 情報 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-stone-800 text-sm truncate">
              {user.name ?? "（名前未設定）"}
            </p>
            {reservationCount > 0 && (
              <Badge
                variant="secondary"
                className="text-[10px] bg-stone-100 text-stone-600 shrink-0"
              >
                {reservationCount}回受講
              </Badge>
            )}
          </div>
          <p className="text-xs text-stone-500 truncate mt-0.5">{user.email}</p>
          {user.phone && (
            <p className="text-xs text-stone-400 mt-0.5">{user.phone}</p>
          )}
        </div>

        {/* 登録日 */}
        <div className="hidden sm:block text-right shrink-0">
          <p className="text-[11px] text-stone-400">登録日</p>
          <p className="text-xs text-stone-600">
            {format(new Date(user.createdAt), "yyyy/MM/dd", { locale: ja })}
          </p>
        </div>

        <ChevronRight className="size-4 text-stone-300 shrink-0" />
      </Link>
    </li>
  );
}
