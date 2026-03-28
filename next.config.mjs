import { join } from "path";

/** @type {import("next").NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true
  },
  reactStrictMode: true,
  webpack(config) {
    if (!config.resolve?.alias) {
      config.resolve = config.resolve || {};
      config.resolve.alias = {};
    }
    config.resolve.alias["@"] = join(process.cwd(), "src");
    return config;
  }
};

export default nextConfig;
