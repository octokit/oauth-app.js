import { defineConfig } from "vite";

export default defineConfig({
  test: {
    coverage: {
      include: ["src/**/*.ts"],
      exclude: ["src/methods/get-oauth-client-code.ts"], // Exclude this file from coverage as it isn't exported
      reporter: ["html"],
      thresholds: {
        branches: 97,
        functions: 96,
        lines: 99,
        statements: 99,
      },
    },
  },
});
