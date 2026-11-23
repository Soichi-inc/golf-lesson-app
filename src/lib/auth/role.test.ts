/**
 * 管理者判定のテスト（npm test）
 *
 * 本人が書き換えられる情報（user_metadata）を根拠に管理者と判定しないことを確かめる。
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { isAdminUser } from "./role.ts";

test("サーバーからしか書き換えられない側（app_metadata）に印があれば管理者", () => {
  assert.equal(isAdminUser({ app_metadata: { role: "ADMIN" } }), true);
  assert.equal(isAdminUser({ app_metadata: { provider: "email", role: "ADMIN" } }), true);
});

test("本人が書き換えられる側（user_metadata）に印があっても管理者にはしない", () => {
  const selfPromoted = { app_metadata: { provider: "email" }, user_metadata: { role: "ADMIN", full_name: "x" } };
  assert.equal(isAdminUser(selfPromoted), false);
});

test("印が無い・値が違う・未ログインは管理者ではない", () => {
  assert.equal(isAdminUser({ app_metadata: {} }), false);
  assert.equal(isAdminUser({ app_metadata: { role: "admin" } }), false);
  assert.equal(isAdminUser({ app_metadata: { role: "USER" } }), false);
  assert.equal(isAdminUser({ app_metadata: null }), false);
  assert.equal(isAdminUser({}), false);
  assert.equal(isAdminUser(null), false);
  assert.equal(isAdminUser(undefined), false);
});
