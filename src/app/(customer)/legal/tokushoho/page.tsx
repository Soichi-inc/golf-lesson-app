import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "特定商取引法に基づく表記",
  description: "奥村真由美ゴルフレッスンの特定商取引法に基づく表記",
};

export default function TokushohoPage() {
  return (
    <>
      <h1>特定商取引法に基づく表記</h1>

      <table>
        <tbody>
          <tr>
            <th>事業者名</th>
            <td>奥村 真由美</td>
          </tr>
          <tr>
            <th>所在地</th>
            <td>請求があり次第遅滞なく開示いたします</td>
          </tr>
          <tr>
            <th>連絡先</th>
            <td>mayumi_okumura@outlook.com</td>
          </tr>
          <tr>
            <th>販売価格</th>
            <td>
              各レッスンプランのページに記載の金額（税込）
              <br />
              例：プライベートレッスン 50分 ¥13,000
            </td>
          </tr>
          <tr>
            <th>追加手数料等の追加料金</th>
            <td>
              施設利用料が別途発生する場合があります。
              <br />
              撮影オプション（スイング動画＋ポイント解説）: ¥3,000
            </td>
          </tr>
          <tr>
            <th>支払方法</th>
            <td>
              レッスン当日に会場にて下記方法にてお支払いいただきます。
              <ul>
                <li>クレジットカード決済（Square）</li>
                <li>現金</li>
                <li>PayPay</li>
              </ul>
            </td>
          </tr>
          <tr>
            <th>支払時期</th>
            <td>レッスン当日</td>
          </tr>
          <tr>
            <th>サービス提供時期</th>
            <td>
              ご予約いただいた日時にレッスンを提供いたします。
              予約は講師の承認後に確定します。
            </td>
          </tr>
          <tr>
            <th>返品・キャンセルについて</th>
            <td>
              <a href="/legal/cancel-policy">キャンセルポリシー</a>
              をご確認ください。
            </td>
          </tr>
          <tr>
            <th>動作環境</th>
            <td>
              最新版のGoogle Chrome、Safari、Edge、Firefoxでのご利用を推奨します。
            </td>
          </tr>
        </tbody>
      </table>
    </>
  );
}
