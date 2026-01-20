"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { backtestApi, BacktestTemplate, BacktestRequest } from '@/lib/api'
import { EquityCurve, BacktestStats, TradeList } from '@/components/backtest'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Loader2, Play, TrendingUp } from 'lucide-react'

export default function BacktestPage() {
  const router = useRouter()

  // 状态
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [templates, setTemplates] = useState<BacktestTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<BacktestTemplate | undefined>()

  // 回测参数
  const [stockCode, setStockCode] = useState('600519')
  const [strategyType, setStrategyType] = useState('sma_cross')
  const [strategyParams, setStrategyParams] = useState<Record<string, any>>({})
  const [startDate, setStartDate] = useState('20230101')
  const [endDate, setEndDate] = useState('20241231')
  const [initialCapital, setInitialCapital] = useState(100000)

  // 回测结果
  const [result, setResult] = useState<any>(null)

  // 加载初始化数据
  useEffect(() => {
    async function loadInitData() {
      try {
        setLoading(true)
        const templatesData = await backtestApi.getTemplates()
        setTemplates(templatesData)

        // 选择第一个模板
        if (templatesData.length > 0) {
          const firstTemplate = templatesData[0]
          setSelectedTemplate(firstTemplate)
          setStrategyType(firstTemplate.id)

          // 设置默认参数
          const defaultParams: Record<string, any> = {}
          Object.entries(firstTemplate.params).forEach(([key, param]) => {
            defaultParams[key] = param.default
          })
          setStrategyParams(defaultParams)
        }
      } catch (error) {
        console.error('加载初始化数据失败:', error)
      } finally {
        setLoading(false)
      }
    }
    loadInitData()
  }, [])

  // 选择策略
  const handleSelectStrategy = (template: BacktestTemplate) => {
    setSelectedTemplate(template)
    setStrategyType(template.id)

    // 设置默认参数
    const defaultParams: Record<string, any> = {}
    Object.entries(template.params).forEach(([key, param]) => {
      defaultParams[key] = param.default
    })
    setStrategyParams(defaultParams)
  }

  // 更新策略参数
  const handleUpdateParam = (key: string, value: number) => {
    setStrategyParams({ ...strategyParams, [key]: value })
  }

  // 执行回测
  const handleRunBacktest = async () => {
    if (!stockCode) {
      return
    }

    try {
      setRunning(true)
      setResult(null)

      const request: BacktestRequest = {
        stock_code: stockCode,
        strategy_type: strategyType,
        strategy_params: strategyParams,
        start_date: startDate,
        end_date: endDate,
        initial_capital: initialCapital,
      }

      const response = await backtestApi.run(request)
      setResult(response)
    } catch (error) {
      console.error('回测失败:', error)
    } finally {
      setRunning(false)
    }
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
            <h1 className="text-2xl font-bold">策略回测</h1>
            <p className="text-muted-foreground">测试交易策略的历史表现</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：配置 */}
          <div className="lg:col-span-1 space-y-4">
            {/* 策略选择 */}
            <Card>
              <CardHeader>
                <CardTitle>选择策略</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {templates.map((template) => (
                  <Button
                    key={template.id}
                    variant={selectedTemplate?.id === template.id ? 'default' : 'outline'}
                    className="w-full justify-start"
                    onClick={() => handleSelectStrategy(template)}
                  >
                    <div className="text-left">
                      <div className="font-medium">{template.name}</div>
                      <div className="text-xs text-muted-foreground">{template.description}</div>
                    </div>
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* 策略参数 */}
            <Card>
              <CardHeader>
                <CardTitle>策略参数</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>股票代码</Label>
                  <Input
                    value={stockCode}
                    onChange={(e) => setStockCode(e.target.value)}
                    placeholder="600519"
                  />
                </div>

                {selectedTemplate && Object.entries(selectedTemplate.params).length > 0 && (
                  <div className="space-y-3">
                    <Label>参数设置</Label>
                    {Object.entries(selectedTemplate.params).map(([key, param]) => (
                      <div key={key}>
                        <Label className="text-sm text-muted-foreground">{param.name}</Label>
                        <Input
                          type="number"
                          value={strategyParams[key] || param.default}
                          onChange={(e) => handleUpdateParam(key, parseFloat(e.target.value) || param.default)}
                          min={param.min}
                          max={param.max}
                        />
                      </div>
                    ))}
                  </div>
                )}

                <div>
                  <Label>开始日期</Label>
                  <Input
                    type="text"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    placeholder="20230101"
                  />
                </div>

                <div>
                  <Label>结束日期</Label>
                  <Input
                    type="text"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    placeholder="20241231"
                  />
                </div>

                <div>
                  <Label>初始资金</Label>
                  <Input
                    type="number"
                    value={initialCapital}
                    onChange={(e) => setInitialCapital(parseFloat(e.target.value) || 100000)}
                    step={10000}
                  />
                </div>

                <Button
                  className="w-full"
                  onClick={handleRunBacktest}
                  disabled={running || !stockCode}
                >
                  {running ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      回测中...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      开始回测
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* 右侧：结果 */}
          <div className="lg:col-span-2 space-y-4">
            {running ? (
              <Card>
                <CardContent className="flex h-64 items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </CardContent>
              </Card>
            ) : !result ? (
              <Card>
                <CardContent className="flex h-64 flex-col items-center justify-center text-muted-foreground">
                  <TrendingUp className="mb-4 h-12 w-12 opacity-50" />
                  <p>选择策略并点击"开始回测"</p>
                </CardContent>
              </Card>
            ) : (
              <>
                <BacktestStats stats={result} />
                <EquityCurve data={result.equity_curve} initialCapital={result.initial_capital} />
                <TradeList trades={result.trades} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
