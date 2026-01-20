import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StockQuote } from '@/lib/api'

interface StockInfoCardProps {
  quote: StockQuote
}

export function StockInfoCard({ quote }: StockInfoCardProps) {
  const isPositive = quote.change >= 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{quote.name}</h2>
            <p className="text-sm text-muted-foreground">{quote.code}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold">¥{quote.price.toFixed(2)}</p>
            <p className={`text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? '+' : ''}{quote.change.toFixed(2)} ({isPositive ? '+' : ''}{quote.change_pct.toFixed(2)}%)
            </p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div>
            <p className="text-sm text-muted-foreground">今开</p>
            <p className="text-lg font-semibold">¥{quote.open.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">最高</p>
            <p className="text-lg font-semibold text-red-600">¥{quote.high.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">最低</p>
            <p className="text-lg font-semibold text-green-600">¥{quote.low.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">昨收</p>
            <p className="text-lg font-semibold">¥{quote.close_prev.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">成交量</p>
            <p className="text-lg font-semibold">{(quote.volume / 10000).toFixed(2)}万手</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">成交额</p>
            <p className="text-lg font-semibold">{(quote.amount / 100000000).toFixed(2)}亿</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface FundamentalCardProps {
  data: {
    pe: number | null
    pb: number | null
    ps: number | null
    roe: number | null
    roa: number | null
    gross_margin: number | null
    net_margin: number | null
    debt_ratio: number | null
  }
}

export function FundamentalCard({ data }: FundamentalCardProps) {
  const metrics = [
    { label: '市盈率 (PE)', value: data.pe, unit: '倍', format: (v: number) => v.toFixed(2) },
    { label: '市净率 (PB)', value: data.pb, unit: '倍', format: (v: number) => v.toFixed(2) },
    { label: '市销率 (PS)', value: data.ps, unit: '倍', format: (v: number) => v.toFixed(2) },
    { label: '净资产收益率 (ROE)', value: data.roe, unit: '%', format: (v: number) => v.toFixed(2) },
    { label: '总资产收益率 (ROA)', value: data.roa, unit: '%', format: (v: number) => v.toFixed(2) },
    { label: '毛利率', value: data.gross_margin, unit: '%', format: (v: number) => v.toFixed(2) },
    { label: '净利率', value: data.net_margin, unit: '%', format: (v: number) => v.toFixed(2) },
    { label: '资产负债率', value: data.debt_ratio, unit: '%', format: (v: number) => v.toFixed(2) },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>基本面数据</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {metrics.map((metric) => (
            <div key={metric.label}>
              <p className="text-sm text-muted-foreground">{metric.label}</p>
              <p className="text-lg font-semibold">
                {metric.value !== null ? `${metric.format(metric.value)}${metric.unit}` : '-'}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
