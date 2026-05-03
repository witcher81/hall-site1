import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // XSS: אל תזריק HTML גולמי מקלט משתמש בלי סניטציה מוכחת
      "react/no-danger": "error",
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "CallExpression[callee.type='MemberExpression'][callee.property.type='Identifier'][callee.property.name='$executeRawUnsafe']",
          message:
            "Avoid $executeRawUnsafe — use prisma.$executeRaw(Prisma.sql`...${bound}`) so values are never concatenated into SQL strings.",
        },
        {
          selector:
            "CallExpression[callee.type='MemberExpression'][callee.property.type='Identifier'][callee.property.name='$queryRawUnsafe']",
          message:
            "Avoid $queryRawUnsafe — use prisma.$queryRaw(Prisma.sql`...${bound}`) so values are never concatenated into SQL strings.",
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
