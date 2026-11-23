import { createClient } from "@supabase/supabase-js";
import { listAllUsers } from "@/lib/supabase/all-users";

/**
 * Supabase Admin Client (Service Role Key)
 * サーバーサイド専用。user_metadataの変更など管理操作に使用
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/**
 * Supabase Auth の全ユーザーを取得する。
 * listUsers() をページ指定なしで呼ぶと新しい順に 50 人しか返らないため、必ずこちらを使う。
 */
export async function fetchAllAuthUsers() {
  const admin = createAdminClient();
  return listAllUsers(async (page, perPage) => {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    return data.users;
  });
}

/** 指定メールアドレスのユーザーにADMINロールを付与 */
export async function setAdminRole(email: string) {
  const admin = createAdminClient();

  // メールアドレスでユーザーを検索（全ユーザーが対象）
  const users = await fetchAllAuthUsers();

  const user = users.find((u) => u.email === email);
  if (!user) throw new Error(`User not found: ${email}`);

  // app_metadataにrole: ADMINを設定（サーバー側のみ書込可・権限情報の正）
  const { error } = await admin.auth.admin.updateUserById(user.id, {
    app_metadata: { ...user.app_metadata, role: "ADMIN" },
  });
  if (error) throw error;

  return { userId: user.id, email };
}

/**
 * role=ADMINの全ユーザーのメールアドレスを取得
 * app_metadata.role を正とし、旧データ（user_metadata.role）も後方互換で拾う。
 * ここが古いままだと、権限チェックはADMINとして通るのに通知メールだけ届かない
 * という不整合が起きるため、認可チェックと必ず同じロジックを維持すること。
 *
 * ⚠️ 全ユーザーを対象に探すこと。listUsers() のページ指定なし（新しい順に 50 人）で探していたため、
 * 登録者が 50 人を超えた 2026 年 8〜9 月以降、初期に作った管理者アカウントが検出されず、
 * 予備の宛先（ADMIN_EMAIL）にしか通知が届かなくなっていた。
 */
export async function getAdminEmails(): Promise<string[]> {
  let users: Awaited<ReturnType<typeof fetchAllAuthUsers>>;
  try {
    users = await fetchAllAuthUsers();
  } catch (error) {
    console.error("[getAdminEmails] error:", error);
    return [];
  }

  return users
    .filter(
      (u) =>
        (u.app_metadata?.role === "ADMIN" || u.user_metadata?.role === "ADMIN") &&
        u.email
    )
    .map((u) => u.email!);
}
