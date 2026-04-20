// ---------------------------------------------------------------------------
// Sentry クライアント設定
// NEXT_PUBLIC_SENTRY_DSN が設定されている時のみ初期化
// ---------------------------------------------------------------------------
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
    environment: process.env.NODE_ENV,
    // デフォルトは本番のみエラー送信。開発中は無効化
    enabled: process.env.NODE_ENV === "production",
  });
}
