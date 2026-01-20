import Link from "next/link";
import { ArrowRight, TrendingUp, Brain, BarChart3, Zap, Shield, Target, Sparkles, ChevronRight } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col overflow-hidden">
      {/* 背景动画效果 */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-1/2 -right-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-1/2 -left-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl animate-pulse delay-700" />
      </div>

      {/* 顶部导航 */}
      <nav className="border-b border-border/40 bg-card/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-all duration-300">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-lg tracking-tight">StockAnalysis</span>
          </Link>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <span className="hidden sm:inline text-muted-foreground/80">A股专业分析系统</span>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 border border-success/20">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-xs font-medium text-success">系统在线</span>
            </div>
          </div>
        </div>
      </nav>

      {/* 主内容区 */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 relative">
        <div className="max-w-5xl w-full space-y-16">
          {/* 标题区 */}
          <div className="text-center space-y-8">
            {/* 顶部标签 */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-blue-500/10 border border-primary/20 text-primary text-sm font-medium animate-in hover:scale-105 transition-transform duration-300 cursor-default">
              <Sparkles className="w-4 h-4" />
              <span>AI 驱动的智能分析平台</span>
              <ChevronRight className="w-4 h-4" />
            </div>

            {/* 主标题 */}
            <h1 className="text-5xl sm:text-7xl font-bold tracking-tight leading-tight">
              <span className="block bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
                A股智能分析
              </span>
              <span className="block text-4xl sm:text-5xl mt-2 text-gradient">专业终端</span>
            </h1>

            {/* 副标题 */}
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              融合传统技术分析与 <span className="text-primary font-semibold">7 个 AI 智能体</span> 协作框架
              <br />
              为您提供全方位的股票投资决策支持
            </p>

            {/* CTA 按钮 */}
            <div className="flex items-center justify-center gap-4 pt-4">
              <Link
                href="/dashboard"
                className="group inline-flex items-center gap-2 px-8 py-3 rounded-lg bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300 hover:scale-105"
              >
                开始使用
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/dashboard/analysis"
                className="inline-flex items-center gap-2 px-8 py-3 rounded-lg bg-card border border-border hover:border-primary/50 font-semibold transition-all duration-300 hover:scale-105"
              >
                AI 分析
              </Link>
            </div>
          </div>

          {/* 功能卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 传统分析 */}
            <Link
              href="/dashboard"
              className="group relative overflow-hidden rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-8 hover:border-primary/50 transition-all duration-500 hover-lift"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <BarChart3 className="w-7 h-7 text-primary" />
                </div>
                <h2 className="text-2xl font-semibold mb-3 group-hover:text-primary transition-colors">
                  传统分析
                </h2>
                <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                  K线图表、技术指标、基本面数据、智能选股器、回测引擎等专业工具
                </p>
                <div className="flex items-center text-sm text-primary font-medium">
                  查看详情
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>

            {/* AI 智能体分析 */}
            <Link
              href="/dashboard/analysis"
              className="group relative overflow-hidden rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-8 hover:border-primary/50 transition-all duration-500 hover-lift"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Brain className="w-7 h-7 text-blue-500" />
                </div>
                <h2 className="text-2xl font-semibold mb-3 group-hover:text-blue-500 transition-colors">
                  AI 智能体分析
                </h2>
                <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                  7 个 AI 智能体协作完成股票分析决策，多空辩论，综合研判
                </p>
                <div className="flex items-center text-sm text-blue-500 font-medium">
                  开始分析
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          </div>

          {/* 特性列表 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8">
            <div className="flex items-start gap-4 p-4 rounded-lg bg-card/30 border border-border/30 hover:border-primary/30 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-transparent flex items-center justify-center flex-shrink-0">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">精准数据</h3>
                <p className="text-sm text-muted-foreground">Akshare 实时数据源，同步市场行情</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 rounded-lg bg-card/30 border border-border/30 hover:border-blue-500/30 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-transparent flex items-center justify-center flex-shrink-0">
                <Brain className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">AI 协作</h3>
                <p className="text-sm text-muted-foreground">7 智能体多轮辩论，深入分析</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 rounded-lg bg-card/30 border border-border/30 hover:border-success/30 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-success/20 to-transparent flex items-center justify-center flex-shrink-0">
                <Shield className="w-6 h-6 text-success" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">风险管控</h3>
                <p className="text-sm text-muted-foreground">全面风险评估，智能止损建议</p>
              </div>
            </div>
          </div>

          {/* 数据统计 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-8">
            {[
              { label: "实时行情", value: "A股全市场" },
              { label: "技术指标", value: "20+ 项" },
              { label: "AI 智能体", value: "7 个" },
              { label: "数据更新", value: "实时同步" },
            ].map((stat, index) => (
              <div
                key={index}
                className="text-center p-4 rounded-lg bg-card/20 border border-border/20"
              >
                <div className="text-2xl font-bold text-gradient mb-1">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* 页脚 */}
      <footer className="border-t border-border/40 py-6 bg-card/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>专业 A股分析系统 · 数据仅供参考，不构成投资建议</p>
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="hover:text-primary transition-colors">控制台</Link>
              <span>·</span>
              <Link href="/dashboard/analysis" className="hover:text-primary transition-colors">AI 分析</Link>
              <span>·</span>
              <Link href="/dashboard/settings" className="hover:text-primary transition-colors">设置</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
