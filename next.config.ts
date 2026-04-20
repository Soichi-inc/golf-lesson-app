import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  /* config options here */
};

// Sentryは SENTRY_DSN（またはNEXT_PUBLIC_SENTRY_DSN）+ SENTRY_ORG + SENTRY_PROJECT が
// 全て設定されている時のみ source map アップロード等を有効化する。
// 未設定時は通常のNextConfigがそのまま返る。
const hasSentryConfig =
  (process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN) &&
  process.env.SENTRY_ORG &&
  process.env.SENTRY_PROJECT;

export default hasSentryConfig
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG!,
      project: process.env.SENTRY_PROJECT!,
      silent: !process.env.CI,
      widenClientFileUpload: true,
      tunnelRoute: "/monitoring",
      disableLogger: true,
      automaticVercelMonitors: true,
    })
  : nextConfig;
