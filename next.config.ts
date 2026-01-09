import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  webpack: (config, { nextRuntime }) => {
    if (nextRuntime === "edge") {
      const alias = config.resolve?.alias ?? {};
      config.resolve = config.resolve ?? {};
      config.resolve.alias = {
        ...alias,
        "#crypto": path.join(
          process.cwd(),
          "node_modules/@clerk/backend/dist/runtime/browser/crypto.mjs",
        ),
        "#safe-node-apis": path.join(
          process.cwd(),
          "node_modules/@clerk/nextjs/dist/esm/runtime/browser/safe-node-apis.js",
        ),
        "@clerk/shared/buildAccountsBaseUrl": path.join(
          process.cwd(),
          "node_modules/@clerk/shared/dist/runtime/buildAccountsBaseUrl.mjs",
        ),
      };
    }
    return config;
  },
};

export default nextConfig;
