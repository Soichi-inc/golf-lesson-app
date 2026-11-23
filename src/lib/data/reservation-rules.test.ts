/**
 * 予約の判定ルールのテスト（npm test）
 *
 * 「同時に申し込まれても定員を超えない」「キャンセル済みの予約を古い画面から
 * 承認できない」ことを確かめる。
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  applyReservationStatusChange,
  checkReservationCapacity,
} from "./reservation-rules.ts";
import { createJsonStore } from "../storage-core.ts";
import { FakeDriver } from "../testing/fake-storage-driver.ts";

type Status = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
type Booking = "private" | "shared" | null;
type Row = {
  id: string;
  userId: string;
  scheduleId: string;
  status: Status;
  roundBookingType: Booking;
  updatedAt: string;
  cancelledAt: string | null;
  cancelReason: string | null;
};

const row = (id: string, userId: string, status: Status = "PENDING", booking: Booking = null): Row => ({
  id,
  userId,
  scheduleId: "slot-1",
  status,
  roundBookingType: booking,
  updatedAt: "2026-11-01T00:00:00.000Z",
  cancelledAt: null,
  cancelReason: null,
});

const request = (userId: string, booking: Booking = null, maxAttendees = 1) => ({
  userId,
  scheduleId: "slot-1",
  roundBookingType: booking,
  maxAttendees,
});

const NOW = "2026-11-24T03:00:00.000Z";

// ---------------------------------------------------------------------------
// 空き状況の判定
// ---------------------------------------------------------------------------

test("通常レッスン: 空いていれば予約でき、埋まっていれば満員", () => {
  assert.equal(checkReservationCapacity([], request("u1")), null);
  assert.equal(
    checkReservationCapacity([row("r1", "u2")], request("u1")),
    "このスケジュールは満員です"
  );
});

test("キャンセル済みの予約と、別の枠の予約は数えない", () => {
  const records = [
    row("r1", "u2", "CANCELLED"),
    { ...row("r2", "u3"), scheduleId: "slot-2" },
  ];
  assert.equal(checkReservationCapacity(records, request("u1")), null);
});

test("同じ人が同じ枠を二重に予約できない（連打・再送信）", () => {
  assert.equal(
    checkReservationCapacity([row("r1", "u1")], request("u1", null, 4)),
    "このスケジュールには既に予約済みです"
  );
});

test("ラウンド: 貸切は他の予約が 1 件でもあれば不可、組み合わせは貸切と同居不可・定員まで", () => {
  assert.equal(checkReservationCapacity([], request("u1", "private", 4)), null);
  assert.match(
    checkReservationCapacity([row("r1", "u2", "PENDING", "shared")], request("u1", "private", 4)) ?? "",
    /貸切予約はできません/
  );
  assert.match(
    checkReservationCapacity([row("r1", "u2", "CONFIRMED", "private")], request("u1", "shared", 4)) ?? "",
    /貸切予約が入っている/
  );
  const three = [row("r1", "u2", "PENDING", "shared"), row("r2", "u3", "PENDING", "shared"), row("r3", "u4", "CONFIRMED", "shared")];
  assert.equal(checkReservationCapacity(three, request("u1", "shared", 4)), null);
  assert.equal(
    checkReservationCapacity([...three, row("r4", "u5", "PENDING", "shared")], request("u1", "shared", 4)),
    "このスケジュールは満員です"
  );
});

test("2 人が同じ枠へ同時に申し込んでも、受け付けるのは 1 人だけ", async () => {
  const driver = new FakeDriver();
  driver.latency = [1, 6];
  driver.seed("reservations.json", []);
  // 別々のサーバーで処理される想定
  const stores = [0, 1].map(() =>
    createJsonStore(driver, { lockPollMs: [2, 6], retryDelaysMs: [5, 10] })
  );

  const book = (userId: string, store: (typeof stores)[number]) =>
    store.update<Row[], string | null>(
      "reservations.json",
      [],
      (records) => {
        const refusal = checkReservationCapacity(records, request(userId));
        if (refusal) return { result: refusal };
        return { data: [...records, row(`rsv-${userId}`, userId)], result: null };
      },
      { shape: "array" }
    );

  for (let round = 0; round < 5; round++) {
    driver.seed("reservations.json", []);
    const results = await Promise.all([book("u1", stores[0]), book("u2", stores[1])]);
    assert.equal(results.filter((r) => r === null).length, 1, "受け付けは 1 件だけのはず");
    assert.equal(results.filter((r) => r === "このスケジュールは満員です").length, 1);
    assert.equal(driver.json<Row[]>("reservations.json").length, 1);
  }
});

// ---------------------------------------------------------------------------
// ステータスの移り変わり
// ---------------------------------------------------------------------------

test("リクエスト中の予約は承認・却下できる（元の配列は変更しない）", () => {
  const records = [row("r1", "u1"), row("r2", "u2")];
  const approved = applyReservationStatusChange(records, "r1", "CONFIRMED", { from: ["PENDING"], nowIso: NOW });
  assert.ok(approved.ok);
  assert.equal(approved.record.status, "CONFIRMED");
  assert.equal(approved.record.updatedAt, NOW);
  assert.equal(approved.records[1], records[1]);
  assert.equal(records[0].status, "PENDING");

  const rejected = applyReservationStatusChange(records, "r2", "CANCELLED", { from: ["PENDING"], cancelReason: "満席のため", nowIso: NOW });
  assert.ok(rejected.ok);
  assert.equal(rejected.record.cancelledAt, NOW);
  assert.equal(rejected.record.cancelReason, "満席のため");
});

test("お客様が先にキャンセルした予約は、古い画面から承認できない", () => {
  const result = applyReservationStatusChange([row("r1", "u1", "CANCELLED")], "r1", "CONFIRMED", { from: ["PENDING"], nowIso: NOW });
  assert.ok(!result.ok);
  assert.match(result.error, /現在「キャンセル」のため/);
});

test("同じ操作の二重実行は止める（確定メールの二重送信を防ぐ）", () => {
  const result = applyReservationStatusChange([row("r1", "u1", "CONFIRMED")], "r1", "CONFIRMED", { from: ["PENDING"], nowIso: NOW });
  assert.ok(!result.ok);
  assert.match(result.error, /すでに「予約確定」/);
});

test("実施済み → 予約確定に戻せるが、承認の経路（リクエスト中のみ）では戻せない", () => {
  const records = [row("r1", "u1", "COMPLETED")];
  assert.ok(applyReservationStatusChange(records, "r1", "CONFIRMED", { from: ["COMPLETED"], nowIso: NOW }).ok);
  assert.ok(!applyReservationStatusChange(records, "r1", "CONFIRMED", { from: ["PENDING"], nowIso: NOW }).ok);
});

test("完了にできるのは確定済みだけ。キャンセル済みからはどこへも移れない", () => {
  assert.ok(!applyReservationStatusChange([row("r1", "u1", "PENDING")], "r1", "COMPLETED", { from: ["CONFIRMED"], nowIso: NOW }).ok);
  assert.ok(applyReservationStatusChange([row("r1", "u1", "CONFIRMED")], "r1", "COMPLETED", { from: ["CONFIRMED"], nowIso: NOW }).ok);
  for (const next of ["PENDING", "CONFIRMED", "COMPLETED"] as const) {
    assert.ok(!applyReservationStatusChange([row("r1", "u1", "CANCELLED")], "r1", next, { nowIso: NOW }).ok);
  }
});

test("存在しない予約はエラー", () => {
  const result = applyReservationStatusChange([row("r1", "u1")], "nope", "CONFIRMED", { nowIso: NOW });
  assert.ok(!result.ok);
  assert.equal(result.error, "予約が見つかりません");
});
