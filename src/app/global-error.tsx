"use client";

import { useEffect } from "react";

/**
 * 最上位のレイアウトごと表示できなかった場合の最終的なエラー表示。
 * ここではサイト共通のスタイルが読み込まれていない可能性があるので、
 * インラインスタイルだけで組む。
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="ja">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#fafaf9",
          color: "#292524",
          fontFamily:
            "'Helvetica Neue', Arial, 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', sans-serif",
        }}
      >
        <div style={{ maxWidth: 420, padding: "48px 24px", textAlign: "center" }}>
          <h1 style={{ fontSize: 18, fontWeight: 500, margin: "0 0 12px" }}>
            一時的に表示できませんでした
          </h1>
          <p style={{ fontSize: 14, lineHeight: 1.8, color: "#78716c", margin: "0 0 32px" }}>
            通信が不安定か、サーバーが混み合っている可能性があります。
            <br />
            少し待ってから、もう一度お試しください。
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              height: 44,
              padding: "0 32px",
              border: "none",
              borderRadius: 999,
              background: "#292524",
              color: "#fff",
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            もう一度読み込む
          </button>
          <p style={{ margin: "20px 0 0" }}>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- レイアウトが壊れた状態なのでページ全体を読み込み直す */}
            <a href="/" style={{ fontSize: 14, color: "#78716c" }}>
              トップページへ
            </a>
          </p>
        </div>
      </body>
    </html>
  );
}
