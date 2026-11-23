/**
 * テスト専用: メモリ上の偽ストレージ
 * 本番のコードからは読み込まないこと。
 */
import assert from "node:assert/strict";
import type { StorageDriver, StorageObjectInfo } from "../storage-core.ts";

/** メモリ上の偽ストレージ。遅延・失敗・時計のずれを注入できる */
export class FakeDriver implements StorageDriver {
  files = new Map<string, { body: string; createdAt: number }>();
  calls = { download: 0, upload: 0, list: 0, remove: 0 };
  /** 各操作の遅延（最小, 最大）ミリ秒 */
  latency: [number, number] = [0, 0];
  clockOffset = 0;
  failDownload: (path: string) => boolean = () => false;
  failUpload: (path: string) => boolean = () => false;
  /** 保存は成功するが、応答が届かなかったことにする */
  loseUploadResponse: (path: string) => boolean = () => false;
  failList: (folder: string) => boolean = () => false;

  now(): number {
    return Date.now() + this.clockOffset;
  }

  private async delay(): Promise<void> {
    const [min, max] = this.latency;
    const ms = min + Math.random() * (max - min);
    if (ms > 0) await new Promise((r) => setTimeout(r, ms));
  }

  seed(path: string, data: unknown): void {
    this.files.set(path, { body: JSON.stringify(data, null, 2), createdAt: this.now() });
  }

  json<T>(path: string): T {
    const file = this.files.get(path);
    assert.ok(file, `${path} が存在しない`);
    return JSON.parse(file.body) as T;
  }

  async download(path: string): Promise<string | null> {
    this.calls.download++;
    await this.delay();
    if (this.failDownload(path)) throw new Error("network down");
    return this.files.get(path)?.body ?? null;
  }

  async upload(
    path: string,
    body: string,
    options: { overwrite: boolean }
  ): Promise<boolean> {
    this.calls.upload++;
    await this.delay();
    if (this.failUpload(path)) throw new Error("network down");
    const existing = this.files.get(path);
    if (existing && !options.overwrite) return false;
    this.files.set(path, { body, createdAt: existing?.createdAt ?? this.now() });
    if (this.loseUploadResponse(path)) throw new Error("response lost");
    return true;
  }

  async list(folder: string): Promise<StorageObjectInfo[]> {
    this.calls.list++;
    await this.delay();
    if (this.failList(folder)) throw new Error("network down");
    const prefix = `${folder}/`;
    return [...this.files.entries()]
      .filter(([p]) => p.startsWith(prefix) && !p.slice(prefix.length).includes("/"))
      .map(([p, f]) => ({ name: p.slice(prefix.length), createdAt: f.createdAt }))
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 100);
  }

  async remove(paths: string[]): Promise<void> {
    this.calls.remove++;
    await this.delay();
    for (const p of paths) this.files.delete(p);
  }
}
