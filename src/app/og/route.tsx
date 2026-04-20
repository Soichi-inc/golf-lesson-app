import { ImageResponse } from "next/og";

// 常にエッジランタイムで高速生成
export const runtime = "edge";

/**
 * 動的OG画像 (1200x630)
 * 使い方: /og?title=...&subtitle=...
 * 引数なしの場合はデフォルトコピーを表示
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const title = searchParams.get("title") || "奥村真由美ゴルフレッスン";
  const subtitle =
    searchParams.get("subtitle") ||
    "LPGA・TPI認定プロによる個人指導";

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          background:
            "linear-gradient(135deg, #1c1917 0%, #292524 55%, #44403c 100%)",
          padding: "80px",
          position: "relative",
        }}
      >
        {/* アクセントライン */}
        <div
          style={{
            position: "absolute",
            top: 80,
            left: 80,
            width: 60,
            height: 1,
            backgroundColor: "#b8945f",
          }}
        />

        {/* Brand */}
        <div
          style={{
            display: "flex",
            color: "#b8945f",
            fontSize: 22,
            letterSpacing: 8,
            textTransform: "uppercase",
            marginBottom: 20,
            marginTop: 40,
            fontWeight: 500,
          }}
        >
          Pro Golf Lesson
        </div>

        {/* Main Title */}
        <div
          style={{
            display: "flex",
            color: "#ffffff",
            fontSize: 78,
            fontWeight: 300,
            lineHeight: 1.2,
            marginBottom: 24,
            letterSpacing: -1,
          }}
        >
          {title}
        </div>

        {/* Subtitle */}
        <div
          style={{
            display: "flex",
            color: "rgba(255, 255, 255, 0.65)",
            fontSize: 30,
            fontWeight: 300,
            lineHeight: 1.5,
            letterSpacing: 1,
          }}
        >
          {subtitle}
        </div>

        {/* Bottom meta */}
        <div
          style={{
            position: "absolute",
            bottom: 60,
            left: 80,
            display: "flex",
            gap: 32,
            color: "rgba(255, 255, 255, 0.5)",
            fontSize: 18,
            letterSpacing: 3,
            textTransform: "uppercase",
            fontWeight: 500,
          }}
        >
          <span>LPGA Member</span>
          <span>TPI Certified</span>
          <span>Yokohama / Tokyo</span>
        </div>

        {/* Right accent */}
        <div
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 0,
            width: 8,
            background:
              "linear-gradient(180deg, transparent, #b8945f, transparent)",
          }}
        />
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
