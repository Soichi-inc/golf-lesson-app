import { Resend } from "resend";
import { getAdminEmails } from "@/lib/supabase/admin";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
const FALLBACK_ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";

type SendMailOptions = {
  to: string;
  subject: string;
  html: string;
};

export async function sendMail({ to, subject, html }: SendMailOptions) {
  try {
    const { data, error } = await resend.emails.send({
      from: `奥村真由美ゴルフレッスン <${FROM_EMAIL}>`,
      to,
      subject,
      html,
    });
    if (error) {
      console.error("[sendMail] Resend error:", error);
      return { success: false, error: error.message };
    }
    return { success: true, id: data?.id };
  } catch (err) {
    console.error("[sendMail] unexpected error:", err);
    return { success: false, error: "メール送信に失敗しました" };
  }
}

/**
 * 全ADMINユーザーに通知メールを送信
 * Supabase user_metadata.role === "ADMIN" のユーザーを自動検出
 * 検出できない場合はフォールバックとして ADMIN_EMAIL 環境変数を使用
 */
export async function notifyAdmin({ subject, html }: { subject: string; html: string }) {
  try {
    // Supabase Admin APIでADMINユーザーを自動検出
    const adminEmails = await getAdminEmails();

    // フォールバック: Supabaseから取得できない場合は環境変数を使用
    const recipients = adminEmails.length > 0
      ? adminEmails
      : FALLBACK_ADMIN_EMAIL
        ? [FALLBACK_ADMIN_EMAIL]
        : [];

    if (recipients.length === 0) {
      console.warn("[notifyAdmin] No admin emails found");
      return;
    }

    // 全ADMINに並行送信
    const results = await Promise.allSettled(
      recipients.map((email) => sendMail({ to: email, subject, html }))
    );

    const failed = results.filter((r) => r.status === "rejected");
    if (failed.length > 0) {
      console.error(`[notifyAdmin] ${failed.length}/${recipients.length} emails failed`);
    }

    return { success: true, sent: recipients.length - failed.length };
  } catch (err) {
    console.error("[notifyAdmin] error:", err);
    // フォールバック送信
    if (FALLBACK_ADMIN_EMAIL) {
      return sendMail({ to: FALLBACK_ADMIN_EMAIL, subject, html });
    }
  }
}
