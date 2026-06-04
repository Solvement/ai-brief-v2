/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // 外部图片走 next/image 服务端优化（取一次→缓存→WebP→懒加载），
    // 绕开 opengraph.githubassets.com 的客户端并发 429，并保 Lighthouse。
    remotePatterns: [
      { protocol: "https", hostname: "opengraph.githubassets.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "cdn-thumbnails.huggingface.co" },
      // 新闻 og:image 来自任意新闻站 CDN，无法枚举 → 允许所有 https 主机走优化器
      // (个人站可接受；生产 Vercel 图片 CDN 会缓存优化结果)。
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
