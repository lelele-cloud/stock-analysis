"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LineChart, Search, Filter, BarChart, Brain, Settings, Activity, ChevronRight, Home } from "lucide-react"
import { memo } from "react"

// 导航配置
const navItems = [
  {
    title: "股票搜索",
    href: "/dashboard",
    icon: Search,
    description: "查询股票信息",
    gradient: "from-blue-500/20 to-blue-500/5",
  },
  {
    title: "选股器",
    href: "/dashboard/screener",
    icon: Filter,
    description: "多维度股票筛选",
    gradient: "from-purple-500/20 to-purple-500/5",
  },
  {
    title: "策略回测",
    href: "/dashboard/backtest",
    icon: BarChart,
    description: "历史策略回测",
    gradient: "from-green-500/20 to-green-500/5",
  },
  {
    title: "AI 智能分析",
    href: "/dashboard/analysis",
    icon: Brain,
    description: "7 智能体协作分析",
    gradient: "from-orange-500/20 to-orange-500/5",
  },
  {
    title: "模型配置",
    href: "/dashboard/settings",
    icon: Settings,
    description: "LLM 配置管理",
    gradient: "from-slate-500/20 to-slate-500/5",
  },
]

// 导航项组件（使用 memo 优化性能）
const NavItem = memo(({
  item,
  isActive,
}: {
  item: typeof navItems[0]
  isActive: boolean
}) => {
  const Icon = item.icon

  return (
    <Link
      href={item.href}
      className={cn(
        "group relative flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition-all duration-200 overflow-hidden",
        isActive
          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
          : "hover:bg-muted/50 hover:text-foreground text-muted-foreground"
      )}
    >
      {/* 激活状态的背景渐变 */}
      {isActive && (
        <div className={cn(
          "absolute inset-0 bg-gradient-to-r opacity-100",
          item.gradient
        )} />
      )}

      {/* 悬停时的背景渐变 */}
      {!isActive && (
        <div className={cn(
          "absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-200",
          item.gradient
        )} />
      )}

      <div className="relative flex items-center gap-3 flex-1">
        <Icon className={cn(
          "h-5 w-5 transition-transform duration-200 flex-shrink-0",
          isActive ? "scale-110" : "group-hover:scale-110"
        )} />
        <div className="flex flex-col min-w-0">
          <span className="font-medium truncate">{item.title}</span>
          {!isActive && (
            <span className="text-[10px] opacity-60 truncate">{item.description}</span>
          )}
        </div>
      </div>

      {/* 激活指示器 */}
      {isActive && (
        <ChevronRight className="h-4 w-4 flex-shrink-0 animate-in slide-in-from-right" />
      )}
    </Link>
  )
})

NavItem.displayName = "NavItem"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="flex min-h-screen bg-background">
      {/* 侧边栏 */}
      <aside className="w-64 border-r border-border/40 bg-card/30 backdrop-blur-sm flex flex-col">
        {/* Logo 区 */}
        <div className="flex h-16 items-center gap-3 border-b border-border/40 px-5">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-all duration-300 group-hover:scale-105">
              <LineChart className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm leading-tight">StockAnalysis</span>
              <span className="text-[10px] text-muted-foreground leading-tight">专业终端</span>
            </div>
          </Link>
        </div>

        {/* 导航菜单 */}
        <nav className="flex-1 space-y-1.5 p-3 overflow-y-auto">
          {/* 返回首页链接 */}
          <Link
            href="/"
            className="group flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all duration-200 mb-2"
          >
            <Home className="h-4 w-4 group-hover:scale-110 transition-transform" />
            <span className="font-medium">返回首页</span>
          </Link>

          {/* 分隔线 */}
          <div className="h-px bg-border/40 my-2" />

          {/* 导航项 */}
          {navItems.map((item) => (
            <NavItem
              key={item.href}
              item={item}
              isActive={pathname === item.href}
            />
          ))}
        </nav>

        {/* 底部状态 */}
        <div className="p-4 border-t border-border/40">
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-muted/20 border border-border/30">
            <div className="relative">
              <Activity className="w-3.5 h-3.5 text-success" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-success animate-ping" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-medium">系统运行中</span>
              <span className="text-[10px] text-muted-foreground">数据实时同步</span>
            </div>
          </div>
        </div>
      </aside>

      {/* 主内容区 */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* 顶部栏 */}
        <header className="h-16 border-b border-border/40 bg-card/20 backdrop-blur-sm flex items-center justify-between px-6">
          <div className="flex items-center gap-4 min-w-0">
            <h1 className="text-lg font-semibold tracking-tight truncate">
              {navItems.find((item) => item.href === pathname)?.title || "控制台"}
            </h1>
            {navItems.find((item) => item.href === pathname)?.description && (
              <>
                <span className="text-muted-foreground flex-shrink-0">·</span>
                <span className="text-sm text-muted-foreground truncate">
                  {navItems.find((item) => item.href === pathname)?.description}
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-primary font-medium">数据实时</span>
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
