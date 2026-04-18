import { config as loadEnv } from "dotenv";
import { defineConfig } from "vitest/config";

// Optional local overrides (not committed): INTEGRATION_TAB_URL, INTEGRATION_API_URL
loadEnv({ path: ".env.integration.local" });
loadEnv({ path: ".env.production" });

export default defineConfig({
  test: {
    environment: "node",
    fileParallelism: false,
    hookTimeout: 60_000,
    include: ["integration/**/*.integration.test.ts"],
    sequence: { concurrent: false },
    testTimeout: 60_000,
  },
});
