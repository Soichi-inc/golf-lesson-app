import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";

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

/** 管理者にも通知を送信 */
export async function notifyAdmin({ subject, html }: { subject: string; html: string }) {
  if (!ADMIN_EMAIL) return;
  return sendMail({ to: ADMIN_EMAIL, subject, html });
}
