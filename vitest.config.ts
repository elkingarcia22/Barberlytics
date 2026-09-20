import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "./src") },
  },
  test: {
    include: ["src/**/*.test.{ts,tsx}"],
    exclude: ["e2e/**", "node_modules/**"],
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: false,
    css: false,
    coverage: {
      provider: "v8",
      include: ["src/lib/**", "src/features/**", "src/themes/**", "src/app/**"],
      exclude: ["**/*.test.*", "**/index.ts"],
    },
  },
});
