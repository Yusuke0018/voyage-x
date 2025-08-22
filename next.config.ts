import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: process.env.NODE_ENV === 'production' ? '/voyage' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/voyage' : '',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
