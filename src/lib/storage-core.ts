/**
 * JSON ファイル保存の中核ロジック
 *
 * このアプリは「1 種類のデータ = 1 つの JSON ファイル」として保存している。
 * そのため「読む → 書き換える → ファイル全体を保存」の途中で何か起きると、
 * 1 回の失敗が全件の消失につながる。ここではそれを仕組みで防ぐ。
 *
 *  1. 読み込み失敗を「データなし」と取り違えない
 *     ファイルが存在しない場合だけ初期値を返し、それ以外の失敗は必ず例外にする。
 *     （以前は失敗時も初期値を返していたため、通信が一瞬切れただけで
 *       「空のデータ + 今回の 1 件」が全件を上書きしていた）
 *  2. 書き換えは必ず update を通す
 *     ファイルごとの排他ロックの中で「最新を読む → 変更 → 保存」を行うので、
 *     同時に 2 つの操作が来ても片方の変更が消えない。
 *  3. 一度に 2 件以上減る保存は拒否する（どの操作も 1 件ずつしか消さないため）
 *  4. その日最初の保存のとき、直前の内容をバックアップとして残す
 *
 * ⚠️ このファイルは Next.js / Supabase に依存させないこと。
 *    Node 単体のテスト（storage-core.test.ts）から直接読み込んでいる。
 */

// ---------------------------------------------------------------------------
// エラー
// ---------------------------------------------------------------------------

export type StorageFailureCode =
  /** 読み込めなかった（通信断・ストレージ側の一時障害など） */
  | "READ_FAILED"
  /** 保存できなかった */
  | "WRITE_FAILED"
  /** ほかの保存処理と重なり、待っても順番が回ってこなかった */
  | "BUSY"
  /** ファイルの中身が JSON として読めない／想定した形ではない */
  | "CORRUPT"
  /** 安全装置が保存を止めた（件数が一度に大きく減る、形が変わる など） */
  | "GUARD";

export class StorageError extends Error {
  readonly code: StorageFailureCode;
  readonly path: string;

  constructor(
    code: StorageFailureCode,
    path: string,
    message: string,
    cause?: unknown
  ) {
    super(message, cause === undefined ? undefined : { cause });
    this.name = "StorageError";
    this.code = code;
    this.path = path;
  }
}

export function isStorageError(e: unknown): e is StorageError {
  return (
    e instanceof StorageError ||
    (typeof e === "object" &&
      e !== null &&
      (e as { name?: unknown }).name === "StorageError" &&
      typeof (e as { code?: unknown }).code === "string")
  );
}

/** 画面に出す文言。StorageError でなければ null */
export function storageErrorMessage(e: unknown): string | null {
  if (!isStorageError(e)) return null;
  switch (e.code) {
    case "BUSY":
      return "ほかの操作と重なったため、完了できませんでした。数秒おいてから、もう一度お試しください。";
    case "READ_FAILED":
    case "WRITE_FAILED":
      return "通信が不安定なため、完了できませんでした。少し待ってから、もう一度お試しください。";
    case "CORRUPT":
    case "GUARD":
      return "データの確認で問題が見つかったため、保存を中止しました。お手数ですが、サイトの担当者までご連絡ください。";
  }
}

// ---------------------------------------------------------------------------
// ストレージ操作の抽象（本番は Supabase Storage、テストはメモリ上の偽物）
// ---------------------------------------------------------------------------

export type StorageObjectInfo = {
  name: string;
  /** 作成時刻（ミリ秒）。取得できなければ null */
  createdAt: number | null;
};

export interface StorageDriver {
  /** 中身を取得する。存在しなければ null。それ以外の失敗は例外を投げること */
  download(path: string): Promise<string | null>;
  /**
   * 保存する。
   * overwrite=false のとき、同名がすでに存在すれば上書きせず false を返す
   * （同時に来た複数の要求のうち、成功するのは必ず 1 つだけであること）。
   */
  upload(
    path: string,
    body: string,
    options: { overwrite: boolean }
  ): Promise<boolean>;
  /** フォルダ直下のファイル一覧（新しい順に最大 100 件程度でよい） */
  list(folder: string): Promise<StorageObjectInfo[]>;
  remove(paths: string[]): Promise<void>;
  /** テスト用: 現在時刻（ミリ秒） */
  now?(): number;
}

// ---------------------------------------------------------------------------
// 設定値
// ---------------------------------------------------------------------------

export type StorageTimings = {
  /** 読み込みを何回まで試すか */
  readAttempts: number;
  /** 再試行までの待ち時間 */
  retryDelaysMs: number[];
  /** ロックを取ったまま応答しない処理を「止まった」とみなすまでの時間 */
  lockTtlMs: number;
  /** 順番待ちの上限。超えたら BUSY で諦める */
  lockWaitMs: number;
  /** ロック取得からこの時間を過ぎたら、保存を始めない（TTL 切れ後の書き込みを防ぐ） */
  lockHoldLimitMs: number;
  /** 順番待ち中の確認間隔（最小, 最大） */
  lockPollMs: [number, number];
  /** 使い終わったロックの目印を消してよくなるまでの時間 */
  lockGcAgeMs: number;
  /** 目印がこの数たまったらまとめて消す */
  lockGcBatch: number;
  /** バックアップを残す日数 */
  backupRetentionDays: number;
};

/**
 * 前提: 1 リクエストは 6 秒で打ち切る（storage.ts の REQUEST_TIMEOUT_MS）。
 * 保存開始の締切 7 秒 + 保存 1 回 6 秒 = 13 秒 < ロック失効 15 秒 なので、
 * 失効したロックの持ち主が後から書き込むことはない。
 */
export const DEFAULT_TIMINGS: StorageTimings = {
  readAttempts: 3,
  retryDelaysMs: [200, 500],
  lockTtlMs: 15_000,
  lockWaitMs: 6_000,
  lockHoldLimitMs: 7_000,
  lockPollMs: [80, 200],
  lockGcAgeMs: 10 * 60_000,
  lockGcBatch: 6,
  backupRetentionDays: 90,
};

export const LOCK_ROOT = "locks";
export const BACKUP_ROOT = "backups";

// ---------------------------------------------------------------------------
// 公開 API
// ---------------------------------------------------------------------------

export type JsonShape = "array" | "object";

export type ReadOptions = {
  /** ファイルの中身の形。違っていたら CORRUPT として扱う */
  shape?: JsonShape;
};

export type UpdateOptions = ReadOptions & {
  /**
   * 配列のとき、1 回の保存で減ってよい件数（既定 1）。
   * どの操作も 1 件ずつしか削除しないので、それ以上減る保存はバグとみなして止める。
   */
  maxRemovals?: number;
  /** false にすると日次バックアップを作らない */
  backup?: boolean;
};

/** update のコールバックの戻り値。data を返せば保存、返さなければ何も書かない */
export type UpdateOutcome<T, R> = { data: T; result: R } | { result: R };

export type JsonStore = {
  read<T>(path: string, fallback: T, options?: ReadOptions): Promise<T>;
  update<T, R>(
    path: string,
    fallback: T,
    mutate: (current: T) => UpdateOutcome<T, R>,
    options?: UpdateOptions
  ): Promise<R>;
};

type LockHandle = {
  folder: string;
  generation: number;
  acquiredAt: number;
  garbage: string[];
};

const LOCK_NAME = /^g(\d{10})(\.done)?$/;
const BACKUP_NAME = /^(\d{4}-\d{2}-\d{2})\.json$/;

function lockName(generation: number): string {
  return `g${String(generation).padStart(10, "0")}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function describe(e: unknown): string {
  if (e instanceof Error) return `${e.name}: ${e.message}`;
  try {
    return JSON.stringify(e);
  } catch {
    return String(e);
  }
}

/** 日本時間での日付（YYYY-MM-DD） */
function jstDate(ms: number): string {
  return new Date(ms + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function matchesShape(value: unknown, shape: JsonShape | undefined): boolean {
  if (shape === "array") return Array.isArray(value);
  if (shape === "object") {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  }
  return value !== undefined;
}

export function createJsonStore(
  driver: StorageDriver,
  overrides: Partial<StorageTimings> = {}
): JsonStore {
  const t: StorageTimings = { ...DEFAULT_TIMINGS, ...overrides };
  const now = () => (driver.now ? driver.now() : Date.now());
  /** このプロセスで既にバックアップ済みの「ファイル@日付」 */
  const backedUp = new Set<string>();

  // -- 読み込み -------------------------------------------------------------

  async function downloadWithRetry(path: string): Promise<string | null> {
    let lastError: unknown;
    for (let attempt = 0; attempt < t.readAttempts; attempt++) {
      if (attempt > 0) {
        const delay =
          t.retryDelaysMs[Math.min(attempt - 1, t.retryDelaysMs.length - 1)] ?? 0;
        await sleep(delay);
      }
      try {
        return await driver.download(path);
      } catch (e) {
        lastError = e;
      }
    }
    console.error(`[storage] read failed: ${path} — ${describe(lastError)}`);
    throw new StorageError(
      "READ_FAILED",
      path,
      `Storage read failed: ${path}`,
      lastError
    );
  }

  function parse(
    text: string,
    shape: JsonShape | undefined
  ): { ok: true; value: unknown } | { ok: false; reason: string } {
    let value: unknown;
    try {
      value = JSON.parse(text);
    } catch (e) {
      return { ok: false, reason: describe(e) };
    }
    if (!matchesShape(value, shape)) {
      return { ok: false, reason: `expected ${shape ?? "a JSON value"}` };
    }
    return { ok: true, value };
  }

  /** 現在の内容を読む。text は保存されていた文字列そのもの（ファイルが無ければ null） */
  async function load<T>(
    path: string,
    fallback: T,
    shape: JsonShape | undefined
  ): Promise<{ value: T; text: string | null }> {
    let text = await downloadWithRetry(path);
    if (text === null) return { value: structuredClone(fallback), text: null };

    let parsed = parse(text, shape);
    if (!parsed.ok) {
      // 通信途中の欠損でないことを確かめるため、1 回だけ取り直す
      const again = await downloadWithRetry(path);
      if (again === null) return { value: structuredClone(fallback), text: null };
      text = again;
      parsed = parse(text, shape);
      if (!parsed.ok) {
        console.error(`[storage] corrupt file: ${path} — ${parsed.reason}`);
        throw new StorageError(
          "CORRUPT",
          path,
          `Storage file is corrupt: ${path} (${parsed.reason})`
        );
      }
    }
    return { value: parsed.value as T, text };
  }

  async function read<T>(
    path: string,
    fallback: T,
    options: ReadOptions = {}
  ): Promise<T> {
    return (await load(path, fallback, options.shape)).value;
  }

  // -- 排他ロック -----------------------------------------------------------
  //
  // locks/<ファイル名>/g<世代番号> を「上書き不可」で作れた 1 人だけが書き込める。
  // 終わったら g<世代番号>.done を置く。次の人は「最新の世代が done か失効済み」
  // を確認してから 次の世代番号 を作りにいく。全員が同じ名前を取り合うので、
  // 同時に来ても成功するのは必ず 1 人。止まった処理のロックは時間で失効する。
  // （最新の世代は決して消さない。消すと番号が巻き戻り、二重取得の余地ができる）

  async function acquireLock(path: string): Promise<LockHandle> {
    const folder = `${LOCK_ROOT}/${path}`;
    const token =
      globalThis.crypto?.randomUUID?.() ??
      `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const startedAt = now();
    let failures = 0;
    /** 作成の応答を受け取れなかった世代。実際には自分が取れている可能性がある */
    let unconfirmed: { generation: number; acquiredAt: number; garbage: string[] } | null =
      null;

    const isMine = async (generation: number): Promise<boolean> => {
      try {
        const body = await driver.download(`${folder}/${lockName(generation)}`);
        return body !== null && (JSON.parse(body) as { token?: string }).token === token;
      } catch {
        return false;
      }
    };

    const giveUp = (e: unknown): never => {
      console.error(`[storage] lock failed: ${path} — ${describe(e)}`);
      throw new StorageError(
        "READ_FAILED",
        path,
        `Storage lock failed: ${path}`,
        e
      );
    };

    for (;;) {
      let entries: StorageObjectInfo[];
      try {
        entries = await driver.list(folder);
      } catch (e) {
        if (++failures >= t.readAttempts) giveUp(e);
        await sleep(t.retryDelaysMs[0] ?? 0);
        continue;
      }

      const at = now();
      let latest = 0;
      for (const entry of entries) {
        const m = LOCK_NAME.exec(entry.name);
        if (m) latest = Math.max(latest, Number(m[1]));
      }
      const latestName = lockName(latest);
      const latestEntry = entries.find((e) => e.name === latestName);
      const released = entries.some((e) => e.name === `${latestName}.done`);
      const held =
        latest > 0 &&
        !released &&
        latestEntry !== undefined &&
        latestEntry.createdAt !== null &&
        at - latestEntry.createdAt < t.lockTtlMs;

      if (held) {
        if (unconfirmed && unconfirmed.generation === latest && (await isMine(latest))) {
          return { folder, ...unconfirmed };
        }
        if (at - startedAt > t.lockWaitMs) {
          console.error(`[storage] lock busy: ${path}`);
          throw new StorageError("BUSY", path, `Storage is busy: ${path}`);
        }
        const [min, max] = t.lockPollMs;
        await sleep(min + Math.random() * (max - min));
        continue;
      }

      const generation = latest + 1;
      const acquiredAt = now();
      const garbage = entries
        .filter((entry) => {
          const m = LOCK_NAME.exec(entry.name);
          if (!m || Number(m[1]) >= latest) return false;
          return entry.createdAt === null || at - entry.createdAt > t.lockGcAgeMs;
        })
        .map((entry) => `${folder}/${entry.name}`);

      let created: boolean;
      try {
        created = await driver.upload(
          `${folder}/${lockName(generation)}`,
          JSON.stringify({ token, at: new Date(acquiredAt).toISOString() }),
          { overwrite: false }
        );
      } catch (e) {
        // 応答だけが失われ、実際には作れていることがある。中身で自分のものか確かめる
        if (await isMine(generation)) return { folder, generation, acquiredAt, garbage };
        unconfirmed = { generation, acquiredAt, garbage };
        if (++failures >= t.readAttempts) giveUp(e);
        await sleep(t.retryDelaysMs[0] ?? 0);
        continue;
      }

      if (created) return { folder, generation, acquiredAt, garbage };
      // 同時に来た別の処理が先に取った → 次の周回で順番を待つ
      if (now() - startedAt > t.lockWaitMs) {
        console.error(`[storage] lock busy: ${path}`);
        throw new StorageError("BUSY", path, `Storage is busy: ${path}`);
      }
    }
  }

  /** ロックを返す。失敗しても例外は投げない（時間で失効するため） */
  async function releaseLock(lock: LockHandle): Promise<void> {
    const marker = `${lock.folder}/${lockName(lock.generation)}.done`;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        await driver.upload(marker, new Date(now()).toISOString(), {
          overwrite: true,
        });
        break;
      } catch (e) {
        if (attempt === 1) {
          console.error(`[storage] lock release failed: ${marker} — ${describe(e)}`);
        }
      }
    }
    if (lock.garbage.length >= t.lockGcBatch) {
      try {
        await driver.remove(lock.garbage);
      } catch (e) {
        console.error(`[storage] lock cleanup failed — ${describe(e)}`);
      }
    }
  }

  // -- 保存 -----------------------------------------------------------------

  async function write(path: string, body: string, lock: LockHandle): Promise<void> {
    let lastError: unknown;
    for (let attempt = 0; attempt < 2; attempt++) {
      if (now() - lock.acquiredAt > t.lockHoldLimitMs) {
        if (attempt === 0) {
          throw new StorageError(
            "BUSY",
            path,
            `Storage update took too long, write skipped: ${path}`
          );
        }
        break;
      }
      if (attempt > 0) await sleep(t.retryDelaysMs[0] ?? 0);
      try {
        await driver.upload(path, body, { overwrite: true });
        return;
      } catch (e) {
        lastError = e;
      }
    }
    console.error(`[storage] write failed: ${path} — ${describe(lastError)}`);
    throw new StorageError(
      "WRITE_FAILED",
      path,
      `Storage write failed: ${path}`,
      lastError
    );
  }

  /** その日最初の保存のときだけ、直前の内容を残す。失敗しても本体の保存には影響させない */
  async function backup(path: string, previousText: string): Promise<void> {
    const day = jstDate(now());
    const key = `${path}@${day}`;
    if (backedUp.has(key)) return;
    try {
      const folder = `${BACKUP_ROOT}/${path}`;
      const created = await driver.upload(`${folder}/${day}.json`, previousText, {
        overwrite: false,
      });
      backedUp.add(key);
      if (!created) return;

      // 新しい日のバックアップを作れたときに、保存期間を過ぎたものを片付ける
      const cutoff = jstDate(now() - t.backupRetentionDays * 24 * 60 * 60 * 1000);
      const expired = (await driver.list(folder))
        .map((entry) => BACKUP_NAME.exec(entry.name))
        .filter((m): m is RegExpExecArray => m !== null && m[1] < cutoff)
        .map((m) => `${folder}/${m[0]}`);
      if (expired.length > 0) await driver.remove(expired);
    } catch (e) {
      console.error(`[storage] backup failed: ${path} — ${describe(e)}`);
    }
  }

  async function update<T, R>(
    path: string,
    fallback: T,
    mutate: (current: T) => UpdateOutcome<T, R>,
    options: UpdateOptions = {}
  ): Promise<R> {
    const lock = await acquireLock(path);
    let previousText: string | null = null;
    try {
      const { value, text } = await load<T>(path, fallback, options.shape);
      const countBefore = Array.isArray(value) ? value.length : null;

      const outcome = mutate(value);
      if (!("data" in outcome)) return outcome.result;

      const next = outcome.data;
      if (!matchesShape(next, options.shape)) {
        throw new StorageError(
          "GUARD",
          path,
          `Refused to save ${path}: data is not ${options.shape ?? "a JSON value"}`
        );
      }
      if (countBefore !== null && Array.isArray(next)) {
        const removed = countBefore - next.length;
        if (removed > (options.maxRemovals ?? 1)) {
          console.error(
            `[storage] refused to save ${path}: ${countBefore} → ${next.length} records`
          );
          throw new StorageError(
            "GUARD",
            path,
            `Refused to save ${path}: record count would drop from ${countBefore} to ${next.length}`
          );
        }
      }

      const body = JSON.stringify(next, null, 2);
      if (body === text) return outcome.result; // 変更なし → 書かない

      await write(path, body, lock);
      previousText = text;
      return outcome.result;
    } finally {
      await releaseLock(lock);
      if (previousText !== null && options.backup !== false) {
        await backup(path, previousText);
      }
    }
  }

  return { read, update };
}
