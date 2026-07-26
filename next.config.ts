import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: []
  },
  experimental: {
    serverActions: {
      // Property photos are validated at up to 4 MB each and several can be
      // attached at once. The default Server Action body limit is 1 MB, which
      // is what caused the "server-side exception" on image save. Raise it to
      // comfortably hold a multi-image multipart payload plus overhead.
      bodySizeLimit: '30mb'
    }
  }
};

export default nextConfig;
