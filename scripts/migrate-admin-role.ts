/**
 * user_metadata.role === "ADMIN" を app_metadata.role === "ADMIN" に移行するスクリプト
 * 使い方: npx tsx scripts/migrate-admin-role.ts
 *
 * user_metadata はクライアント側から変更可能なため、権限情報としては
 * app_metadata（サーバー側のみ書込可）に格納すべき
 */
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function main() {
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error("Failed to list users:", error);
    process.exit(1);
  }

  const adminUsers = users.filter((u) => u.user_metadata?.role === "ADMIN");
  console.log(`Found ${adminUsers.length} admin user(s) in user_metadata.`);

  for (const user of adminUsers) {
    const alreadyInAppMeta = user.app_metadata?.role === "ADMIN";
    if (alreadyInAppMeta) {
      console.log(`✓ ${user.email} already has app_metadata.role=ADMIN. Skipping.`);
      continue;
    }

    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      app_metadata: { ...user.app_metadata, role: "ADMIN" },
    });

    if (updateError) {
      console.error(`✗ Failed to migrate ${user.email}:`, updateError);
    } else {
      console.log(`✅ Migrated ${user.email} → app_metadata.role=ADMIN`);
    }
  }

  console.log("Migration complete. user_metadata.role remains for backward compatibility during transition.");
}

main();
