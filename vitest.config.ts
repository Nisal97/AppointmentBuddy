import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    /* Resolve the @/* path alias used by Next.js/TypeScript */
    alias: {
      "@": path.resolve(process.cwd(), "./src"),
    },
  },
  test: {
    /* Directory where unit tests live */
    include: ["unit-tests/**/*.test.ts"],
    /* Use a Node environment (no DOM needed for gender helpers) */
    environment: "node",
    /* Enable type checking of test files */
    typecheck: {
      enabled: true,
    },
    /* Clear mocks between tests */
    clearMocks: true,
  },
});
