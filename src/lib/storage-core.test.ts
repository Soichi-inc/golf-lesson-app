/**
 * 保存の中核ロジックのテスト
 *
 *   npm test
 *
 * 通信障害・同時実行・処理の中断をメモリ上の偽ストレージで再現し、
 * 「読めなかっただけで全件が上書きされる」「同時に保存すると片方が消える」
 * といった事故が起きないことを確かめる。
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BACKUP_ROOT,
  LOCK_ROOT,
  StorageError,
  createJsonStore,
  storageErrorMessage,
  type StorageTimings,
} from "./storage-core.ts";
import { FakeDriver } from "./testing/fake-storage-driver.ts";

type Row = { id: string };

/** テストを速く回すための短い設定 */
const FAST: Partial<StorageTimings> = {
  retryDelaysMs: [5, 10],
  lockPollMs: [2, 6],
  lockTtlMs: 400,
  lockWaitMs: 3_000,
  lockHoldLimitMs: 300,
};

const FILE = "items.json";
const isLockOrBackup = (p: string) =>
  p.startsWith(`${LOCK_ROOT}/`) || p.startsWith(`${BACKUP_ROOT}/`);

const append = (id: string) => (rows: Row[]) => ({
  data: [...rows, { id }],
  result: id,
});

async function expectStorageError(
  run: () => Promise<unknown>,
  code: StorageError["code"]
): Promise<void> {
  await assert.rejects(run, (e: unknown) => {
    assert.ok(e instanceof StorageError, `StorageError ではない: ${String(e)}`);
    assert.equal(e.code, code);
    return true;
  });
}

// ---------------------------------------------------------------------------
// 読み込み
// ---------------------------------------------------------------------------

test("ファイルが無いときだけ初期値を返す（初期値そのものは書き換えられない）", async () => {
  const driver = new FakeDriver();
  const store = createJsonStore(driver, FAST);
  const fallback: Row[] = [{ id: "seed" }];

  const rows = await store.read(FILE, fallback, { shape: "array" });
  assert.deepEqual(rows, [{ id: "seed" }]);
  rows.push({ id: "x" });
  assert.deepEqual(fallback, [{ id: "seed" }]);
});

test("一時的な読み込み失敗は再試行して成功する", async () => {
  const driver = new FakeDriver();
  driver.seed(FILE, [{ id: "a" }]);
  let failures = 2;
  driver.failDownload = () => failures-- > 0;
  const store = createJsonStore(driver, FAST);

  assert.deepEqual(await store.read<Row[]>(FILE, []), [{ id: "a" }]);
});

test("読み込めないときは初期値を返さず、必ずエラーにする", async () => {
  const driver = new FakeDriver();
  driver.seed(FILE, [{ id: "a" }]);
  driver.failDownload = () => true;
  const store = createJsonStore(driver, FAST);

  await expectStorageError(() => store.read<Row[]>(FILE, []), "READ_FAILED");
});

test("壊れたファイル・想定外の形はエラーにする", async () => {
  const driver = new FakeDriver();
  const store = createJsonStore(driver, FAST);

  driver.files.set(FILE, { body: "[{ id: ", createdAt: driver.now() });
  await expectStorageError(() => store.read<Row[]>(FILE, []), "CORRUPT");

  driver.seed(FILE, { not: "an array" });
  await expectStorageError(
    () => store.read<Row[]>(FILE, [], { shape: "array" }),
    "CORRUPT"
  );
});

test("フレームワークの制御用の例外は、再試行も包み直しもせずそのまま通す", async () => {
  const driver = new FakeDriver();
  driver.seed(FILE, [{ id: "a" }]);
  const bailout = Object.assign(new Error("Dynamic server usage"), { digest: "DYNAMIC_SERVER_USAGE" });
  const download = driver.download.bind(driver);
  driver.download = async (path) => {
    await download(path);
    throw bailout;
  };
  const store = createJsonStore(driver, FAST);

  await assert.rejects(() => store.read<Row[]>(FILE, []), (e) => e === bailout);
  assert.equal(driver.calls.download, 1, "再試行してはいけない");
});

// ---------------------------------------------------------------------------
// 保存（今回の事故の再現と防止）
// ---------------------------------------------------------------------------

test("読み込みに失敗したら保存しない（既存データを上書きしない）", async () => {
  const driver = new FakeDriver();
  const original = [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }, { id: "e" }];
  driver.seed(FILE, original);
  driver.failDownload = (p) => p === FILE;
  const store = createJsonStore(driver, FAST);

  await expectStorageError(
    () => store.update<Row[], string>(FILE, [], append("new"), { shape: "array" }),
    "READ_FAILED"
  );
  assert.deepEqual(driver.json(FILE), original);

  // 復旧後は普通に保存でき、ロックも残っていない（待たされない）
  driver.failDownload = () => false;
  const startedAt = Date.now();
  await store.update<Row[], string>(FILE, [], append("new"), { shape: "array" });
  assert.equal(driver.json<Row[]>(FILE).length, 6);
  assert.ok(Date.now() - startedAt < 200, "失敗後にロックが残っている");
});

test("壊れたファイルは上書きしない", async () => {
  const driver = new FakeDriver();
  driver.files.set(FILE, { body: "{{{", createdAt: driver.now() });
  const store = createJsonStore(driver, FAST);

  await expectStorageError(
    () => store.update<Row[], string>(FILE, [], append("new")),
    "CORRUPT"
  );
  assert.equal(driver.files.get(FILE)?.body, "{{{");
});

test("ファイルが無ければ初期値から作る", async () => {
  const driver = new FakeDriver();
  const store = createJsonStore(driver, FAST);

  await store.update<Row[], string>(FILE, [], append("first"), { shape: "array" });
  assert.deepEqual(driver.json(FILE), [{ id: "first" }]);
});

test("同時に来た保存がすべて残る（別々のサーバーからでも）", async () => {
  const driver = new FakeDriver();
  driver.latency = [1, 8];
  driver.seed(FILE, []);
  // サーバーレスでは同時に複数のサーバーが動くので、ストアを 3 つに分ける
  const stores = [0, 1, 2].map(() => createJsonStore(driver, { ...FAST, lockWaitMs: 20_000 }));

  const ids = Array.from({ length: 30 }, (_, i) => `r${i}`);
  await Promise.all(
    ids.map((id, i) =>
      stores[i % stores.length].update<Row[], string>(FILE, [], append(id), {
        shape: "array",
      })
    )
  );

  const saved = driver.json<Row[]>(FILE).map((r) => r.id).sort();
  assert.deepEqual(saved, [...ids].sort());
});

test("（比較）ロックなしの読み書きでは同じ条件で保存が消える", async () => {
  const driver = new FakeDriver();
  driver.latency = [1, 8];
  driver.seed(FILE, []);

  await Promise.all(
    Array.from({ length: 30 }, async (_, i) => {
      const rows = JSON.parse((await driver.download(FILE)) ?? "[]") as Row[];
      rows.push({ id: `r${i}` });
      await driver.upload(FILE, JSON.stringify(rows), { overwrite: true });
    })
  );

  assert.ok(driver.json<Row[]>(FILE).length < 30, "このテスト条件では競合が起きていない");
});

test("ロック取得の応答が届かなくても、取れていれば先へ進める", async () => {
  const driver = new FakeDriver();
  driver.seed(FILE, []);
  let lost = 1;
  driver.loseUploadResponse = (p) => p.startsWith(`${LOCK_ROOT}/`) && !p.endsWith(".done") && lost-- > 0;
  const store = createJsonStore(driver, FAST);

  const startedAt = Date.now();
  await store.update<Row[], string>(FILE, [], append("a"), { shape: "array" });
  assert.deepEqual(driver.json(FILE), [{ id: "a" }]);
  assert.ok(Date.now() - startedAt < 200, "自分のロックの失効を待ってしまっている");
});

test("止まった処理のロックは時間で失効し、次の保存が進む", async () => {
  const driver = new FakeDriver();
  driver.seed(FILE, [{ id: "a" }]);
  // 処理が途中で落ち、返却されなかったロック
  driver.files.set(`${LOCK_ROOT}/${FILE}/g0000000007`, { body: "{}", createdAt: driver.now() });

  // 待ち時間がロックの失効より短ければ「混み合っている」で諦める（上書きはしない）
  const impatient = createJsonStore(driver, { ...FAST, lockWaitMs: 60 });
  await expectStorageError(
    () => impatient.update<Row[], string>(FILE, [], append("b"), { shape: "array" }),
    "BUSY"
  );
  assert.deepEqual(driver.json(FILE), [{ id: "a" }]);

  // 失効まで待てば保存できる
  const patient = createJsonStore(driver, FAST);
  await patient.update<Row[], string>(FILE, [], append("b"), { shape: "array" });
  assert.deepEqual(driver.json(FILE), [{ id: "a" }, { id: "b" }]);
  assert.ok(driver.files.has(`${LOCK_ROOT}/${FILE}/g0000000008.done`));
});

test("ロックを長く持ちすぎたら保存を始めない", async () => {
  const driver = new FakeDriver();
  driver.seed(FILE, [{ id: "a" }]);
  const store = createJsonStore(driver, { ...FAST, lockHoldLimitMs: 20 });
  // 本体の読み込みだけが極端に遅い
  const download = driver.download.bind(driver);
  driver.download = async (path) => {
    if (path === FILE) await new Promise((r) => setTimeout(r, 60));
    return download(path);
  };

  await expectStorageError(
    () => store.update<Row[], string>(FILE, [], append("b"), { shape: "array" }),
    "BUSY"
  );
  assert.deepEqual(driver.json(FILE), [{ id: "a" }]);
});

test("保存に失敗したらエラーにし、ロックはすぐ返す", async () => {
  const driver = new FakeDriver();
  driver.seed(FILE, [{ id: "a" }]);
  driver.failUpload = (p) => p === FILE;
  const store = createJsonStore(driver, FAST);

  await expectStorageError(
    () => store.update<Row[], string>(FILE, [], append("b"), { shape: "array" }),
    "WRITE_FAILED"
  );
  assert.deepEqual(driver.json(FILE), [{ id: "a" }]);

  driver.failUpload = () => false;
  const startedAt = Date.now();
  await store.update<Row[], string>(FILE, [], append("b"), { shape: "array" });
  assert.ok(Date.now() - startedAt < 200, "失敗後にロックが残っている");
});

test("一時的な保存失敗は 1 回だけやり直す", async () => {
  const driver = new FakeDriver();
  driver.seed(FILE, []);
  let failures = 1;
  driver.failUpload = (p) => p === FILE && failures-- > 0;
  const store = createJsonStore(driver, FAST);

  await store.update<Row[], string>(FILE, [], append("a"), { shape: "array" });
  assert.deepEqual(driver.json(FILE), [{ id: "a" }]);
});

test("一度に 2 件以上減る保存は拒否する（1 件の削除は通す）", async () => {
  const driver = new FakeDriver();
  const original = [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }, { id: "e" }];
  driver.seed(FILE, original);
  const store = createJsonStore(driver, FAST);

  await expectStorageError(
    () =>
      store.update<Row[], null>(FILE, [], () => ({ data: [{ id: "only" }], result: null }), {
        shape: "array",
      }),
    "GUARD"
  );
  assert.deepEqual(driver.json(FILE), original);

  await store.update<Row[], null>(
    FILE,
    [],
    (rows) => ({ data: rows.filter((r) => r.id !== "c"), result: null }),
    { shape: "array" }
  );
  assert.equal(driver.json<Row[]>(FILE).length, 4);
});

test("配列のファイルに配列以外は保存しない", async () => {
  const driver = new FakeDriver();
  driver.seed(FILE, [{ id: "a" }]);
  const store = createJsonStore(driver, FAST);

  await expectStorageError(
    () =>
      store.update<unknown, null>(FILE, [], () => ({ data: { broken: true }, result: null }), {
        shape: "array",
      }),
    "GUARD"
  );
  assert.deepEqual(driver.json(FILE), [{ id: "a" }]);
});

test("data を返さなければ何も書かない／内容が同じなら書かない", async () => {
  const driver = new FakeDriver();
  driver.seed(FILE, [{ id: "a" }]);
  const store = createJsonStore(driver, FAST);
  const mainWrites = () =>
    [...driver.files.keys()].filter((p) => p === FILE).length && driver.files.get(FILE)!.body;

  const before = mainWrites();
  const result = await store.update<Row[], string>(FILE, [], () => ({ result: "not found" }));
  assert.equal(result, "not found");
  await store.update<Row[], null>(FILE, [], (rows) => ({ data: rows, result: null }));
  assert.equal(mainWrites(), before);
  // バックアップも作られない（何も変わっていないため）
  assert.equal([...driver.files.keys()].filter((p) => p.startsWith(BACKUP_ROOT)).length, 0);
});

test("処理中の例外でもロックは返す", async () => {
  const driver = new FakeDriver();
  driver.seed(FILE, [{ id: "a" }]);
  const store = createJsonStore(driver, FAST);

  await assert.rejects(
    () =>
      store.update<Row[], null>(FILE, [], () => {
        throw new Error("bug in caller");
      }),
    /bug in caller/
  );
  const startedAt = Date.now();
  await store.update<Row[], string>(FILE, [], append("b"));
  assert.ok(Date.now() - startedAt < 200);
});

// ---------------------------------------------------------------------------
// バックアップと後片付け
// ---------------------------------------------------------------------------

test("その日最初の保存の前の内容をバックアップし、古いものは消す", async () => {
  const driver = new FakeDriver();
  const day = 24 * 60 * 60 * 1000;
  driver.seed(FILE, [{ id: "a" }]);
  const store = createJsonStore(driver, { ...FAST, backupRetentionDays: 2 });
  const backups = () =>
    [...driver.files.keys()].filter((p) => p.startsWith(`${BACKUP_ROOT}/${FILE}/`)).sort();

  await store.update<Row[], string>(FILE, [], append("b"));
  await store.update<Row[], string>(FILE, [], append("c"));
  assert.equal(backups().length, 1);
  // 1 回目の保存の「前」の内容が残っている。同じ日の 2 回目では上書きされない
  assert.deepEqual(JSON.parse(driver.files.get(backups()[0])!.body), [{ id: "a" }]);

  driver.clockOffset += day;
  await store.update<Row[], string>(FILE, [], append("d"));
  assert.equal(backups().length, 2);
  assert.deepEqual(JSON.parse(driver.files.get(backups()[1])!.body), [
    { id: "a" },
    { id: "b" },
    { id: "c" },
  ]);

  // 保存期間（2 日）を過ぎた最初のバックアップは消える
  driver.clockOffset += 3 * day;
  const first = backups()[0];
  await store.update<Row[], string>(FILE, [], append("e"));
  assert.ok(!driver.files.has(first));
  assert.equal(driver.json<Row[]>(FILE).length, 5);
});

test("バックアップに失敗しても本体の保存は成功する", async () => {
  const driver = new FakeDriver();
  driver.seed(FILE, [{ id: "a" }]);
  driver.failUpload = (p) => p.startsWith(BACKUP_ROOT);
  const store = createJsonStore(driver, FAST);

  await store.update<Row[], string>(FILE, [], append("b"));
  assert.deepEqual(driver.json(FILE), [{ id: "a" }, { id: "b" }]);
});

test("使い終わったロックの目印は片付けられ、最新の世代は必ず残る", async () => {
  const driver = new FakeDriver();
  driver.seed(FILE, []);
  const store = createJsonStore(driver, { ...FAST, lockGcAgeMs: 0, lockGcBatch: 4 });

  for (let i = 0; i < 25; i++) {
    driver.clockOffset += 10;
    await store.update<Row[], string>(FILE, [], append(`r${i}`), { backup: false });
  }
  const locks = [...driver.files.keys()].filter((p) => p.startsWith(`${LOCK_ROOT}/${FILE}/`));
  assert.ok(locks.length <= 10, `目印が ${locks.length} 個残っている`);
  assert.ok(locks.includes(`${LOCK_ROOT}/${FILE}/g0000000025`));
  assert.ok(locks.includes(`${LOCK_ROOT}/${FILE}/g0000000025.done`));
  assert.equal(driver.json<Row[]>(FILE).length, 25);
  assert.ok([...driver.files.keys()].every((p) => p === FILE || isLockOrBackup(p)));
});

test("ロック用の一覧取得が失敗し続けたら、保存せずにエラーにする", async () => {
  const driver = new FakeDriver();
  driver.seed(FILE, [{ id: "a" }]);
  driver.failList = () => true;
  const store = createJsonStore(driver, FAST);

  await expectStorageError(
    () => store.update<Row[], string>(FILE, [], append("b")),
    "READ_FAILED"
  );
  assert.deepEqual(driver.json(FILE), [{ id: "a" }]);
});

test("画面向けの文言は StorageError のときだけ返す", () => {
  assert.match(storageErrorMessage(new StorageError("BUSY", FILE, "x")) ?? "", /もう一度/);
  assert.match(storageErrorMessage(new StorageError("READ_FAILED", FILE, "x")) ?? "", /もう一度/);
  assert.equal(storageErrorMessage(new Error("other")), null);
});
