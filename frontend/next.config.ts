import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  // 实验性功能 - 优化包导入
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts'],
  },

  // 代码分割和模块优化
  webpack: (config, { isServer }) => {
    // 优化 chunk 分割策略
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            // 将 React 相关库打包到单独的 chunk
            react: {
              test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
              name: 'react',
              priority: 40,
            },
            // 将图表库分离
            charts: {
              test: /[\\/]node_modules[\\/](recharts|lightweight-charts)[\\/]/,
              name: 'charts',
              priority: 30,
            },
            // UI 组件库
            ui: {
              test: /[\\/]node_modules[\\/](@radix-ui|lucide-react)[\\/]/,
              name: 'ui',
              priority: 20,
            },
            // 其他 node_modules
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendor',
              priority: 10,
            },
          },
        },
      };
    }

    return config;
  },

  // 压缩优化
  compress: true,

  // 生产环境优化
  productionBrowserSourceMaps: false,

  // 图片优化
  images: {
    formats: ['image/webp', 'image/avif'],
  },

  // 预取优化
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
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
