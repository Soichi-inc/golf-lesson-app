/**
 * Supabase Storage を storage-core の StorageDriver として使うための接続部分
 *
 * ⚠️ Next.js 固有の機能（server-only・パスエイリアス）に依存させないこと。
 *    本番ストレージとの結合確認スクリプトから直接読み込めるようにしている。
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { StorageDriver, StorageObjectInfo } from "./storage-core";

type ErrorLike = {
  name?: unknown;
  message?: unknown;
  status?: unknown;
  statusCode?: unknown;
  originalError?: unknown;
};

type ResponseLike = {
  status: number;
  clone(): { json(): Promise<unknown> };
};

function asResponse(value: unknown): ResponseLike | null {
  const res = value as Partial<ResponseLike> | null | undefined;
  return res && typeof res.status === "number" && typeof res.clone === "function"
    ? (res as ResponseLike)
    : null;
}

async function readErrorBody(error: ErrorLike): Promise<Record<string, unknown> | null> {
  const res = asResponse(error.originalError);
  if (!res) return null;
  try {
    const body = await res.clone().json();
    return typeof body === "object" && body !== null
      ? (body as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

/**
 * 「そのファイルが存在しない」という応答かどうか。
 *
 * Supabase Storage は存在しないファイルに対して HTTP 400 を返し、本文に
 * {"statusCode":"404","error":"not_found","message":"Object not found","code":"NoSuchKey"}
 * を入れてくる（2026-11 本番で確認）。HTTP ステータスだけでは他の失敗と区別できないので
 * 本文で判定する。判定できないものはすべて「読み込み失敗」として扱う
 * （バケットが無い・認証エラーなどを「データなし」と取り違えないため）。
 */
export async function isObjectNotFound(error: unknown): Promise<boolean> {
  if (typeof error !== "object" || error === null) return false;
  const body = await readErrorBody(error as ErrorLike);
  if (!body) return false;
  return (
    body.code === "NoSuchKey" ||
    body.error === "not_found" ||
    body.message === "Object not found"
  );
}

/** 上書き不可で保存しようとして「すでに存在する」と断られた応答かどうか */
export function isAlreadyExists(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const e = error as ErrorLike;
  return (
    e.statusCode === "409" ||
    e.status === 409 ||
    (typeof e.message === "string" && /already exists/i.test(e.message))
  );
}

async function toError(operation: string, error: unknown): Promise<Error> {
  const e = (typeof error === "object" && error !== null ? error : {}) as ErrorLike;
  const res = asResponse(e.originalError);
  const body = await readErrorBody(e);
  const original = e.originalError as { name?: unknown; message?: unknown } | undefined;
  const parts = [
    typeof e.name === "string" ? e.name : null,
    typeof e.status === "number" ? `status=${e.status}` : null,
    res ? `http=${res.status}` : null,
    typeof e.statusCode === "string" ? `code=${e.statusCode}` : null,
    body && typeof body.message === "string"
      ? body.message
      : typeof e.message === "string" && e.message !== "{}"
        ? e.message
        : null,
    !res && original && typeof original.message === "string"
      ? `${String(original.name ?? "Error")}: ${original.message}`
      : null,
  ].filter(Boolean);
  return new Error(`${operation} failed (${parts.join(", ") || "unknown error"})`);
}

export function createSupabaseDriver(
  getClient: () => SupabaseClient,
  bucketName: string
): StorageDriver {
  const bucket = () => getClient().storage.from(bucketName);

  return {
    async download(path) {
      const { data, error } = await bucket().download(path);
      if (error) {
        if (await isObjectNotFound(error)) return null;
        throw await toError(`download ${path}`, error);
      }
      if (!data) throw new Error(`download ${path} failed (empty response)`);
      return data.text();
    },

    async upload(path, body, { overwrite }) {
      const { error } = await bucket().upload(path, body, {
        contentType: "application/json",
        upsert: overwrite,
        // 常に最新を読みたいデータなので、途中の経路でキャッシュさせない
        cacheControl: "0",
      });
      if (!error) return true;
      if (!overwrite && isAlreadyExists(error)) return false;
      throw await toError(`upload ${path}`, error);
    },

    async list(folder) {
      const { data, error } = await bucket().list(folder, {
        limit: 100,
        sortBy: { column: "created_at", order: "desc" },
      });
      if (error) throw await toError(`list ${folder}`, error);
      return (data ?? [])
        .filter((file) => file.id) // id が無いものはフォルダ
        .map(
          (file): StorageObjectInfo => ({
            name: file.name,
            createdAt: file.created_at ? Date.parse(file.created_at) || null : null,
          })
        );
    },

    async remove(paths) {
      if (paths.length === 0) return;
      const { error } = await bucket().remove(paths);
      if (error) throw await toError(`remove ${paths.length} object(s)`, error);
    },
  };
}
