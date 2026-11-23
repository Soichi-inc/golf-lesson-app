/**
 * アプリのデータ（JSON ファイル）の読み書き窓口
 *
 * Vercel ではファイルシステムに書き込めないため、Supabase Storage の
 * app-data バケットに JSON ファイルとして保存している。
 *
 * 使い方の決まり:
 *  - 読むだけ      → readJsonFromStorage
 *  - 書き換える    → updateJsonInStorage（最新を読んで変更を返す関数を渡す）
 *
 * 「ファイル全体をそのまま保存する」関数はあえて用意していない。
 * 手元の古いデータで全件を上書きする事故を、仕組みとして起こせなくするため。
 * 詳しい仕組みは storage-core.ts を参照。
 */
import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  createJsonStore,
  type ReadOptions,
  type UpdateOptions,
  type UpdateOutcome,
} from "@/lib/storage-core";
import { createSupabaseDriver } from "@/lib/storage-supabase";

export {
  StorageError,
  isStorageError,
  storageErrorMessage,
  type UpdateOutcome,
} from "@/lib/storage-core";

const BUCKET = "app-data";

/**
 * 1 リクエストの打ち切り時間。
 * 応答のないリクエストがロックを握り続けないよう、storage-core の
 * DEFAULT_TIMINGS（保存開始の締切・ロック失効時間）とセットで決めている。
 */
const REQUEST_TIMEOUT_MS = 6_000;

const fetchWithTimeout: typeof fetch = (input, init) => {
  const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
  const signal =
    init?.signal && typeof AbortSignal.any === "function"
      ? AbortSignal.any([init.signal, timeout])
      : timeout;
  // データの読み書きは常に最新が必要。Next.js のデータキャッシュに載せない
  return fetch(input, { ...init, signal, cache: "no-store" });
};

let client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!client) {
    client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: { autoRefreshToken: false, persistSession: false },
        global: { fetch: fetchWithTimeout },
      }
    );
  }
  return client;
}

const store = createJsonStore(createSupabaseDriver(getClient, BUCKET));

/**
 * JSON ファイルを読む。
 * ファイルがまだ存在しない場合だけ fallback を返す。
 * 通信障害などで読めなかった場合は StorageError を投げる（fallback は返さない）。
 */
export function readJsonFromStorage<T>(
  filePath: string,
  fallback: T,
  options?: ReadOptions
): Promise<T> {
  return store.read(filePath, fallback, options);
}

/**
 * JSON ファイルを書き換える。
 *
 * mutate には「いま保存されている最新の内容」が渡される。
 *  - 保存したいとき   → { data: 新しい内容, result: 呼び出し元へ返す値 }
 *  - 何も変えないとき → { result: 呼び出し元へ返す値 }
 *
 * 読み込み → 変更 → 保存はファイルごとの排他ロックの中で行われるので、
 * 「空きがあるか確認してから予約を追加」のような判定も mutate の中に書けば、
 * 同時に来た操作と食い違わない。mutate の中ではメール送信などの重い処理をしないこと。
 */
export function updateJsonInStorage<T, R>(
  filePath: string,
  fallback: T,
  mutate: (current: T) => UpdateOutcome<T, R>,
  options?: UpdateOptions
): Promise<R> {
  return store.update(filePath, fallback, mutate, options);
}
