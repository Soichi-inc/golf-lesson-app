/**
 * Adminユーザー作成 + ADMIN権限付与スクリプト
 * 使い方: npx tsx scripts/create-admin.ts hasama@soichi.tokyo password123
 */
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.error("Usage: npx tsx scripts/create-admin.ts <email> <password>");
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function main() {
  // ユーザー作成（email_confirm: trueで確認済みにする）
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role: "ADMIN", full_name: "Akira Hasama" },
  });

  if (error) {
    // 既に存在する場合はADMIN権限のみ付与
    if (error.message.includes("already been registered")) {
      console.log(`User ${email} already exists. Setting ADMIN role...`);
      const { data: { users } } = await supabase.auth.admin.listUsers();
      const user = users.find((u) => u.email === email);
      if (user) {
        await supabase.auth.admin.updateUser(user.id, {
          user_metadata: { ...user.user_metadata, role: "ADMIN" },
        });
        console.log(`✅ ADMIN role set for ${email}`);
      }
      return;
    }
    console.error("Error creating user:", error);
    process.exit(1);
  }

  console.log(`✅ Created admin user: ${email} (${data.user.id})`);
}

main();
