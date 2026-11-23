# データの保存の仕組みと、もしものときの復旧手順

予約・スケジュール・指導メモなどのデータは、Supabase Storage の `app-data` バケットに
JSON ファイルとして保存しています（1 種類のデータ = 1 ファイル）。

| ファイル | 中身 |
| --- | --- |
| `reservations.json` | 予約 |
| `schedules.json` | レッスン枠 |
| `plans.json` / `lesson-plans.json` | レッスンプラン（後者は旧データ） |
| `profile.json` | 講師プロフィール |
| `instructor-notes.json` | 指導メモ |
| `drills.json` / `scores.json` / `notes.json` | ドリル / スコア / お客様のノート |

## コードを書くときの決まり

読み書きは必ず `src/lib/storage.ts` の 2 つの関数を使います。

- 読むだけ → `readJsonFromStorage(path, fallback, { shape })`
- 書き換える → `updateJsonInStorage(path, fallback, (current) => ({ data, result }), { shape })`

「ファイル全体をそのまま保存する」関数はありません。1 ファイルに全件が入っているため、
手元の古いデータや読み込みに失敗した空のデータで上書きすると全件が消えるからです。
`updateJsonInStorage` は次のことを保証します（実装は `src/lib/storage-core.ts`）。

1. **読めなかったら保存しない** — ファイルが存在しない場合だけ初期値を使い、通信障害などは必ずエラーにする
2. **同時の操作で片方が消えない** — ファイルごとの排他ロックの中で「最新を読む → 変更 → 保存」を行う
3. **一度に 2 件以上減る保存は拒否する** — どの操作も 1 件ずつしか削除しないため
4. **毎日バックアップを残す** — その日最初の保存のとき、直前の内容を `backups/` に保存（90 日分）

「空きがあるか確認してから予約を追加」のような判定は、`updateJsonInStorage` に渡す関数の中に
書いてください（判定と保存の間に別の操作が割り込めなくなります）。

バケットには、データ以外に次のフォルダができます。消しても動作に影響はありません。

- `locks/<ファイル名>/` — 排他ロックの目印（自動で片付けられる）
- `backups/<ファイル名>/<日付>.json` — バックアップ
- `__health__/` — 動作確認用のファイル

## テスト

```bash
npm test
```

通信障害・同時実行・処理の中断を再現し、上の 1〜4 が守られることを確かめます。
保存まわりを変更したら必ず実行してください。

## ローカルでの動作確認（本番につながない）

`.env` は本番の Supabase と Resend を指しています。`npm run dev` のまま予約やメモの保存を
試すと、本番のお客様データが書き換わり、実際にメールが送られます。
保存を伴う確認は、疑似バックエンドにつないだ開発サーバーで行ってください。

```bash
# ターミナル 1: 疑似バックエンド（ログイン情報が表示される。データはメモリ上のみ）
node scripts/mock-backend.mjs

# ターミナル 2: 疑似バックエンドにつないだ開発サーバー
rm -rf .next/dev
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54399 NEXT_PUBLIC_SUPABASE_ANON_KEY=mock-anon-key \
SUPABASE_SERVICE_ROLE_KEY=mock-service-role-key RESEND_API_KEY=re_mock_key \
RESEND_BASE_URL=http://127.0.0.1:54399/resend ADMIN_EMAIL= NEXT_PUBLIC_APP_URL=http://localhost:3111 \
npm run dev -- --port 3111
```

- 送信されたメール・保存されたデータは `http://127.0.0.1:54399/__mock/state` で確認できます
- 通信障害の再現: `curl -X POST http://127.0.0.1:54399/__mock/mode -H 'content-type: application/json' -d '{"storageReadFail":true}'`
  （`storageWriteFail` / `revoked`（ログイン切れ）も同様。`false` で解除）
- 終わったら `rm -rf .next/dev`（疑似環境向けのビルドを残さない）

## 本番の保存経路の確認（デプロイ後）

管理者ログインなしで、本番の「ロック → 読み込み → 保存」が動いていることを確かめられます。
確認専用のファイルだけを使い、実データには触れません。

```bash
TOKEN=$(node --env-file=.env -e 'console.log(require("crypto").createHmac("sha256", process.env.SUPABASE_SERVICE_ROLE_KEY).update("storage-health-v1").digest("hex"))')
curl -s -X POST https://golf-lesson-app-mayumi.vercel.app/api/health/storage -H "x-health-token: $TOKEN"
```

`{"ok":true, ...}` が返れば正常です。`region` が `hnd1`（東京）であることも確認できます。

## バックアップからの復旧

データが消えた・壊れた場合の手順です。

1. Supabase ダッシュボード → Storage → `app-data` → `backups/<ファイル名>/` を開く
2. 問題が起きる前の日付のファイルをダウンロードする
   （`2026-11-24.json` は「11/24 の最初の保存の直前」＝ 11/23 終了時点の内容）
3. 現在のファイル（例: `reservations.json`）も念のためダウンロードして手元に残す
4. バックアップ以降に追加された分が必要なら、手元で 2 つを突き合わせて 1 つのファイルにまとめる
5. まとめたファイルを、元のファイル名で `app-data` の直下にアップロード（上書き）する

復旧中は管理画面・予約フォームからの保存と競合しないよう、利用の少ない時間帯に行ってください。
