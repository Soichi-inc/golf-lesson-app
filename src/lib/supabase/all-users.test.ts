/**
 * 全ユーザー取得と通知の宛先のテスト（npm test）
 *
 * 登録者が 50 人を超えたとき、管理者あての通知メールが届かなくなった不具合の再発防止。
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { listAllUsers, mergeRecipients } from "./all-users.ts";

type U = { id: number; admin: boolean };

/** 新しい順に並んだ 73 人。管理者は最初期に登録した 2 人（＝一覧の最後） */
const users: U[] = Array.from({ length: 73 }, (_, i) => ({ id: 73 - i, admin: 73 - i <= 3 && 73 - i !== 2 }));
const pageOf = (page: number, perPage: number) => users.slice((page - 1) * perPage, page * perPage);

test("ページを指定しない取得（新しい順に 50 人）では、初期に登録した管理者が見つからない", () => {
  assert.equal(pageOf(1, 50).filter((u) => u.admin).length, 0);
});

test("全ページを取得すれば、登録者が何人いても管理者が見つかる", async () => {
  const calls: number[] = [];
  const all = await listAllUsers<U>(async (page, perPage) => {
    calls.push(page);
    return pageOf(page, perPage);
  }, { perPage: 50 });
  assert.equal(all.length, 73);
  assert.equal(all.filter((u) => u.admin).length, 2);
  assert.deepEqual(calls, [1, 2]);
});

test("ちょうどページの大きさで割り切れる人数でも、取りこぼさず終了する", async () => {
  const hundred = Array.from({ length: 100 }, (_, i) => i);
  const calls: number[] = [];
  const all = await listAllUsers<number>(async (page, perPage) => {
    calls.push(page);
    return hundred.slice((page - 1) * perPage, page * perPage);
  }, { perPage: 50 });
  assert.equal(all.length, 100);
  assert.deepEqual(calls, [1, 2, 3]); // 3 ページ目が空で終了
});

test("取得に失敗したら例外をそのまま伝える（途中までの結果で進めない）", async () => {
  await assert.rejects(
    () => listAllUsers<U>(async (page) => { if (page === 2) throw new Error("network"); return pageOf(page, 50); }, { perPage: 50 }),
    /network/
  );
});

test("宛先は管理者 + 予備の宛先。重複は大文字小文字を無視して除く", () => {
  assert.deepEqual(mergeRecipients(["a@example.com", "B@example.com"], "b@example.com"), ["a@example.com", "B@example.com"]);
  assert.deepEqual(mergeRecipients(["a@example.com"], "c@example.com"), ["a@example.com", "c@example.com"]);
  assert.deepEqual(mergeRecipients([], "c@example.com"), ["c@example.com"]);
  assert.deepEqual(mergeRecipients([], ""), []);
  assert.deepEqual(mergeRecipients(["a@example.com"], undefined), ["a@example.com"]);
});
