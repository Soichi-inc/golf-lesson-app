/**
 * Supabase Storage ベースのJSONデータ永続化ユーティリティ
 * Vercel Serverless環境ではファイルシステム書き込みが不可のため
 * Supabase Storage (app-data バケット) を使用
 */

import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "app-data";

/** JSONファイルを読み込み */
export async function readJsonFromStorage<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .download(filePath);

    if (error || !data) return fallback;
    const text = await data.text();
    return JSON.parse(text) as T;
  } catch {
    return fallback;
  }
}

/** JSONファイルを保存 */
export async function writeJsonToStorage<T>(filePath: string, data: T): Promise<void> {
  const supabase = createAdminClient();
  const json = JSON.stringify(data, null, 2);

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, json, {
      contentType: "application/json",
      upsert: true,
    });

  if (error) throw new Error(`Storage write failed: ${error.message}`);
}
