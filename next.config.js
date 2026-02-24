const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})
module.exports = withBundleAnalyzer({
  // Next.js 16 默认用 Turbopack；有 webpack 配置（如 bundle-analyzer）时需声明 turbopack 以消除提示
  turbopack: {},
})