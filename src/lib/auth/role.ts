/**
 * 管理者かどうかの判定
 *
 * 判定の根拠にしてよいのは app_metadata.role だけ。
 * app_metadata はサーバー（サービスロールキー）からしか書き換えられないが、
 * user_metadata はログインした本人が supabase.auth.updateUser({ data: … }) で自由に書き換えられる。
 * 以前は user_metadata.role も管理者の根拠として認めていたため、登録ユーザーが自分で
 * role を "ADMIN" にすれば管理画面と全顧客のデータに入れる状態だった（2026-11-24 に修正）。
 *
 * 管理者の判定が必要な箇所では、必ずこの関数を使うこと。
 *
 * ⚠️ Next.js / Supabase に依存させないこと（Node 単体のテストから読み込む）。
 */
type RoleSource =
  | { app_metadata?: Record<string, unknown> | null }
  | null
  | undefined;

export function isAdminUser(user: RoleSource): boolean {
  return user?.app_metadata?.role === "ADMIN";
}
