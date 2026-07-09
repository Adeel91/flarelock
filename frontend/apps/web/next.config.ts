import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@flarelock/ui", "@flarelock/web3", "@flarelock/config"],
};

export default nextConfig;
