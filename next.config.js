/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['lucide-react'],
  // 确保 Turbopack 在本项目目录解析模块，避免多 lockfile 时用错 node_modules
  turbopack: {
    root: __dirname,
  },
}

module.exports = nextConfig
