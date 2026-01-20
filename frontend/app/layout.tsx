import type { Metadata } from "next";
import { JetBrains_Mono, Geist } from "next/font/google";
import "./globals.css";

/* 专业字体组合:
 * - JetBrains Mono: 用于代码和数据数字显示
 * - Geist: 现代无衬线字体,用于界面文本
 *
 * 字体加载策略优化:
 * - display: "optional" - 字体加载不会阻塞渲染，减少 CLS
 * - preload: true - 预加载字体文件
 * - adjustFontFallback: true - 自动调整字体回退
 */
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "optional",
  preload: true,
  adjustFontFallback: true,
});

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "optional",
  preload: true,
  adjustFontFallback: true,
});

export const metadata: Metadata = {
  title: "A股专业分析系统",
  description: "传统股票分析 + AI 多智能体分析",
  // 预连接到字体源
  viewport: {
    width: "device-width",
    initialScale: 1,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={`${geist.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
