/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  logging: false,
  turbopack: {
    root: __dirname,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Content-Security-Policy: defence-in-depth against XSS.
          // script-src 'self' + unsafe-eval is required by Next.js/Turbopack in dev/prod.
          // img-src allows data: URIs (avatars) and DALL-E/OpenAI CDN for generated images.
          // connect-src allows the OpenAI API and Supabase for client-side requests.
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://*.openai.com https://*.oaiusercontent.com https://*.supabase.co https://*.googleusercontent.com https://www.google-analytics.com",
              "font-src 'self' data:",
              "media-src 'self' blob:",
              "connect-src 'self' https://*.openai.com https://*.supabase.co https://*.supabase.in wss://*.supabase.co https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com",
              "frame-ancestors 'none'",
              "object-src 'none'",
              "base-uri 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig
