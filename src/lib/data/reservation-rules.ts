/**
 * 予約の判定ルール（保存はしない純粋な関数だけを置く）
 *
 * ここの関数は、保存処理の排他ロックの中で「いま保存されている最新のデータ」に
 * 対して呼ばれる。判定と保存の間に別の操作が割り込めないので、
 * 同時に申し込まれても定員を超えず、古い画面からの操作で状態が食い違わない。
 *
 * ⚠️ Next.js / ストレージに依存させないこと（Node 単体のテストから読み込む）。
 */
import type { ReservationStatus, RoundBookingType } from "@/types";

// ---------------------------------------------------------------------------
// ステータス変更
// ---------------------------------------------------------------------------

const STATUS_LABEL: Record<ReservationStatus, string> = {
  PENDING: "リクエスト中",
  CONFIRMED: "予約確定",
  COMPLETED: "レッスン実施済",
  CANCELLED: "キャンセル",
};

/**
 * 許可するステータスの移り変わり（管理画面・マイページのボタンと同じ）。
 * 古い画面を開いたままの操作や同時操作で、キャンセル済みの予約が
 * 「確定」に戻ってしまう、といった食い違いを防ぐ。
 */
const ALLOWED_TRANSITIONS: Record<ReservationStatus, ReservationStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["COMPLETED", "CANCELLED"],
  COMPLETED: ["CONFIRMED", "CANCELLED"],
  CANCELLED: [],
};

type StatusFields = {
  id: string;
  status: ReservationStatus;
  updatedAt: string;
  cancelledAt: string | null;
  cancelReason: string | null;
};

/**
 * 予約 1 件のステータスを変えた新しい配列を返す（元の配列は変更しない）。
 * from を渡すと、現在のステータスがその中にあるときだけ変更を許可する。
 */
export function applyReservationStatusChange<T extends StatusFields>(
  records: T[],
  reservationId: string,
  newStatus: ReservationStatus,
  options: { cancelReason?: string; from?: ReservationStatus[]; nowIso: string }
): { ok: true; records: T[]; record: T } | { ok: false; error: string } {
  const current = records.find((r) => r.id === reservationId);
  if (!current) return { ok: false, error: "予約が見つかりません" };

  if (current.status === newStatus) {
    return {
      ok: false,
      error: `この予約はすでに「${STATUS_LABEL[newStatus]}」になっています。画面を再読み込みしてご確認ください。`,
    };
  }
  const allowed =
    ALLOWED_TRANSITIONS[current.status].includes(newStatus) &&
    (!options.from || options.from.includes(current.status));
  if (!allowed) {
    return {
      ok: false,
      error: `この予約は現在「${STATUS_LABEL[current.status]}」のため、この操作はできません。画面を再読み込みして最新の状態をご確認ください。`,
    };
  }

  const record: T = {
    ...current,
    status: newStatus,
    updatedAt: options.nowIso,
    ...(newStatus === "CANCELLED"
      ? { cancelledAt: options.nowIso, cancelReason: options.cancelReason || null }
      : {}),
  };
  return {
    ok: true,
    records: records.map((r) => (r.id === reservationId ? record : r)),
    record,
  };
}

// ---------------------------------------------------------------------------
// 予約の追加
// ---------------------------------------------------------------------------

type CapacityFields = {
  userId: string;
  scheduleId: string;
  status: ReservationStatus;
  roundBookingType: RoundBookingType | null;
};

/** その枠にこの予約を追加してよいか。だめなら理由（画面に出す文言）を返す */
export function checkReservationCapacity(
  records: CapacityFields[],
  request: {
    userId: string;
    scheduleId: string;
    roundBookingType: RoundBookingType | null;
    maxAttendees: number;
  }
): string | null {
  const active = records.filter(
    (r) => r.scheduleId === request.scheduleId && r.status !== "CANCELLED"
  );

  if (active.some((r) => r.userId === request.userId)) {
    return "このスケジュールには既に予約済みです";
  }

  const hasPrivate = active.some((r) => r.roundBookingType === "private");
  const sharedCount = active.filter((r) => r.roundBookingType === "shared").length;
  const regularCount = active.filter((r) => !r.roundBookingType).length;

  if (request.roundBookingType === "private") {
    // 貸切予約は「枠全体を独占」するため、他の予約が1件でもあれば不可
    if (active.length > 0) {
      return "この枠には既に他のご予約が入っているため、貸切予約はできません。組み合わせ予約または別の日時をお選びください。";
    }
  } else if (request.roundBookingType === "shared") {
    // 組み合わせ予約: 貸切との同居は不可
    if (hasPrivate) {
      return "この枠は既に貸切予約が入っているため、予約できません。";
    }
    // 組み合わせ同士の定員チェック（1人1席）
    if (sharedCount + 1 > request.maxAttendees) return "このスケジュールは満員です";
  } else if (regularCount + 1 > request.maxAttendees) {
    // ラウンド以外（通常レッスン）
    return "このスケジュールは満員です";
  }
  return null;
}
