import { format } from "date-fns";
import { ja } from "date-fns/locale";
import type { Schedule } from "@/types";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://golf-lesson-app-mayumi.vercel.app";

/** 共通のHTMLラッパー */
function wrap(content: string): string {
  return `
<!DOCTYPE html>
<html lang="ja">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f5f4;font-family:'Helvetica Neue',Arial,'Hiragino Sans',sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 20px;">
    <div style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
      <!-- ヘッダー -->
      <div style="background:#292524;padding:24px 28px;">
        <p style="margin:0;color:#a8a29e;font-size:10px;letter-spacing:0.15em;text-transform:uppercase;">Mayumi Okumura</p>
        <p style="margin:4px 0 0;color:#fff;font-size:16px;font-weight:600;">Official HP</p>
      </div>
      <!-- 本文 -->
      <div style="padding:28px;">
        ${content}
      </div>
    </div>
    <!-- フッター -->
    <p style="text-align:center;color:#a8a29e;font-size:11px;margin-top:24px;">
      &copy; ${new Date().getFullYear()} Soichi, Inc. All rights reserved.
    </p>
  </div>
</body>
</html>`;
}

/** 予約リクエスト受付メール（ユーザー向け） */
export function reservationRequestEmail(schedule: Schedule, concern?: string): { subject: string; html: string } {
  const dateStr = format(schedule.startAt, "yyyy年M月d日（E）", { locale: ja });
  const timeStr = `${format(schedule.startAt, "HH:mm")} – ${format(schedule.endAt, "HH:mm")}`;
  const isRound = schedule.lessonPlan.category === "ROUND";

  return {
    subject: `【予約リクエスト受付】${dateStr} ${schedule.lessonPlan.name}`,
    html: wrap(`
      <h2 style="margin:0 0 8px;color:#292524;font-size:18px;font-weight:500;">
        予約リクエストを受け付けました
      </h2>
      <p style="margin:0 0 24px;color:#78716c;font-size:14px;line-height:1.7;">
        以下のレッスンについて予約リクエストを受け付けました。<br>
        講師が確認のうえ、承認しましたらメールにてお知らせいたします。
      </p>

      <div style="background:#fafaf9;border-radius:12px;padding:20px;margin-bottom:24px;">
        <table style="width:100%;border-collapse:collapse;font-size:13px;color:#44403c;">
          <tr>
            <td style="padding:6px 0;color:#a8a29e;width:80px;vertical-align:top;">種別</td>
            <td style="padding:6px 0;font-weight:500;">${isRound ? "ラウンドレッスン" : "インドアレッスン"}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#a8a29e;vertical-align:top;">プラン</td>
            <td style="padding:6px 0;">${schedule.lessonPlan.name}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#a8a29e;vertical-align:top;">日時</td>
            <td style="padding:6px 0;">${dateStr}<br>${timeStr}（${schedule.lessonPlan.duration}分）</td>
          </tr>
          ${schedule.teeOffTime ? `
          <tr>
            <td style="padding:6px 0;color:#a8a29e;vertical-align:top;">ティーオフ</td>
            <td style="padding:6px 0;font-weight:500;color:#d97706;">${schedule.teeOffTime}</td>
          </tr>` : ""}
          ${schedule.location ? `
          <tr>
            <td style="padding:6px 0;color:#a8a29e;vertical-align:top;">場所</td>
            <td style="padding:6px 0;">${schedule.location}</td>
          </tr>` : ""}
          ${schedule.note ? `
          <tr>
            <td style="padding:6px 0;color:#a8a29e;vertical-align:top;">備考</td>
            <td style="padding:6px 0;">${schedule.note}</td>
          </tr>` : ""}
          <tr>
            <td style="padding:6px 0;color:#a8a29e;vertical-align:top;">料金</td>
            <td style="padding:6px 0;font-weight:600;">¥${schedule.lessonPlan.price.toLocaleString()}（税込）</td>
          </tr>
        </table>
      </div>

      ${concern ? `
      <div style="background:#fffbeb;border-radius:12px;padding:16px;margin-bottom:24px;">
        <p style="margin:0 0 4px;color:#a8a29e;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;">お悩み・ご質問</p>
        <p style="margin:0;color:#44403c;font-size:13px;line-height:1.7;">${concern}</p>
      </div>` : ""}

      <a href="${APP_URL}/mypage/reservations" style="display:inline-block;background:#292524;color:#fff;text-decoration:none;padding:12px 28px;border-radius:999px;font-size:13px;font-weight:500;">
        予約状況を確認する
      </a>

      <p style="margin:24px 0 0;color:#a8a29e;font-size:12px;line-height:1.6;">
        ※このメールは自動送信です。心当たりのない場合はお手数ですがご連絡ください。
      </p>
    `),
  };
}

/** 予約承認メール（ユーザー向け） */
export function reservationConfirmedEmail(schedule: Schedule): { subject: string; html: string } {
  const dateStr = format(schedule.startAt, "yyyy年M月d日（E）", { locale: ja });
  const timeStr = `${format(schedule.startAt, "HH:mm")} – ${format(schedule.endAt, "HH:mm")}`;

  return {
    subject: `【予約確定】${dateStr} ${schedule.lessonPlan.name}`,
    html: wrap(`
      <h2 style="margin:0 0 8px;color:#292524;font-size:18px;font-weight:500;">
        予約が確定しました
      </h2>
      <p style="margin:0 0 24px;color:#78716c;font-size:14px;line-height:1.7;">
        以下のレッスンの予約が確定しました。<br>
        当日お会いできることを楽しみにしています！
      </p>

      <div style="background:#f0fdf4;border-radius:12px;padding:20px;margin-bottom:24px;">
        <table style="width:100%;border-collapse:collapse;font-size:13px;color:#44403c;">
          <tr>
            <td style="padding:6px 0;color:#a8a29e;width:80px;vertical-align:top;">日時</td>
            <td style="padding:6px 0;font-weight:500;">${dateStr} ${timeStr}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#a8a29e;vertical-align:top;">プラン</td>
            <td style="padding:6px 0;">${schedule.lessonPlan.name}</td>
          </tr>
          ${schedule.teeOffTime ? `
          <tr>
            <td style="padding:6px 0;color:#a8a29e;vertical-align:top;">ティーオフ</td>
            <td style="padding:6px 0;font-weight:500;color:#d97706;">${schedule.teeOffTime}</td>
          </tr>` : ""}
          ${schedule.location ? `
          <tr>
            <td style="padding:6px 0;color:#a8a29e;vertical-align:top;">場所</td>
            <td style="padding:6px 0;">${schedule.location}</td>
          </tr>` : ""}
          <tr>
            <td style="padding:6px 0;color:#a8a29e;vertical-align:top;">料金</td>
            <td style="padding:6px 0;font-weight:600;">¥${schedule.lessonPlan.price.toLocaleString()}（税込）</td>
          </tr>
        </table>
      </div>

      <a href="${APP_URL}/mypage/reservations" style="display:inline-block;background:#292524;color:#fff;text-decoration:none;padding:12px 28px;border-radius:999px;font-size:13px;font-weight:500;">
        マイページで確認する
      </a>
    `),
  };
}

/** 管理者向け新規予約通知 */
export function adminNewReservationEmail(schedule: Schedule, userName: string, userEmail: string, concern?: string): { subject: string; html: string } {
  const dateStr = format(schedule.startAt, "yyyy年M月d日（E）", { locale: ja });
  const timeStr = `${format(schedule.startAt, "HH:mm")} – ${format(schedule.endAt, "HH:mm")}`;

  return {
    subject: `【新規予約リクエスト】${userName} - ${dateStr}`,
    html: wrap(`
      <h2 style="margin:0 0 8px;color:#292524;font-size:18px;font-weight:500;">
        新しい予約リクエストが入りました
      </h2>
      <div style="background:#fafaf9;border-radius:12px;padding:20px;margin:16px 0 24px;">
        <table style="width:100%;border-collapse:collapse;font-size:13px;color:#44403c;">
          <tr>
            <td style="padding:6px 0;color:#a8a29e;width:80px;vertical-align:top;">お客様</td>
            <td style="padding:6px 0;font-weight:500;">${userName}<br><span style="color:#78716c;font-weight:normal;">${userEmail}</span></td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#a8a29e;vertical-align:top;">プラン</td>
            <td style="padding:6px 0;">${schedule.lessonPlan.name}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#a8a29e;vertical-align:top;">日時</td>
            <td style="padding:6px 0;">${dateStr} ${timeStr}</td>
          </tr>
          ${schedule.teeOffTime ? `
          <tr>
            <td style="padding:6px 0;color:#a8a29e;vertical-align:top;">ティーオフ</td>
            <td style="padding:6px 0;font-weight:500;color:#d97706;">${schedule.teeOffTime}</td>
          </tr>` : ""}
          ${schedule.location ? `
          <tr>
            <td style="padding:6px 0;color:#a8a29e;vertical-align:top;">場所</td>
            <td style="padding:6px 0;">${schedule.location}</td>
          </tr>` : ""}
          ${concern ? `
          <tr>
            <td style="padding:6px 0;color:#a8a29e;vertical-align:top;">相談内容</td>
            <td style="padding:6px 0;">${concern}</td>
          </tr>` : ""}
        </table>
      </div>
      <a href="${APP_URL}/admin/mayumi/reservations" style="display:inline-block;background:#292524;color:#fff;text-decoration:none;padding:12px 28px;border-radius:999px;font-size:13px;font-weight:500;">
        管理画面で確認する
      </a>
    `),
  };
}
