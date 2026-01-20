"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { stockApi } from '@/lib/api'
import { StockQuote, KLineData, FundamentalData } from '@/lib/api'
import { StockInfoCard, FundamentalCard } from '@/components/stock'
import { CandlestickChart, IndicatorChart, MultiIndicatorChart, BollingerBandsChart, MACDChart } from '@/components/charts'
import { NewsList, NewsSummary } from '@/components/news'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2 } from 'lucide-react'

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
  const [news, setNews] = useState<any[]>([])

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        setError(null)

        // 并行获取数据
        const [quoteData, klineResult, fundamentalData] = await Promise.all([
          stockApi.getQuote(code),
          stockApi.getKLine(code, { period }),
          stockApi.getFundamental(code).catch(() => null),
        ])

        setQuote(quoteData)
        setKlineData(klineResult)
        setFundamental(fundamentalData)

        // 获取技术指标
        const [sma, ema, macd, rsi, kdj, boll] = await Promise.all([
          stockApi.getKLine(code, { period }).then(data =>
            fetch(`/api/v1/stocks/${code}/indicators/sma?period=20`)
              .then(res => res.json())
              .catch(() => null)
          ),
          fetch(`/api/v1/stocks/${code}/indicators/ema?period=20`)
            .then(res => res.json())
            .catch(() => null),
          fetch(`/api/v1/stocks/${code}/indicators/macd`)
            .then(res => res.json())
            .catch(() => null),
          fetch(`/api/v1/stocks/${code}/indicators/rsi?period=14`)
            .then(res => res.json())
            .catch(() => null),
          fetch(`/api/v1/stocks/${code}/indicators/kdj`)
            .then(res => res.json())
            .catch(() => null),
          fetch(`/api/v1/stocks/${code}/indicators/boll?period=20`)
            .then(res => res.json())
            .catch(() => null),
        ])

        setIndicators({ sma, ema, macd, rsi, kdj, boll })

        // 获取新闻（从 AI 分析结果中获取）
        try {
          const analysisResponse = await fetch('/api/v1/analysis/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              stock_code: code,
              analysis_type: 'comprehensive',
            }),
          })
          if (analysisResponse.ok) {
            const analysisData = await analysisResponse.json()
            // 可以从分析结果中获取新闻，但这里我们暂时使用空数组
            setNews([])
          }
        } catch (e) {
          // 新闻获取失败不影响其他功能
          setNews([])
        }
      } catch (err) {
        console.error('获取股票数据失败:', err)
        setError('获取股票数据失败，请稍后重试')
      } finally {
        setLoading(false)
      }
    }

    if (code) {
      fetchData()
    }
  }, [code, period])

  // 处理周期切换
  const handlePeriodChange = (newPeriod: 'daily' | 'weekly' | 'monthly') => {
    setPeriod(newPeriod)
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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

  // 准备图表数据
  const indicatorData = klineData.map((k, index) => ({
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

  const macdData = klineData.map((k, index) => ({
    date: k.date,
    macd: indicators.macd?.macd?.[index] ?? null,
    signal: indicators.macd?.signal?.[index] ?? null,
    histogram: indicators.macd?.histogram?.[index] ?? null,
  }))

  const bollData = klineData.map((k, index) => ({
    date: k.date,
    upper: indicators.boll?.upper?.[index] ?? null,
    middle: indicators.boll?.middle?.[index] ?? null,
    lower: indicators.boll?.lower?.[index] ?? null,
    close: k.close,
  }))

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* 头部 */}
        <div className="flex items-center gap-4">
          <Button onClick={() => router.back()} variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">股票详情</h1>
        </div>

        {/* 股票信息 */}
        <StockInfoCard quote={quote} />

        {/* K线图 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>K线图</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant={period === 'daily' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePeriodChange('daily')}
                >
                  日K
                </Button>
                <Button
                  variant={period === 'weekly' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePeriodChange('weekly')}
                >
                  周K
                </Button>
                <Button
                  variant={period === 'monthly' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePeriodChange('monthly')}
                >
                  月K
                </Button>
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

        {/* 新闻 */}
        {news.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <NewsList news={news} title="相关新闻" />
            </div>
            <div>
              <NewsSummary news={news} />
            </div>
          </div>
        )}

        {/* 基本面数据 */}
        {fundamental && <FundamentalCard data={fundamental} />}
      </div>
    </div>
  )
}
