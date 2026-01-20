"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface EquityCurveProps {
  data: {
    date: string
    equity: number
  }[]
  initialCapital: number
}

export function EquityCurve({ data, initialCapital }: EquityCurveProps) {
  // 添加基准线（买入持有）
  const benchmarkData = data.length > 0 ? [
    { date: data[0].date, equity: initialCapital, benchmark: initialCapital }
  ] : []

  for (let i = 1; i < data.length; i++) {
    const firstPrice = data[0].equity
    const currentPrice = data[i].equity
    const benchmarkReturn = (currentPrice / firstPrice) * initialCapital
    benchmarkData.push({
      date: data[i].date,
      equity: data[i].equity,
      benchmark: benchmarkReturn,
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>权益曲线</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={benchmarkData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
            <XAxis
              dataKey="date"
              stroke="#94a3b8"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#94a3b8"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `¥${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
              formatter={(value: number) => [`¥${value.toFixed(2)`, '']}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="equity"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.2}
              name="策略权益"
            />
            <Area
              type="monotone"
              dataKey="benchmark"
              stroke="#94a3b8"
              fill="#94a3b8"
              fillOpacity={0.1}
              name="基准"
              strokeDasharray="5 5"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

interface BacktestStatsProps {
  stats: {
    total_return: number
    benchmark_return: number
    excess_return: number
    max_drawdown: number
    sharpe_ratio: number
    total_trades: number
    final_capital: number
    initial_capital: number
  }
}

export function BacktestStats({ stats }: BacktestStatsProps) {
  const items = [
    {
      label: "总收益率",
      value: `${stats.total_return.toFixed(2)}%`,
      color: stats.total_return >= 0 ? "text-green-600" : "text-red-600",
    },
    {
      label: "基准收益率",
      value: `${stats.benchmark_return.toFixed(2)}%`,
      color: stats.benchmark_return >= 0 ? "text-green-600" : "text-red-600",
    },
    {
      label: "超额收益",
      value: `${stats.excess_return.toFixed(2)}%`,
      color: stats.excess_return >= 0 ? "text-green-600" : "text-red-600",
    },
    {
      label: "最大回撤",
      value: `${stats.max_drawdown.toFixed(2)}%`,
      color: "text-red-600",
    },
    {
      label: "夏普比率",
      value: stats.sharpe_ratio.toFixed(2),
      color: stats.sharpe_ratio > 1 ? "text-green-600" : "text-muted-foreground",
    },
    {
      label: "交易次数",
      value: stats.total_trades.toString(),
      color: "text-foreground",
    },
    {
      label: "初始资金",
      value: `¥${stats.initial_capital.toFixed(2)}`,
      color: "text-muted-foreground",
    },
    {
      label: "最终资金",
      value: `¥${stats.final_capital.toFixed(2)}`,
      color: stats.final_capital >= stats.initial_capital ? "text-green-600" : "text-red-600",
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>回测统计</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {items.map((item) => (
            <div key={item.label}>
              <p className="text-sm text-muted-foreground">{item.label}</p>
              <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

interface TradeListProps {
  trades: {
    date: string
    action: string
    price: number
    shares: number
  }[]
}

export function TradeList({ trades }: TradeListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>交易记录</CardTitle>
      </CardHeader>
      <CardContent>
        {trades.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">暂无交易记录</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {trades.map((trade, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <p className="text-sm text-muted-foreground">{trade.date}</p>
                  <p className="font-medium">
                    {trade.action === 'buy' ? '买入' : '卖出'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">¥{trade.price.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">{trade.shares} 股</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
