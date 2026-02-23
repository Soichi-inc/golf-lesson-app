import { createClient } from "@supabase/supabase-js";

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

/** 指定メールアドレスのユーザーにADMINロールを付与 */
export async function setAdminRole(email: string) {
  const admin = createAdminClient();

  // メールアドレスでユーザーを検索
  const { data: { users }, error: listError } = await admin.auth.admin.listUsers();
  if (listError) throw listError;

  const user = users.find((u) => u.email === email);
  if (!user) throw new Error(`User not found: ${email}`);

  // user_metadataにrole: ADMINを設定
  const { error } = await admin.auth.admin.updateUserById(user.id, {
    user_metadata: { ...user.user_metadata, role: "ADMIN" },
  });
  if (error) throw error;

  return { userId: user.id, email };
}

/** role=ADMINの全ユーザーのメールアドレスを取得 */
export async function getAdminEmails(): Promise<string[]> {
  const admin = createAdminClient();
  const { data: { users }, error } = await admin.auth.admin.listUsers();
  if (error) {
    console.error("[getAdminEmails] error:", error);
    return [];
  }

  return users
    .filter((u) => u.user_metadata?.role === "ADMIN" && u.email)
    .map((u) => u.email!);
}
