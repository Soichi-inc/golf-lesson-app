"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { sendMail } from "@/lib/email/send";
import { passwordResetEmail } from "@/lib/email/templates";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://golf-lesson-app-mayumi.vercel.app";

/**
 * パスワード再設定メールを送信（自前フロー）
 *
 * Supabase標準の resetPasswordForEmail は使わない。理由:
 * - メールが英語テンプレートで送られる
 * - リンクURLが Supabaseダッシュボードの Site URL / Redirect URLs 設定に依存し、
 *   設定漏れがあると localhost 行きの壊れたリンクになる
 *
 * 代わりに admin.generateLink で recovery トークンだけ発行し、
 * リンクは NEXT_PUBLIC_APP_URL から自前で組み立て、日本語メール（Resend）で送る。
 * これによりSupabase側のURL・テンプレート設定に一切依存しない。
 *
 * セキュリティ: メールアドレスの存在有無を漏らさないため、
 * ユーザーが存在しない場合も常に成功を返す。
 */
export async function requestPasswordReset(
  email: string
): Promise<{ success: boolean; error?: string }> {
  const normalized = email.trim().toLowerCase();
  if (!normalized || !normalized.includes("@")) {
    return { success: false, error: "メールアドレスの形式が正しくありません" };
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.generateLink({
      type: "recovery",
      email: normalized,
    });

    if (error || !data?.properties?.hashed_token) {
      // ユーザー未登録などの場合もここに来る。存在有無を漏らさないため成功扱い。
      if (error) console.warn("[requestPasswordReset] generateLink:", error.message);
      return { success: true };
    }

    const resetUrl = `${APP_URL}/auth/reset-password?token_hash=${data.properties.hashed_token}`;
    const { subject, html } = passwordResetEmail(resetUrl);
    const result = await sendMail({ to: normalized, subject, html });

    if (!result.success) {
      console.error("[requestPasswordReset] sendMail failed:", result.error);
      return {
        success: false,
        error: "メールの送信に失敗しました。しばらく経ってから再度お試しください。",
      };
    }

    return { success: true };
  } catch (err) {
    console.error("[requestPasswordReset] unexpected:", err);
    return {
      success: false,
      error: "リクエストに失敗しました。しばらく経ってから再度お試しください。",
    };
  }
}
