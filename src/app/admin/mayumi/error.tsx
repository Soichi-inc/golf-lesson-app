"use client";

import { ErrorScreen } from "@/components/common/ErrorScreen";

/** 管理画面のエラー表示（サイドバーは残したまま本文だけ差し替わる） */
export default function AdminError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorScreen {...props} variant="admin" />;
}
