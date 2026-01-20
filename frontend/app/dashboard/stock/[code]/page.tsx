"use client"

import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { stockApi } from '@/lib/api'
import { StockQuote, KLineData, FundamentalData } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2 } from 'lucide-react'

// 动态导入所有图表组件，禁用 SSR 以提升首次加载性能
const CandlestickChart = dynamic(() => import('@/components/charts').then(m => m.CandlestickChart), {
  loading: () => <ChartSkeleton />,
  ssr: false,
})

const MultiIndicatorChart = dynamic(() => import('@/components/charts').then(m => m.MultiIndicatorChart), {
  loading: () => <ChartSkeleton />,
  ssr: false,
})

const MACDChart = dynamic(() => import('@/components/charts').then(m => m.MACDChart), {
  loading: () => <ChartSkeleton />,
  ssr: false,
})

const IndicatorChart = dynamic(() => import('@/components/charts').then(m => m.IndicatorChart), {
  loading: () => <ChartSkeleton />,
  ssr: false,
})

const BollingerBandsChart = dynamic(() => import('@/components/charts').then(m => m.BollingerBandsChart), {
  loading: () => <ChartSkeleton />,
  ssr: false,
})

const StockInfoCard = dynamic(() => import('@/components/stock').then(m => m.StockInfoCard), {
  loading: () => <CardSkeleton />,
  ssr: true,
})

const FundamentalCard = dynamic(() => import('@/components/stock').then(m => m.FundamentalCard), {
  loading: () => <CardSkeleton />,
  ssr: true,
})

// 图表骨架屏
function ChartSkeleton() {
  return (
    <div className="w-full h-[300px] flex items-center justify-center bg-muted/20 rounded-md animate-pulse">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  )
}

// 卡片骨架屏
function CardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-3">
          <div className="h-4 bg-muted/40 rounded w-1/3 animate-pulse" />
          <div className="h-8 bg-muted/30 rounded w-1/2 animate-pulse" />
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-muted/20 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// 简单的内存缓存
const cache = new Map<string, any>()

function getCacheKey(stockCode: string, period: string) {
  return `stock_${stockCode}_${period}`
}

export default function StockDetailPage() {
  const params = useParams()
  const router = useRouter()
  const code = params.code as string

  const [loading, setLoading] = useState(true)
  const [quote, setQuote] = useState<StockQuote | null>(null)
  const [klineData, setKlineData] = useState<KLineData[]>([])
  const [fundamental, setFundamental] = useState<FundamentalData | null>(null)
  const [indicators, setIndicators] = useState<any>({})
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily')

  // 使用 ref 来追踪请求是否被取消
  const abortControllerRef = useRef<AbortController | null>(null)

  // 股票数据 - 使用 useMemo 缓存计算结果
  const indicatorData = useMemo(() => {
    return klineData.map((k, index) => ({
      date: k.date,
      sma: indicators.sma?.values?.[index] ?? null,
      ema: indicators.ema?.values?.[index] ?? null,
      rsi: indicators.rsi?.values?.[index] ?? null,
      kdj_k: indicators.kdj?.k?.[index] ?? null,
      kdj_d: indicators.kdj?.d?.[index] ?? null,
      kdj_j: indicators.kdj?.j?.[index] ?? null,
      boll_upper: indicators.boll?.upper?.[index] ?? null,
      boll_middle: indicators.boll?.middle?.[index] ?? null,
      boll_lower: indicators.boll?.lower?.[index] ?? null,
      close: k.close,
    }))
  }, [klineData, indicators])

  const macdData = useMemo(() => {
    return klineData.map((k, index) => ({
      date: k.date,
      macd: indicators.macd?.macd?.[index] ?? null,
      signal: indicators.macd?.signal?.[index] ?? null,
      histogram: indicators.macd?.histogram?.[index] ?? null,
    }))
  }, [klineData, indicators])

  const bollData = useMemo(() => {
    return klineData.map((k, index) => ({
      date: k.date,
      upper: indicators.boll?.upper?.[index] ?? null,
      middle: indicators.boll?.middle?.[index] ?? null,
      lower: indicators.boll?.lower?.[index] ?? null,
      close: k.close,
    }))
  }, [klineData, indicators])

  // 优化后的数据获取函数
  const fetchData = useCallback(async (signal?: AbortSignal) => {
    if (!code) return

    try {
      setLoading(true)
      setError(null)

      const cacheKey = getCacheKey(code, period)
      const cached = cache.get(cacheKey)

      // 并行获取基础数据
      const [quoteData, klineResult, fundamentalData] = await Promise.all([
        stockApi.getQuote(code),
        stockApi.getKLine(code, { period }),
        stockApi.getFundamental(code).catch(() => null),
      ])

      // 检查请求是否被取消
      if (signal?.aborted) return

      setQuote(quoteData)
      setKlineData(klineResult)
      setFundamental(fundamentalData)

      // 如果有缓存且周期未变，复用技术指标数据
      if (cached && cached.period === period) {
        setIndicators(cached.indicators)
      } else {
        // 并行获取所有技术指标
        const [sma, ema, macd, rsi, kdj, boll] = await Promise.all([
          fetch(`/api/v1/stocks/${code}/indicators/sma?period=20`, { signal })
            .then(res => res.json())
            .catch(() => null),
          fetch(`/api/v1/stocks/${code}/indicators/ema?period=20`, { signal })
            .then(res => res.json())
            .catch(() => null),
          fetch(`/api/v1/stocks/${code}/indicators/macd`, { signal })
            .then(res => res.json())
            .catch(() => null),
          fetch(`/api/v1/stocks/${code}/indicators/rsi?period=14`, { signal })
            .then(res => res.json())
            .catch(() => null),
          fetch(`/api/v1/stocks/${code}/indicators/kdj`, { signal })
            .then(res => res.json())
            .catch(() => null),
          fetch(`/api/v1/stocks/${code}/indicators/boll?period=20`, { signal })
            .then(res => res.json())
            .catch(() => null),
        ])

        if (signal?.aborted) return

        const newIndicators = { sma, ema, macd, rsi, kdj, boll }
        setIndicators(newIndicators)

        // 缓存结果（最多缓存 10 个股票的数据）
        if (cache.size >= 10) {
          const firstKey = cache.keys().next().value
          cache.delete(firstKey)
        }
        cache.set(cacheKey, { indicators: newIndicators, period })
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return // 请求被取消，不处理
      }
      console.error('获取股票数据失败:', err)
      setError('获取股票数据失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }, [code, period])

  useEffect(() => {
    // 取消之前的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // 创建新的 AbortController
    abortControllerRef.current = new AbortController()

    fetchData(abortControllerRef.current.signal)

    // 清理函数
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [fetchData])

  // 处理周期切换
  const handlePeriodChange = useCallback((newPeriod: 'daily' | 'weekly' | 'monthly') => {
    if (newPeriod !== period) {
      setPeriod(newPeriod)
    }
  }, [period])

  if (loading && !quote) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex items-center gap-4">
            <Button disabled variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="h-8 w-48 bg-muted/30 rounded animate-pulse" />
          </div>
          <CardSkeleton />
          <Card />
          <CardContent className="p-6">
            <ChartSkeleton />
          </CardContent>
        </div>
      </div>
    )
  }

  if (error || !quote) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <p className="text-lg text-muted-foreground">{error || '股票未找到'}</p>
        <Button onClick={() => router.back()} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* 头部 */}
        <div className="flex items-center gap-4">
          <Button onClick={() => router.back()} variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">{quote.name} ({quote.code})</h1>
        </div>

        {/* 股票信息 */}
        <StockInfoCard quote={quote} />

        {/* K线图 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>K线图</CardTitle>
              <div className="flex gap-2">
                {(['daily', 'weekly', 'monthly'] as const).map((p) => (
                  <Button
                    key={p}
                    variant={period === p ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handlePeriodChange(p)}
                  >
                    {p === 'daily' ? '日K' : p === 'weekly' ? '周K' : '月K'}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <CandlestickChart data={klineData} height={400} />
          </CardContent>
        </Card>

        {/* 技术指标 */}
        <Tabs defaultValue="ma" className="space-y-4">
          <TabsList>
            <TabsTrigger value="ma">移动平均</TabsTrigger>
            <TabsTrigger value="macd">MACD</TabsTrigger>
            <TabsTrigger value="kdj">KDJ</TabsTrigger>
            <TabsTrigger value="rsi">RSI</TabsTrigger>
            <TabsTrigger value="boll">布林带</TabsTrigger>
          </TabsList>

          <TabsContent value="ma" className="space-y-4">
            <MultiIndicatorChart
              data={indicatorData}
              indicators={[
                { key: 'sma', name: 'SMA(20)', color: '#3b82f6' },
                { key: 'ema', name: 'EMA(20)', color: '#ef4444' },
              ]}
            />
          </TabsContent>

          <TabsContent value="macd">
            <MACDChart data={macdData} />
          </TabsContent>

          <TabsContent value="kdj" className="space-y-4">
            <MultiIndicatorChart
              data={indicatorData}
              indicators={[
                { key: 'kdj_k', name: 'K', color: '#3b82f6' },
                { key: 'kdj_d', name: 'D', color: '#ef4444' },
                { key: 'kdj_j', name: 'J', color: '#22c55e' },
              ]}
            />
          </TabsContent>

          <TabsContent value="rsi">
            <IndicatorChart
              data={indicatorData.map(d => ({ date: d.date, value: d.rsi }))}
              name="RSI(14)"
              color="#8b5cf6"
            />
          </TabsContent>

          <TabsContent value="boll">
            <BollingerBandsChart data={bollData} />
          </TabsContent>
        </Tabs>

        {/* 基本面数据 */}
        {fundamental && <FundamentalCard data={fundamental} />}
      </div>
    </div>
  )
}
