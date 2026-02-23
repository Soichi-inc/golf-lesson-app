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
    console.log(`- ${u.email} | role: ${u.user_metadata?.role || "USER"} | id: ${u.id}`);
  });
}
main();
