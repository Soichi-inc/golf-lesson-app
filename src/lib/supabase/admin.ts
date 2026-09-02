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

type AdminClient = ReturnType<typeof createAdminClient>;
type ListUserItem = Awaited<
  ReturnType<AdminClient["auth"]["admin"]["listUsers"]>
>["data"]["users"][number];

/**
 * 全ユーザーをページング取得
 *
 * listUsers は引数なしだと1ページ目の50件しか返さない。登録者が50人を超えると
 * 後ろのページにいる管理者を取りこぼし、「管理画面には入れるのに通知メールだけ
 * 届かない」という不整合が起きるため、必ずこのヘルパー経由で取得すること。
 *
 * @returns 取得できたユーザー一覧。取得に失敗した場合は null
 *          （「該当者ゼロ」と「取得失敗」を呼び出し側で区別できるようにするため）
 */
async function listAllUsers(
  admin: AdminClient,
  label: string
): Promise<ListUserItem[] | null> {
  const all: ListUserItem[] = [];

  // 1ページ最大1000件、最大10ページまで（合計1万件）
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) {
      console.error(`[${label}] listUsers error:`, error);
      return null;
    }
    if (!data.users.length) break;
    all.push(...data.users);
    if (data.users.length < 1000) break;
  }

  return all;
}

/** 指定メールアドレスのユーザーにADMINロールを付与 */
export async function setAdminRole(email: string) {
  const admin = createAdminClient();

  const users = await listAllUsers(admin, "setAdminRole");
  if (!users) throw new Error("ユーザー一覧の取得に失敗しました");

  // メールアドレスは大文字小文字を区別しない
  const target = email.toLowerCase();
  const user = users.find((u) => u.email?.toLowerCase() === target);
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
 */
export async function getAdminEmails(): Promise<string[]> {
  const admin = createAdminClient();

  const users = await listAllUsers(admin, "getAdminEmails");
  if (!users) return [];

  const emails = users
    .filter(
      (u) =>
        (u.app_metadata?.role === "ADMIN" || u.user_metadata?.role === "ADMIN") &&
        u.email
    )
    .map((u) => u.email!);

  if (emails.length === 0) {
    console.error(
      `[getAdminEmails] ADMINロールのユーザーが1人も見つかりません（全${users.length}件を確認）。` +
        `app_metadata.role / user_metadata.role に "ADMIN" が設定されているか確認してください。`
    );
  }

  return emails;
}
