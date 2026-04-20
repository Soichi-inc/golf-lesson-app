# 正式ローンチ前チェックリスト

このドキュメントでは、本番ローンチ前に管理者が実施する必要がある
運用作業・設定作業をまとめています。コード側の実装は完了済みで、
下記の設定を行うだけで各機能が有効化されます。

---

## 1. 管理者アカウント移行（必須）

既存の `user_metadata.role === "ADMIN"` を `app_metadata.role` に移行します。
`user_metadata` はクライアント側から書き換え可能なため、権限情報は
サーバー側のみ書込可能な `app_metadata` に格納する必要があります。

```bash
# ローカルから実行
npx tsx scripts/migrate-admin-role.ts
```

新しい管理者を追加する場合：
```bash
npx tsx scripts/create-admin.ts <email> <password>
# または既存ユーザーを昇格
npx tsx scripts/set-admin.ts <email>
```

---

## 2. Supabase 本番設定（必須）

### Site URL / Redirect URLs
Supabase Dashboard → Authentication → URL Configuration

- **Site URL**: `https://golf-lesson-app-mayumi.vercel.app`（または独自ドメイン）
- **Redirect URLs** に以下を全て追加：
  - `https://<本番URL>/auth/callback`
  - `https://<本番URL>/auth/reset-password`

### Email Templates（任意）
Supabase Dashboard → Authentication → Email Templates で
確認メール・パスワードリセットメールのテンプレートを日本語化可能。

---

## 3. Resend 独自ドメイン設定（推奨）

現在は `onboarding@resend.dev` をフォールバックで使用しています。
本番では独自ドメインを検証してSPF/DKIMを設定する必要があります。

### 手順
1. 独自ドメイン（例: `mayumi-golf.com`）を取得
2. Resend Dashboard → Domains → Add Domain
3. 表示されたDNS TXTレコード（SPF/DKIM）を独自ドメインのDNSに追加
4. 検証完了を待つ
5. Vercel の環境変数に設定：
   ```
   RESEND_FROM_EMAIL=noreply@mayumi-golf.com
   ```
6. デプロイし直す

これによりメールがスパム判定されにくくなり、ブランディングも向上します。

---

## 4. Google Analytics 4（推奨）

コードには既にトラッキングコンポーネント(`GoogleAnalytics.tsx`)が
組み込まれており、環境変数を設定するだけで有効化されます。

### 手順
1. https://analytics.google.com/ で新しいプロパティを作成
2. Measurement ID（例: `G-XXXXXXXXXX`）を取得
3. Vercel の環境変数に設定：
   ```
   NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
   ```
4. デプロイし直す

---

## 5. Sentry エラー監視（推奨）

コードには既に Sentry の統合が組み込まれており、環境変数を
設定するだけで本番環境のエラーが Sentry で確認できるようになります。

### 手順
1. https://sentry.io/ で新しい Next.js プロジェクトを作成
2. DSN を取得
3. Vercel の環境変数に設定：
   ```
   NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
   SENTRY_DSN=https://xxx@sentry.io/xxx
   SENTRY_ORG=<org-slug>
   SENTRY_PROJECT=<project-slug>
   SENTRY_AUTH_TOKEN=<auth-token>  # source map アップロード用
   ```
4. デプロイし直す

開発環境では自動的に無効化されます（`NODE_ENV === "production"` のみ有効）。

---

## 6. Vercel 本番設定

### カスタムドメイン
Vercel Dashboard → Settings → Domains

- 独自ドメインを追加（例: `mayumi-golf.com`）
- DNS設定（Vercel表示のCNAME/Aレコード）
- 環境変数を更新：
  ```
  NEXT_PUBLIC_APP_URL=https://mayumi-golf.com
  ```

### 環境変数一覧（確認用）
本番に設定すべき環境変数：
```
# 必須
DATABASE_URL=
DIRECT_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
NEXT_PUBLIC_APP_URL=

# 推奨
RESEND_FROM_EMAIL=noreply@<独自ドメイン>
ADMIN_EMAIL=pro@<独自ドメイン>

# 任意（有効化で機能オン）
NEXT_PUBLIC_GA_MEASUREMENT_ID=
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_DSN=
SENTRY_ORG=
SENTRY_PROJECT=
SENTRY_AUTH_TOKEN=
```

---

## 7. ローンチ当日チェック

- [ ] 本番URL `/` にアクセスしてトップページが表示される
- [ ] 新規ユーザー登録 → メールが届く
- [ ] ログイン → マイページに遷移
- [ ] 予約リクエスト送信 → 顧客と管理者にメールが届く
- [ ] 管理画面で予約を承認 → 顧客にメール
- [ ] 管理画面で顧客カルテを開ける
- [ ] 指導メモを公開で保存 → 顧客にメール
- [ ] パスワードリセットフローが動く
- [ ] 法的4ページ（privacy/terms/tokushoho/cancel-policy）が表示される
- [ ] SNSシェア時のOG画像が表示される（https://www.opengraph.xyz/ で確認）

---

## 8. 将来対応（ローンチ後）

以下は今回のスコープ外ですが、運用規模が拡大した際に対応を推奨：

- **PostgreSQL本格利用**: 現状 Supabase Storage の JSON ファイル管理。
  同時書き込み時の競合可能性あり。利用者が増えたら Prisma に移行推奨。
- **OG画像専用デザイン**: 現状はコード生成のシンプルなもの。
  ブランド感のあるOG画像をデザイナーに依頼推奨。
- **定期バックアップ**: Supabase Storage のJSON・Auth ユーザーを
  定期的にエクスポート・バックアップする仕組み。
