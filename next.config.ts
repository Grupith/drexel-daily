import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    if (!projectId) return [];
    // Serve Firebase's redirect helper on the app's own origin.
    return [{
      source: "/__/auth/:path*",
      destination: `https://${projectId}.firebaseapp.com/__/auth/:path*`,
    }];
  },
};

export default nextConfig;
