import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    // 日時の表示・日付の判定は必ず日本時間で行う。
    // サーバー（Vercel）は世界標準時で動くため、date-fns の関数を直接使うと
    // 時刻が 9 時間ずれたり、日本時間の 0〜9 時に「今日」が前日扱いになったりする。
    files: ["src/**/*.{ts,tsx}"],
    ignores: [
      "src/lib/datetime.ts",
      "src/lib/datetime.test.ts",
      "src/lib/email/templates.ts",
      "src/components/ui/**",
    ],
    rules: {
      // 管理者の判定に user_metadata.role を使わない（本人が書き換えられるため）。lib/auth/role.ts を使う
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "MemberExpression[property.name='role'][object.property.name='user_metadata']",
          message:
            "user_metadata は利用者本人が書き換えられます。管理者の判定には @/lib/auth/role の isAdminUser（app_metadata.role）を使ってください。",
        },
      ],
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "date-fns",
              importNames: [
                "format",
                "isSameDay",
                "isSameMonth",
                "isToday",
                "isTomorrow",
                "isYesterday",
                "startOfDay",
                "endOfDay",
                "startOfMonth",
                "endOfMonth",
                "differenceInCalendarDays",
                "differenceInDays",
              ],
              message:
                "日時は日本時間で扱います。@/lib/datetime の関数（formatJst / jstDateKey / isSameJstDay など）を使ってください。",
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
