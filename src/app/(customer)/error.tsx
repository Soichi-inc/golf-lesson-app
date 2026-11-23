"use client";

import { ErrorScreen } from "@/components/common/ErrorScreen";

/** お客様向けページのエラー表示（ヘッダー・フッターは残したまま本文だけ差し替わる） */
export default function CustomerError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorScreen {...props} variant="customer" />;
}
