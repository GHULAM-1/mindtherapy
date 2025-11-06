import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverActions: {
    bodySizeLimit: '50mb',
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'gjipnyrufwqwdclriisk.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
