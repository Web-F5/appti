import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Allow images from common avatar/logo sources
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: '**.neon.tech' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
    ],
  },

  // Expose public env vars to the browser
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  },
}

export default nextConfig
