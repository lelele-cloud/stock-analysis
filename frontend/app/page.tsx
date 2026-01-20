import Link from "next/link";
import { ArrowRight, TrendingUp, Brain, BarChart3, Zap, Shield, Target } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* 顶部导航 */}
      <nav className="border-b border-border/40 bg-card/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-lg">StockAnalysis</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <span className="hidden sm:inline">A股专业分析系统</span>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
              <span className="text-xs">系统在线</span>
            </div>
          </div>
        </div>
      </nav>

      {/* 主内容区 */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20">
        <div className="max-w-4xl w-full space-y-12">
          {/* 标题区 */}
          <div className="text-center space-y-6 animate-in">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
              <Zap className="w-3.5 h-3.5" />
              <span>AI 驱动的智能分析</span>
            </div>
            <h1 className="text-5xl sm:text-6xl font-bold tracking-tight">
              <span className="text-gradient">A股智能分析</span>
              <br />
              <span className="text-foreground/90">专业终端</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              融合传统技术分析与 7 个 AI 智能体协作框架，为您提供全方位的股票投资决策支持
            </p>
          </div>

          {/* 功能卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 传统分析 */}
            <Link
              href="/dashboard"
              className="group relative overflow-hidden rounded-lg border border-border bg-card p-6 hover:border-primary/50 transition-all duration-300 hover-lift"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <BarChart3 className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                  传统分析
                </h2>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                  K线图表、技术指标、基本面数据、选股器、回测引擎
                </p>
                <div className="flex items-center text-sm text-primary font-medium">
                  进入控制台
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>

            {/* AI 智能体分析 */}
            <Link
              href="/dashboard/analysis"
              className="group relative overflow-hidden rounded-lg border border-border bg-card p-6 hover:border-primary/50 transition-all duration-300 hover-lift"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Brain className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                  AI 智能体分析
                </h2>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                  7 个 AI 智能体协作完成股票分析决策，多空辩论，综合研判
                </p>
                <div className="flex items-center text-sm text-primary font-medium">
                  开始分析
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          </div>

          {/* 特性列表 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <Target className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-medium mb-1">精准数据</h3>
                <p className="text-sm text-muted-foreground">Akshare 实时数据源</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <Brain className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-medium mb-1">AI 协作</h3>
                <p className="text-sm text-muted-foreground">7 智能体多轮辩论</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-medium mb-1">风险评估</h3>
                <p className="text-sm text-muted-foreground">全面风险管控</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 页脚 */}
      <footer className="border-t border-border/40 py-6">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-muted-foreground">
          <p>专业 A股分析系统 · 数据仅供参考，不构成投资建议</p>
        </div>
      </footer>
    </div>
  );
}
