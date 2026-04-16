import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@quran/core", "@quran/data", "@quran/i18n"],
};

export default nextConfig;
