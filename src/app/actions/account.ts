"use server";

import { createClient } from "@/lib/supabase/server";

export type AccountInfo = {
  email: string;
  displayName: string;
  role: string;
  provider: string;
};

export async function getAccountInfo(): Promise<AccountInfo | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  return {
    email: user.email || "",
    displayName: user.user_metadata?.full_name || user.user_metadata?.name || "",
    role: user.user_metadata?.role || "USER",
    provider: user.app_metadata?.provider || "email",
  };
}

export async function updateDisplayName(
  name: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({
      data: { full_name: name },
    });
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    console.error("[updateDisplayName] error:", err);
    return { success: false, error: "表示名の更新に失敗しました" };
  }
}

export async function updatePassword(
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (newPassword.length < 6) {
      return { success: false, error: "パスワードは6文字以上で入力してください" };
    }
    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    console.error("[updatePassword] error:", err);
    return { success: false, error: "パスワードの更新に失敗しました" };
  }
}
