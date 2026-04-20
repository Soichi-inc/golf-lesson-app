import type { MetadataRoute } from "next";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  "https://golf-lesson-app-mayumi.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/mypage/", "/reserve/", "/auth/"],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
  };
}
