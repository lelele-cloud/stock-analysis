"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { TrendingUp, LineChart, Brain, Search, Settings, Activity, Filter, BarChart } from "lucide-react"

const navItems = [
  {
    title: "股票搜索",
    href: "/dashboard",
    icon: Search,
    description: "查询股票信息",
  },
  {
    title: "选股器",
    href: "/dashboard/screener",
    icon: Filter,
    description: "多维度股票筛选",
  },
  {
    title: "策略回测",
    href: "/dashboard/backtest",
    icon: BarChart,
    description: "历史策略回测",
  },
  {
    title: "AI 智能分析",
    href: "/dashboard/analysis",
    icon: Brain,
    description: "7 智能体协作分析",
  },
  {
    title: "模型配置",
    href: "/dashboard/settings",
    icon: Settings,
    description: "LLM 配置管理",
  },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="flex min-h-screen bg-background">
      {/* 侧边栏 */}
      <aside className="w-64 border-r border-border/40 bg-card/30 backdrop-blur-sm">
        {/* Logo 区 */}
        <div className="flex h-16 items-center gap-3 border-b border-border/40 px-6">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center group-hover:scale-105 transition-transform">
              <LineChart className="h-4 w-4 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm leading-tight">StockAnalysis</span>
              <span className="text-[10px] text-muted-foreground leading-tight">专业终端</span>
            </div>
          </Link>
        </div>

        {/* 导航菜单 */}
        <nav className="space-y-1 p-3">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-all duration-200",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "hover:bg-muted/50 hover:text-foreground text-muted-foreground"
                )}
              >
                <Icon className={cn(
                  "h-4 w-4 transition-transform",
                  isActive ? "scale-110" : "group-hover:scale-110"
                )} />
                <div className="flex-1">
                  <div className="font-medium">{item.title}</div>
                  {!isActive && (
                    <div className="text-[10px] opacity-60">{item.description}</div>
                  )}
                </div>
                {isActive && (
                  <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground animate-pulse" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* 底部状态 */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border/40">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Activity className="w-3 h-3 text-success animate-pulse" />
            <span>系统运行中</span>
          </div>
        </div>
      </aside>

      {/* 主内容区 */}
      <main className="flex-1 flex flex-col">
        {/* 顶部栏 */}
        <header className="h-16 border-b border-border/40 bg-card/20 backdrop-blur-sm flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold tracking-tight">
              {navItems.find((item) => item.href === pathname)?.title || "控制台"}
            </h1>
            {navItems.find((item) => item.href === pathname)?.description && (
              <span className="text-sm text-muted-foreground">
                · {navItems.find((item) => item.href === pathname)?.description}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/30 border border-border/40 text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              <span className="text-muted-foreground">数据实时</span>
            </div>
          </div>
        </header>

        {/* 页面内容 */}
        <div className="flex-1 overflow-auto">
          <div className="p-6">{children}</div>
        </div>
      </main>
    </div>
  )
}
