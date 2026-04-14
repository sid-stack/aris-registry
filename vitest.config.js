import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node",
    // tests/*.test.js may use node:test (npm run test:legacy) — do not glob all of tests/
    include: ["src/__tests__/**/*.test.ts", "tests/analyticsEventTaxonomy.test.js"],
  },
});
