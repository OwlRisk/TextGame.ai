/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  logging: false,
  turbopack: {
    root: __dirname,
  },
  experimental: {
    inlineCss: true,
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-dialog',
      '@radix-ui/react-switch',
      '@radix-ui/react-popover',
      '@radix-ui/react-tooltip',
      '@radix-ui/react-scroll-area',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-separator',
      '@radix-ui/react-label',
      '@radix-ui/react-slot',
      'recharts',
      'date-fns',
      'sonner',
    ],
  },
  compiler: {
    removeConsole:
      process.env.NODE_ENV === 'production'
        ? { exclude: ['error', 'warn'] }
        : false,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    qualities: [75, 90, 100],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co', pathname: '/storage/v1/object/public/**' },
    ],
  },
  async redirects() {
    return [
      // www → non-www canonical redirect
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.textgame.ai' }],
        destination: 'https://textgame.ai/:path*',
        permanent: true,
      },
    ];
  },
  async headers() {
    const securityHeaders = [
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      {
        key: 'Content-Security-Policy',
        value: [
          "default-src 'self'",
          "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: blob: https://*.openai.com https://*.oaiusercontent.com https://*.supabase.co https://*.googleusercontent.com https://www.google-analytics.com",
          "font-src 'self' data:",
          "media-src 'self' blob: https://*.supabase.co",
          "connect-src 'self' https://*.openai.com https://*.supabase.co https://*.supabase.in wss://*.supabase.co https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com https://*.sentry.io https://*.ingest.sentry.io",
          "frame-ancestors 'none'",
          "object-src 'none'",
          "base-uri 'self'",
        ].join('; '),
      },
    ];
    return [
      { source: '/:path*', headers: securityHeaders },
      // Content-Language headers for locale routes
      { source: '/:locale(zh)/:path*', headers: [...securityHeaders, { key: 'Content-Language', value: 'zh-CN' }] },
      { source: '/:locale(ja|ko|es|fr|de|pt|ru|it|ar|hi|tr|id|vi|th|pl|nl|uk)/:path*', headers: [...securityHeaders, { key: 'Content-Language', value: ':locale' }] },
    ];
  },
}

const { withSentryConfig } = require('@sentry/nextjs');
const withBundleAnalyzer = require('@next/bundle-analyzer')({ enabled: process.env.ANALYZE === 'true' });

const hasSentryToken = !!process.env.SENTRY_AUTH_TOKEN;

module.exports = withSentryConfig(withBundleAnalyzer(nextConfig), {
  org: process.env.SENTRY_ORG ?? '',
  project: process.env.SENTRY_PROJECT ?? '',
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
  telemetry: false,
  sourcemaps: { disable: !hasSentryToken },
  release: { create: hasSentryToken },
  widenClientFileUpload: true,
  webpack: {
    treeshake: { removeDebugLogging: true },
    automaticVercelMonitors: true,
  },
})
