/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // 外部图片走 next/image 服务端优化（取一次→缓存→WebP→懒加载），
    // 绕开 opengraph.githubassets.com 的客户端并发 429，并保 Lighthouse。
    remotePatterns: [
      { protocol: "https", hostname: "opengraph.githubassets.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "cdn-thumbnails.huggingface.co" },
    ],
  },
};

export default nextConfig;
