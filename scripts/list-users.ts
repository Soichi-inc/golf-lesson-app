import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

type ListUserItem = Awaited<
  ReturnType<typeof supabase.auth.admin.listUsers>
>["data"]["users"][number];

/**
 * 全ユーザーをページング取得
 * listUsers は引数なしだと1ページ目の50件しか返さないため、この診断スクリプト
 * 自体が管理者を取りこぼして誤った結論（「ADMINがいない」）を出さないようにする。
 */
async function listAllUsers(): Promise<ListUserItem[]> {
  const all: ListUserItem[] = [];
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) {
      console.error("Error:", error);
      process.exit(1);
    }
    if (!data.users.length) break;
    all.push(...data.users);
    if (data.users.length < 1000) break;
  }
  return all;
}

async function main() {
  const users = await listAllUsers();

  const admins: string[] = [];

  users.forEach((u) => {
    const appRole = u.app_metadata?.role;
    const userRole = u.user_metadata?.role;
    const effectiveRole = appRole || userRole || "USER";
    if (effectiveRole === "ADMIN" && u.email) admins.push(u.email);
    console.log(
      `- ${u.email} | role: ${effectiveRole} (app_metadata: ${appRole || "-"}, user_metadata: ${userRole || "-"}) | id: ${u.id}`
    );
  });

  // 通知メールの宛先になるのはここに出る一覧。空なら ADMIN_EMAIL 環境変数への
  // フォールバックのみとなり、それも未設定なら管理者通知は一切送信されない。
  console.log("");
  console.log(`合計 ${users.length} 件 / ADMIN ${admins.length} 件`);
  if (admins.length > 0) {
    console.log("管理者通知メールの宛先:");
    admins.forEach((e) => console.log(`  - ${e}`));
  } else {
    console.log(
      "⚠ ADMINロールのユーザーがいません。ADMIN_EMAIL 環境変数が未設定の場合、管理者通知メールは送信されません。"
    );
  }
}
main();
