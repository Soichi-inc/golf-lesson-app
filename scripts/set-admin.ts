/**
 * Admin権限付与スクリプト
 * 使い方: npx tsx scripts/set-admin.ts hasama@soichi.tokyo
 */
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const email = process.argv[2];
if (!email) {
  console.error("Usage: npx tsx scripts/set-admin.ts <email>");
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function main() {
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error("Failed to list users:", listError);
    process.exit(1);
  }

  const user = users.find((u) => u.email === email);
  if (!user) {
    console.error(`User not found: ${email}`);
    process.exit(1);
  }

  const { error } = await supabase.auth.admin.updateUser(user.id, {
    user_metadata: { ...user.user_metadata, role: "ADMIN" },
  });

  if (error) {
    console.error("Failed to update user:", error);
    process.exit(1);
  }

  console.log(`✅ Successfully set ADMIN role for ${email} (${user.id})`);
}

main();
