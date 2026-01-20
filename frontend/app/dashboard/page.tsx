"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Search, TrendingUp, TrendingDown, ArrowRight, Sparkles } from "lucide-react"
import { stockApi } from "@/lib/api"
import Link from "next/link"

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setLoading(true)
    setHasSearched(true)
    try {
      const results = await stockApi.search(searchQuery)
      setSearchResults(results)
    } catch (error) {
      console.error("搜索失败:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  const popularStocks = [
    { code: "600519", name: "贵州茅台", market: "沪市" },
    { code: "000858", name: "五粮液", market: "深市" },
    { code: "300750", name: "宁德时代", market: "创业板" },
    { code: "601318", name: "中国平安", market: "沪市" },
    { code: "000001", name: "平安银行", market: "深市" },
  ]

  return (
    <div className="space-y-6 max-w-6xl">
      {/* 搜索区域 */}
      <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold mb-1">股票搜索</h2>
              <p className="text-sm text-muted-foreground">输入股票代码或名称进行查询</p>
            </div>
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="例如: 600519 或 贵州茅台"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-10 h-11 bg-muted/30 border-border/40 focus-visible:ring-primary/50"
                />
              </div>
              <Button
                onClick={handleSearch}
                disabled={loading}
                className="h-11 px-6 bg-primary hover:bg-primary/90"
              >
                {loading ? (
                  <>
                    <Sparkles className="mr-2 h-4 w-4 animate-pulse" />
                    搜索中
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    搜索
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 搜索结果 */}
      {hasSearched && (
        <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">搜索结果</h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {searchResults.length > 0
                    ? `找到 ${searchResults.length} 只股票`
                    : "未找到相关股票"}
                </p>
              </div>
            </div>

            {searchResults.length > 0 ? (
              <div className="rounded-lg border border-border/40 overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow className="hover:bg-transparent border-border/40">
                      <TableHead className="font-medium text-muted-foreground">代码</TableHead>
                      <TableHead className="font-medium text-muted-foreground">名称</TableHead>
                      <TableHead className="font-medium text-muted-foreground text-right">现价</TableHead>
                      <TableHead className="font-medium text-muted-foreground text-right">涨跌幅</TableHead>
                      <TableHead className="font-medium text-muted-foreground text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {searchResults.map((stock, index) => (
                      <TableRow
                        key={stock.code}
                        className="border-border/40 hover:bg-muted/20 transition-colors"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <TableCell className="font-mono text-sm">{stock.code}</TableCell>
                        <TableCell className="font-medium">{stock.name}</TableCell>
                        <TableCell className="text-right font-mono">
                          {stock.price?.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {stock.change_pct >= 0 ? (
                              <TrendingUp className="h-3.5 w-3.5 stock-up" />
                            ) : (
                              <TrendingDown className="h-3.5 w-3.5 stock-down" />
                            )}
                            <span className={`font-mono ${stock.change_pct >= 0 ? "stock-up" : "stock-down"}`}>
                              {stock.change_pct >= 0 ? "+" : ""}{stock.change_pct?.toFixed(2)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="sm" className="h-8 px-3" asChild>
                              <Link href={`/dashboard/stock/${stock.code}`}>详情</Link>
                            </Button>
                            <Button size="sm" className="h-8 px-3 bg-primary/10 hover:bg-primary/20 text-primary border-primary/20" asChild>
                              <Link href={`/dashboard/analysis?code=${stock.code}`}>
                                <Sparkles className="w-3 h-3 mr-1" />
                                AI分析
                              </Link>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : !loading && (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                  <Search className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">未找到相关股票，请检查输入后重试</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 热门股票 - 未搜索时显示 */}
      {!hasSearched && (
        <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">热门股票</h3>
              <p className="text-sm text-muted-foreground mt-0.5">市场关注的热门标的</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {popularStocks.map((stock) => (
                <Link
                  key={stock.code}
                  href={`/dashboard/analysis?code=${stock.code}`}
                  className="group rounded-lg border border-border/40 bg-muted/20 p-4 hover:border-primary/40 hover:bg-muted/30 transition-all duration-200 hover-lift"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs text-muted-foreground">{stock.code}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground">
                          {stock.market}
                        </span>
                      </div>
                      <div className="font-semibold mb-1 group-hover:text-primary transition-colors">
                        {stock.name}
                      </div>
                      <div className="text-xs text-muted-foreground">点击查看 AI 分析</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
