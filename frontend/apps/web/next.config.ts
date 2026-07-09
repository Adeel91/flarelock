import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  logging: {
    browserToTerminal: false,
  },
  transpilePackages: ["@flarelock/ui", "@flarelock/web3", "@flarelock/config"],
};

export default nextConfig;
