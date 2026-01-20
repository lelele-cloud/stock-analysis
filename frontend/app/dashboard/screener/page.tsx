"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { screenerApi, ScreenerCondition, ScreenerTemplate, StockQuote } from '@/lib/api'
import { ConditionBuilder } from '@/components/screener/ConditionBuilder'
import { TemplateSelector } from '@/components/screener/TemplateSelector'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Loader2, Play, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ScreenerPage() {
  const router = useRouter()

  // 状态
  const [loading, setLoading] = useState(true)
  const [screening, setScreening] = useState(false)
  const [templates, setTemplates] = useState<ScreenerTemplate[]>([])
  const [availableFields, setAvailableFields] = useState<Record<string, { name: string; type: string; description: string }>>({})
  const [selectedTemplate, setSelectedTemplate] = useState<ScreenerTemplate | undefined>()
  const [conditions, setConditions] = useState<ScreenerCondition[]>([])
  const [strategyName, setStrategyName] = useState('自定义策略')
  const [results, setResults] = useState<any[]>([])
  const [sortBy, setSortBy] = useState('change_pct')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // 加载初始化数据
  useEffect(() => {
    async function loadInitData() {
      try {
        setLoading(true)
        const [templatesData, fieldsData] = await Promise.all([
          screenerApi.getTemplates(),
          screenerApi.getFields(),
        ])
        setTemplates(templatesData)
        setAvailableFields(fieldsData)
      } catch (error) {
        console.error('加载初始化数据失败:', error)
      } finally {
        setLoading(false)
      }
    }
    loadInitData()
  }, [])

  // 选择模板
  const handleSelectTemplate = (template: ScreenerTemplate) => {
    setSelectedTemplate(template)
    setConditions(template.conditions)
    setStrategyName(template.name)
    if (template.sort_by) setSortBy(template.sort_by)
    if (template.sort_order) setSortOrder(template.sort_order as 'asc' | 'desc')
  }

  // 执行选股
  const handleScreen = async () => {
    if (conditions.length === 0) {
      return
    }

    try {
      setScreening(true)
      setResults([])

      const response = await screenerApi.screen({
        name: strategyName,
        conditions,
        sort_by: sortBy,
        sort_order: sortOrder,
        limit: 100,
      })

      setResults(response.results || [])
    } catch (error) {
      console.error('选股失败:', error)
    } finally {
      setScreening(false)
    }
  }

  // 查看股票详情
  const handleViewStock = (code: string) => {
    router.push(`/dashboard/stock/${code}`)
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* 头部 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">选股器</h1>
            <p className="text-muted-foreground">根据条件筛选A股股票</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：条件配置 */}
          <div className="lg:col-span-1 space-y-4">
            {/* 预设策略 */}
            <TemplateSelector
              templates={templates}
              selectedTemplate={selectedTemplate}
              onSelectTemplate={handleSelectTemplate}
            />

            {/* 条件构建器 */}
            <ConditionBuilder
              conditions={conditions}
              onChange={setConditions}
              availableFields={availableFields}
            />

            {/* 策略设置 */}
            <Card>
              <CardHeader>
                <CardTitle>策略设置</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">策略名称</label>
                  <Input
                    value={strategyName}
                    onChange={(e) => setStrategyName(e.target.value)}
                    placeholder="输入策略名称"
                  />
                </div>

                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">排序字段</label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(availableFields).map(([key, info]) => (
                        <SelectItem key={key} value={key}>
                          {info.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">排序方向</label>
                  <Select value={sortOrder} onValueChange={(v: 'asc' | 'desc') => setSortOrder(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desc">降序</SelectItem>
                      <SelectItem value="asc">升序</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  className="w-full"
                  onClick={handleScreen}
                  disabled={conditions.length === 0 || screening}
                >
                  {screening ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      筛选中...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      开始选股
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* 右侧：结果展示 */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>选股结果</span>
                  {results.length > 0 && (
                    <span className="text-sm font-normal text-muted-foreground">
                      共 {results.length} 只股票
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {screening ? (
                  <div className="flex h-64 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : results.length === 0 ? (
                  <div className="flex h-64 flex-col items-center justify-center text-muted-foreground">
                    <TrendingUp className="mb-4 h-12 w-12 opacity-50" />
                    <p>选择筛选条件后点击"开始选股"</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>代码</TableHead>
                        <TableHead>名称</TableHead>
                        <TableHead className="text-right">价格</TableHead>
                        <TableHead className="text-right">涨跌幅</TableHead>
                        <TableHead className="text-right">成交量</TableHead>
                        <TableHead className="text-right">成交额</TableHead>
                        <TableHead className="text-right">市盈率</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.map((stock) => (
                        <TableRow key={stock.code}>
                          <TableCell className="font-medium">{stock.code}</TableCell>
                          <TableCell>{stock.name}</TableCell>
                          <TableCell className="text-right">¥{stock.price?.toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                            <span className={cn(
                              stock.change_pct >= 0 ? 'text-red-600' : 'text-green-600'
                            )}>
                              {stock.change_pct >= 0 ? '+' : ''}{stock.change_pct?.toFixed(2)}%
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            {(stock.volume / 10000).toFixed(0)}万手
                          </TableCell>
                          <TableCell className="text-right">
                            {(stock.amount / 100000000).toFixed(2)}亿
                          </TableCell>
                          <TableCell className="text-right">
                            {stock.pe?.toFixed(2) || '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewStock(stock.code)}
                            >
                              详情
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
