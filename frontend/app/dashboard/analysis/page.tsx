"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Send, Loader2 } from "lucide-react"
import { analysisApi, stockApi } from "@/lib/api"

export default function AnalysisPage() {
  const searchParams = useSearchParams()
  const stockCode = searchParams.get("code") || ""

  const [code, setCode] = useState(stockCode)
  const [taskId, setTaskId] = useState<string | null>(null)
  const [status, setStatus] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState<any>(null)

  const handleCreateAnalysis = async () => {
    if (!code.trim()) return

    setLoading(true)
    setMessages([])
    setReport(null)

    try {
      // 创建分析任务
      const task = await analysisApi.createTask(code)
      setTaskId(task.task_id)
      setStatus(task)

      // 建立 WebSocket 连接
      const ws = new WebSocket(`ws://localhost:8000/api/v1/analysis/ws/${task.task_id}`)

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data)

        if (data.type === "status") {
          setStatus(data.data)
        } else if (data.type === "agent_message") {
          setMessages((prev) => [...prev, data])
        } else if (data.type === "progress") {
          setStatus((prev: any) => ({ ...prev, progress: data.progress }))
        } else if (data.type === "completed") {
          setReport(data.data)
          setLoading(false)
          ws.close()
        } else if (data.type === "error") {
          console.error("分析错误:", data.message)
          setLoading(false)
          ws.close()
        }
      }

      ws.onerror = () => {
        console.error("WebSocket 连接错误")
        setLoading(false)
      }

      ws.onclose = () => {
        setLoading(false)
      }

    } catch (error) {
      console.error("创建分析任务失败:", error)
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* 输入股票代码 */}
      <Card>
        <CardHeader>
          <CardTitle>AI 智能体分析</CardTitle>
          <CardDescription>7 个专业 AI 智能体协作完成股票分析</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="输入股票代码 (如: 600519)"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleCreateAnalysis} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  分析中...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  开始分析
                </>
              )}
            </Button>
          </div>

          {/* 进度条 */}
          {status && status.progress > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <span>分析进度</span>
                <span>{status.progress.toFixed(0)}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${status.progress}%` }}
                />
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                状态: {status.status}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 智能体对话 */}
      {messages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>智能体对话</CardTitle>
            <CardDescription>实时查看各智能体的分析过程</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {messages.map((msg, index) => (
                <div key={index} className="flex gap-3">
                  <div className="flex-shrink-0 w-24 text-sm font-medium">
                    {getAgentName(msg.agent)}
                  </div>
                  <div className="flex-1 rounded-lg bg-muted p-3 text-sm">
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 分析报告 */}
      {report && (
        <Card>
          <CardHeader>
            <CardTitle>综合分析报告</CardTitle>
            <CardDescription>{report.stock_name} ({report.stock_code})</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="summary">
              <TabsList>
                <TabsTrigger value="summary">综合结论</TabsTrigger>
                <TabsTrigger value="fundamental">基本面</TabsTrigger>
                <TabsTrigger value="technical">技术面</TabsTrigger>
                <TabsTrigger value="decision">交易决策</TabsTrigger>
              </TabsList>

              <TabsContent value="summary" className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">研究员综合结论</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {report.research_summary}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">基本面评分</div>
                    <div className="text-2xl font-bold">{report.fundamental_score || "-"}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">情绪评分</div>
                    <div className="text-2xl font-bold">{report.sentiment_score || "-"}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">技术面评分</div>
                    <div className="text-2xl font-bold">{report.technical_score || "-"}</div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="fundamental">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {report.fundamental_analysis}
                </p>
              </TabsContent>

              <TabsContent value="technical">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {report.technical_analysis}
                </p>
              </TabsContent>

              <TabsContent value="decision" className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">交易员建议</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {report.trading_decision}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">风险评估</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {report.risk_assessment}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">目标价</div>
                    <div className="text-xl font-bold text-red-500">
                      {report.target_price || "-"}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">止损价</div>
                    <div className="text-xl font-bold text-green-500">
                      {report.stop_loss || "-"}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function getAgentName(agent: string): string {
  const names: Record<string, string> = {
    fundamental: "基本面分析师",
    sentiment: "情绪分析师",
    news: "新闻分析师",
    technical: "技术分析师",
    researcher: "研究员",
    trader: "交易员",
    risk_manager: "风险管理师",
  }
  return names[agent] || agent
}
