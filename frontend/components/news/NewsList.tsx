"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ExternalLink } from 'lucide-react'

interface NewsItem {
  title: string
  content: string
  url: string
  source: string
  publish_time: string
  sentiment: 'positive' | 'negative' | 'neutral'
}

interface NewsListProps {
  news: NewsItem[]
  title?: string
}

export function NewsList({ news, title = "相关新闻" }: NewsListProps) {
  const getSentimentBadge = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return <Badge variant="default" className="bg-green-600">利好</Badge>
      case 'negative':
        return <Badge variant="destructive">利空</Badge>
      default:
        return <Badge variant="outline">中性</Badge>
    }
  }

  if (news.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-4">暂无相关新闻</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title} ({news.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {news.map((item, index) => (
            <div
              key={index}
              className="group rounded-lg border p-4 transition-colors hover:bg-muted/50"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    {getSentimentBadge(item.sentiment)}
                    <span className="text-xs text-muted-foreground">{item.source}</span>
                    <span className="text-xs text-muted-foreground">{item.publish_time}</span>
                  </div>
                  <h3 className="font-medium leading-tight group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  {item.content && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {item.content}
                    </p>
                  )}
                </div>
                {item.url && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="flex-shrink-0"
                    onClick={() => window.open(item.url, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

interface NewsSummaryProps {
  news: NewsItem[]
}

export function NewsSummary({ news }: NewsSummaryProps) {
  // 统计情感分布
  const sentimentCounts = news.reduce(
    (acc, item) => {
      acc[item.sentiment]++
      return acc
    },
    { positive: 0, negative: 0, neutral: 0 }
  )

  // 计算情绪得分
  const total = news.length
  const score = total > 0
    ? ((sentimentCounts.positive - sentimentCounts.negative) / total * 100).toFixed(1)
    : '0.0'

  const getScoreColor = () => {
    const numScore = parseFloat(score)
    if (numScore > 20) return 'text-green-600'
    if (numScore < -20) return 'text-red-600'
    return 'text-muted-foreground'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>新闻情绪分析</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* 情绪得分 */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">情绪得分</span>
            <span className={`text-2xl font-bold ${getScoreColor()}`}>
              {score > 0 ? '+' : ''}{score}
            </span>
          </div>

          {/* 情绪分布 */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{sentimentCounts.positive}</p>
              <p className="text-sm text-muted-foreground">利好</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{sentimentCounts.neutral}</p>
              <p className="text-sm text-muted-foreground">中性</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{sentimentCounts.negative}</p>
              <p className="text-sm text-muted-foreground">利空</p>
            </div>
          </div>

          {/* 进度条 */}
          {total > 0 && (
            <div className="space-y-2">
              <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="bg-green-600"
                  style={{ width: `${(sentimentCounts.positive / total) * 100}%` }}
                />
                <div
                  className="bg-muted-foreground"
                  style={{ width: `${(sentimentCounts.neutral / total) * 100}%` }}
                />
                <div
                  className="bg-red-600"
                  style={{ width: `${(sentimentCounts.negative / total) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>利好 {((sentimentCounts.positive / total) * 100).toFixed(0)}%</span>
                <span>中性 {((sentimentCounts.neutral / total) * 100).toFixed(0)}%</span>
                <span>利空 {((sentimentCounts.negative / total) * 100).toFixed(0)}%</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
