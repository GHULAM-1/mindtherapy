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
  // Explicitly define server-side environment variables
  env: {
    ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY || '',
    NEXT_ELEVENLABS_API_KEY: process.env.NEXT_ELEVENLABS_API_KEY || '',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  },
};

export default nextConfig;
