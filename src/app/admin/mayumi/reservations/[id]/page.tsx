import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "予約詳細",
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AdminReservationDetailPage({ params }: Props) {
  const { id } = await params;

  return (
    <div>
      <h1 className="text-2xl font-light tracking-wide mb-6">予約詳細</h1>
      <p className="text-muted-foreground">
        予約ID: {id}（詳細ページ実装予定）
      </p>
    </div>
  );
}
