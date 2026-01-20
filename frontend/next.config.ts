import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // 忽略由浏览器扩展引起的 hydration 警告
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

// 禁用 hydration 差异警告（由浏览器扩展引起）
if (process.env.NODE_ENV !== 'production') {
  const originalError = console.error;
  console.error = (...args: any[]) => {
    if (typeof args[0] === 'string' && args[0].includes('Text content did not match')) {
      return;
    }
    if (typeof args[0] === 'string' && args[0].includes('Hydration')) {
      return;
    }
    originalError.call(console, ...args);
  };
}

export default nextConfig;
