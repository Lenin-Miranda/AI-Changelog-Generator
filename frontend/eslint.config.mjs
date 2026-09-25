import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
export default defineConfig([
  ...nextVitals,
  ...nextTs,
  // Loading/reset state follows external session and request changes in client views.
  { rules: { "react-hooks/set-state-in-effect": "off" } },
  globalIgnores([
    ".next/**",
    ".next-e2e/**",
    "test-results/**",
    "playwright-report/**",
    "node_modules/**",
    "next-env.d.ts",
  ]),
]);
