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
    console.error("Error:", error);
    process.exit(1);
  }
  users.forEach((u) => {
    console.log(`\n--- ${u.email} ---`);
    console.log(`  id: ${u.id}`);
    console.log(`  provider: ${u.app_metadata?.provider}`);
    console.log(`  providers: ${u.app_metadata?.providers?.join(", ")}`);
    console.log(`  metadata:`, JSON.stringify(u.user_metadata, null, 2));
    console.log(`  created: ${u.created_at}`);
  });
}
main();
