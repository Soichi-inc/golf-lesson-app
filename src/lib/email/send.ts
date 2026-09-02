import { Resend } from "resend";
import { getAdminEmails } from "@/lib/supabase/admin";

/**
 * Resend クライアントの遅延初期化
 *
 * モジュール読み込み時に new Resend() するとビルド時の "collecting page data"
 * フェーズで RESEND_API_KEY が無い環境（preview デプロイ等）でビルドが失敗する。
 * 実際にメール送信が呼ばれた時点でのみインスタンス化する。
 */
let _resend: Resend | null = null;
function getResend(): Resend | null {
  if (_resend) return _resend;
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  _resend = new Resend(key);
  return _resend;
}

const SANDBOX_FROM = "onboarding@resend.dev";
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || SANDBOX_FROM;
const FALLBACK_ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";

type SendMailOptions = {
  to: string;
  subject: string;
  html: string;
};

export async function sendMail({ to, subject, html }: SendMailOptions) {
  const resend = getResend();
  if (!resend) {
    console.warn("[sendMail] RESEND_API_KEY not configured; skipping email send");
    return { success: false, error: "メール設定が未構成です" };
  }
  if (FROM_EMAIL === SANDBOX_FROM) {
    // Resendのサンドボックス送信元は「Resendアカウント所有者本人の認証済み
    // アドレス」宛にしか配信されず、それ以外の宛先はAPI側で拒否される。
    // 本番では独自ドメインを検証して RESEND_FROM_EMAIL を設定すること。
    console.warn(
      `[sendMail] RESEND_FROM_EMAIL 未設定のためサンドボックス送信元(${SANDBOX_FROM})を使用中。` +
        `Resendアカウント所有者本人以外の宛先(${to})には配信されません。`
    );
  }
  try {
    const { data, error } = await resend.emails.send({
      from: `奥村真由美ゴルフレッスン <${FROM_EMAIL}>`,
      to,
      subject,
      html,
    });
    if (error) {
      console.error(`[sendMail] Resend error (to: ${to}):`, error);
      return { success: false, error: error.message };
    }
    return { success: true, id: data?.id };
  } catch (err) {
    console.error(`[sendMail] unexpected error (to: ${to}):`, err);
    return { success: false, error: "メール送信に失敗しました" };
  }
}

/**
 * 全ADMINユーザーに通知メールを送信
 * Supabase app_metadata.role === "ADMIN"（旧: user_metadata.role）のユーザーを自動検出
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
      console.error(
        "[notifyAdmin] 送信先なし: ADMINロールのユーザーが検出できず、" +
          "ADMIN_EMAIL も未設定のため管理者通知を送信できませんでした"
      );
      return { success: false, sent: 0, failed: 0 };
    }

    // 全ADMINに並行送信
    // ※ sendMail は例外を投げず {success:false} を返す設計のため、allSettled の
    //   status === "rejected" では失敗を検知できない（常に fulfilled になる）。
    //   必ず戻り値の success を見て判定すること。
    const results = await Promise.all(
      recipients.map(async (email) => ({
        email,
        result: await sendMail({ to: email, subject, html }),
      }))
    );

    const failed = results.filter((r) => !r.result.success);
    for (const f of failed) {
      console.error(`[notifyAdmin] 送信失敗 ${f.email}: ${f.result.error}`);
    }

    const sent = results.length - failed.length;
    if (sent === 0) {
      console.error(
        `[notifyAdmin] 管理者宛メールが1件も送信できませんでした（対象${recipients.length}件）`
      );
    }

    return { success: sent > 0, sent, failed: failed.length };
  } catch (err) {
    console.error("[notifyAdmin] error:", err);
    // フォールバック送信
    if (FALLBACK_ADMIN_EMAIL) {
      const result = await sendMail({ to: FALLBACK_ADMIN_EMAIL, subject, html });
      return {
        success: result.success,
        sent: result.success ? 1 : 0,
        failed: result.success ? 0 : 1,
      };
    }
    return { success: false, sent: 0, failed: 0 };
  }
}
