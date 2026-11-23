/**
 * `${prefix}-${現在時刻}` 形式のレコード ID を作る。
 * 同じミリ秒に作られた既存の ID と重ならないよう、重複時は連番を付ける。
 */
export function newRecordId(
  prefix: string,
  existing: { id: string }[],
  now: number = Date.now()
): string {
  let id = `${prefix}-${now}`;
  for (let n = 2; existing.some((r) => r.id === id); n++) {
    id = `${prefix}-${now}-${n}`;
  }
  return id;
}
