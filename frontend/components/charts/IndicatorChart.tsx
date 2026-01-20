"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface IndicatorChartProps {
  data: {
    date: string
    value: number | null
  }[]
  name: string
  color?: string
  height?: number
}

export function IndicatorChart({ data, name, color = '#3b82f6', height = 200 }: IndicatorChartProps) {
  // 过滤掉 null 值
  const validData = data.filter((d) => d.value !== null)

  return (
    <div className="w-full rounded-lg border bg-card p-4">
      <h3 className="mb-4 text-sm font-medium text-muted-foreground">{name}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={validData}>
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
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px',
            }}
            labelStyle={{ color: 'hsl(var(--foreground))' }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
            name={name}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

interface MultiIndicatorChartProps {
  data: {
    date: string
    [key: string]: string | number | null
  }[]
  indicators: {
    key: string
    name: string
    color: string
  }[]
  height?: number
}

export function MultiIndicatorChart({
  data,
  indicators,
  height = 250
}: MultiIndicatorChartProps) {
  const validData = data.filter((d) =>
    indicators.some((ind) => d[ind.key] !== null && d[ind.key] !== undefined)
  )

  return (
    <div className="w-full rounded-lg border bg-card p-4">
      <h3 className="mb-4 text-sm font-medium text-muted-foreground">技术指标</h3>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={validData}>
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
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px',
            }}
            labelStyle={{ color: 'hsl(var(--foreground))' }}
          />
          <Legend />
          {indicators.map((indicator) => (
            <Line
              key={indicator.key}
              type="monotone"
              dataKey={indicator.key}
              stroke={indicator.color}
              strokeWidth={2}
              dot={false}
              name={indicator.name}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

interface BollingerBandsChartProps {
  data: {
    date: string
    upper: number | null
    middle: number | null
    lower: number | null
    close?: number
  }[]
  height?: number
}

export function BollingerBandsChart({ data, height = 250 }: BollingerBandsChartProps) {
  const validData = data.filter(
    (d) => d.upper !== null && d.middle !== null && d.lower !== null
  )

  return (
    <div className="w-full rounded-lg border bg-card p-4">
      <h3 className="mb-4 text-sm font-medium text-muted-foreground">布林带 (BOLL)</h3>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={validData}>
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
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px',
            }}
            labelStyle={{ color: 'hsl(var(--foreground))' }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="upper"
            stroke="#ef4444"
            strokeWidth={1}
            dot={false}
            name="上轨"
          />
          <Line
            type="monotone"
            dataKey="middle"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            name="中轨"
          />
          <Line
            type="monotone"
            dataKey="lower"
            stroke="#22c55e"
            strokeWidth={1}
            dot={false}
            name="下轨"
          />
          {data.some((d) => d.close !== undefined) && (
            <Line
              type="monotone"
              dataKey="close"
              stroke="#f59e0b"
              strokeWidth={1.5}
              dot={false}
              name="收盘价"
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

interface MACDChartProps {
  data: {
    date: string
    macd: number | null
    signal: number | null
    histogram: number | null
  }[]
  height?: number
}

export function MACDChart({ data, height = 200 }: MACDChartProps) {
  const validData = data.filter(
    (d) => d.macd !== null && d.signal !== null && d.histogram !== null
  )

  return (
    <div className="w-full rounded-lg border bg-card p-4">
      <h3 className="mb-4 text-sm font-medium text-muted-foreground">MACD</h3>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={validData}>
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
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px',
            }}
            labelStyle={{ color: 'hsl(var(--foreground))' }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="macd"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            name="MACD"
          />
          <Line
            type="monotone"
            dataKey="signal"
            stroke="#ef4444"
            strokeWidth={2}
            dot={false}
            name="Signal"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
