"use server";

import { createClient } from "@/lib/supabase/server";
import { requireUser, handleActionError } from "@/lib/auth/guard";

export type AccountInfo = {
  email: string;
  displayName: string;
  phone: string;
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
    phone: user.user_metadata?.phone || "",
    role: user.app_metadata?.role || user.user_metadata?.role || "USER",
    provider: user.app_metadata?.provider || "email",
  };
}

export async function updateDisplayName(
  name: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireUser();
    const trimmed = name.trim();
    if (!trimmed) {
      return { success: false, error: "氏名を入力してください" };
    }
    if (trimmed.length > 60) {
      return { success: false, error: "氏名は60文字以内で入力してください" };
    }
    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({
      data: { full_name: trimmed },
    });
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    return handleActionError(err, "表示名の更新に失敗しました");
  }
}

export async function updatePhone(
  phone: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireUser();
    const trimmed = phone.trim();

    // 空文字は削除扱い
    if (trimmed && !/^[0-9+\-() ]{8,20}$/.test(trimmed)) {
      return { success: false, error: "電話番号の形式が正しくありません" };
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({
      data: { phone: trimmed || null },
    });
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    return handleActionError(err, "電話番号の更新に失敗しました");
  }
}

export async function updatePassword(
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireUser();
    if (newPassword.length < 8) {
      return { success: false, error: "パスワードは8文字以上で入力してください" };
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
    return handleActionError(err, "パスワードの更新に失敗しました");
  }
}
