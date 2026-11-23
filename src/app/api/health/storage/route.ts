/**
 * 保存の仕組みの動作確認用エンドポイント（デプロイ後の確認に使う）
 *
 *   POST /api/health/storage   ヘッダー x-health-token: <トークン>
 *
 * 本番のデータには触れず、確認専用のファイル（__health__/storage-probe.json）に対して
 * 「ロック → 読み込み → 保存 → 読み直し」を 1 回行い、結果と所要時間を返す。
 * 管理者ログインなしで、本番環境の保存経路が動いていることを確かめるためのもの。
 *
 * トークンは SUPABASE_SERVICE_ROLE_KEY を鍵にした HMAC。鍵を知っている開発者だけが
 * 計算でき、トークンが漏れても鍵は復元できない。合わなければ 404 を返す。
 *
 *   node -e 'console.log(require("crypto").createHmac("sha256", process.env.SUPABASE_SERVICE_ROLE_KEY).update("storage-health-v1").digest("hex"))'
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import {
  isStorageError,
  readJsonFromStorage,
  updateJsonInStorage,
} from "@/lib/storage";

export const dynamic = "force-dynamic";

const PROBE_PATH = "__health__/storage-probe.json";

type Probe = { count: number; at: string };

function isAuthorized(request: Request): boolean {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return false;
  const expected = Buffer.from(
    createHmac("sha256", key).update("storage-health-v1").digest("hex")
  );
  const given = Buffer.from(request.headers.get("x-health-token") ?? "");
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const startedAt = Date.now();
  const region = process.env.VERCEL_REGION ?? null;
  try {
    const saved = await updateJsonInStorage<Probe, Probe>(
      PROBE_PATH,
      { count: 0, at: "" },
      (current) => {
        const next = { count: current.count + 1, at: new Date().toISOString() };
        return { data: next, result: next };
      },
      { shape: "object", backup: false }
    );
    const updateMs = Date.now() - startedAt;

    const readStartedAt = Date.now();
    const readBack = await readJsonFromStorage<Probe>(
      PROBE_PATH,
      { count: -1, at: "" },
      { shape: "object" }
    );

    return NextResponse.json({
      ok: readBack.count === saved.count && readBack.at === saved.at,
      count: saved.count,
      updateMs,
      readMs: Date.now() - readStartedAt,
      region,
    });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: isStorageError(e) ? e.code : "UNKNOWN",
        ms: Date.now() - startedAt,
        region,
      },
      { status: 503 }
    );
  }
}
