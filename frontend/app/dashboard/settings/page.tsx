"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Check, X, TestTube, ExternalLink, Key, Globe, Sparkles, AlertCircle } from "lucide-react"
import { llmApi, LLMProvider } from "@/lib/api"

// 将 OpenRouter 模型按厂商分组
const groupOpenRouterModels = (models: string[]) => {
  const groups: { [key: string]: string[] } = {
    "OpenAI": [],
    "Anthropic": [],
    "Google": [],
    "DeepSeek": [],
    "Meta": [],
    "Mistral AI": [],
    "其他": [],
  }

  models.forEach((model) => {
    if (model.startsWith("openai/")) groups["OpenAI"].push(model)
    else if (model.startsWith("anthropic/")) groups["Anthropic"].push(model)
    else if (model.startsWith("google/")) groups["Google"].push(model)
    else if (model.startsWith("deepseek/")) groups["DeepSeek"].push(model)
    else if (model.startsWith("meta-llama/")) groups["Meta"].push(model)
    else if (model.startsWith("mistralai/")) groups["Mistral AI"].push(model)
    else groups["其他"].push(model)
  })

  return groups
}

export default function SettingsPage() {
  const [providers, setProviders] = useState<LLMProvider[]>([])
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null)
  const [selectedModel, setSelectedModel] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [testing, setTesting] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<{ [key: string]: { success: boolean; message: string } }>({})

  // 本地编辑的 API Key 状态
  const [apiKeys, setApiKeys] = useState<{ [key: string]: string }>({})
  const [baseUrls, setBaseUrls] = useState<{ [key: string]: string }>({})

  useEffect(() => {
    loadProviders()
  }, [])

  const loadProviders = async () => {
    setLoading(true)
    try {
      const data = await llmApi.getProviders()
      setProviders(data.providers)
      setSelectedProvider(data.selected_provider)
      setSelectedModel(data.selected_model)

      // 初始化本地状态（不显示已保存的 API Key）
      const urls: { [key: string]: string } = {}
      data.providers.forEach((p) => {
        if (p.base_url) urls[p.provider] = p.base_url
      })
      setBaseUrls(urls)
    } catch (error) {
      console.error("加载提供商失败:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProvider = async (providerId: string) => {
    setSaving(providerId)
    try {
      await llmApi.updateProvider(providerId, {
        api_key: apiKeys[providerId] || undefined,
        base_url: baseUrls[providerId] || undefined,
        enabled: !!apiKeys[providerId],
      })
      await loadProviders()
      alert("配置已保存")
    } catch (error) {
      console.error("保存失败:", error)
      alert("保存失败")
    } finally {
      setSaving(null)
    }
  }

  const handleTestConnection = async (providerId: string) => {
    setTesting(providerId)
    setTestResults({ ...testResults, [providerId]: { success: false, message: "测试中..." } })

    try {
      const provider = providers.find((p) => p.provider === providerId)
      const model = provider?.models[0]

      const result = await llmApi.testConnection(providerId, model)
      setTestResults({
        ...testResults,
        [providerId]: { success: result.success, message: result.message },
      })
    } catch (error) {
      setTestResults({
        ...testResults,
        [providerId]: { success: false, message: "连接失败" },
      })
    } finally {
      setTesting(null)
    }
  }

  const handleSelectModel = async (providerId: string, model: string) => {
    try {
      await llmApi.selectModel(providerId, model)
      setSelectedProvider(providerId)
      setSelectedModel(model)
      alert("已切换模型")
    } catch (error) {
      console.error("切换模型失败:", error)
      alert("切换失败")
    }
  }

  // 渲染模型按钮
  const renderModelButton = (providerId: string, model: string) => {
    const isSelected = selectedProvider === providerId && selectedModel === model
    const shortName = model.split("/").pop() || model

    return (
      <button
        key={model}
        onClick={() => handleSelectModel(providerId, model)}
        className={`
          text-left px-3 py-2 rounded-md text-xs font-mono transition-all duration-200
          ${isSelected
            ? "bg-primary text-primary-foreground shadow-sm"
            : "bg-muted/30 hover:bg-muted/50 text-muted-foreground hover:text-foreground border border-transparent hover:border-border/40"
          }
        `}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="truncate flex-1" title={model}>{shortName}</span>
          {isSelected && <Check className="h-3 w-3 flex-shrink-0" />}
        </div>
      </button>
    )
  }

  // 渲染提供商卡片
  const renderProviderCard = (provider: LLMProvider) => {
    const isOpenRouter = provider.provider === "openrouter"
    const modelGroups = isOpenRouter ? groupOpenRouterModels(provider.models) : null
    const isConfigured = provider.enabled || apiKeys[provider.provider]

    return (
      <Card key={provider.provider} className={`
        border-border/40 bg-card/50 backdrop-blur-sm overflow-hidden
        ${isConfigured ? "ring-1 ring-primary/20" : ""}
      `}>
        <div className="p-5 space-y-5">
          {/* 标题栏 */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold">{provider.name}</h3>
                {isConfigured && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/10 text-success text-[10px] font-medium">
                    <span className="w-1 h-1 rounded-full bg-success animate-pulse" />
                    已配置
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {isOpenRouter ? (
                  <>支持 OpenAI、Anthropic、Google、DeepSeek 等多种模型</>
                ) : (
                  <>支持的模型: {provider.models.slice(0, 3).join(", ")}{provider.models.length > 3 && "..."}</>
                )}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {testResults[provider.provider] && (
                <div className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                  ${testResults[provider.provider].success
                    ? "bg-success/10 text-success"
                    : "bg-destructive/10 text-destructive"
                  }
                `}>
                  {testResults[provider.provider].success ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <X className="h-3.5 w-3.5" />
                  )}
                  <span>{testResults[provider.provider].message}</span>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleTestConnection(provider.provider)}
                disabled={testing === provider.provider}
                className="h-9 px-3 border-border/40"
              >
                {testing === provider.provider ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <TestTube className="h-3.5 w-3.5 mr-1.5" />
                    测试
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* API Key 配置 */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <Key className="h-4 w-4 text-muted-foreground" />
                API Key
              </label>
              <div className="relative">
                <Input
                  type="password"
                  placeholder="sk-..."
                  value={apiKeys[provider.provider] || ""}
                  onChange={(e) => setApiKeys({ ...apiKeys, [provider.provider]: e.target.value })}
                  className="pr-10 h-10 bg-muted/30 border-border/40 font-mono text-sm"
                />
                {provider.api_key && !apiKeys[provider.provider] && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Check className="h-4 w-4 text-success" />
                  </div>
                )}
              </div>
              {isOpenRouter && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Globe className="h-3 w-3" />
                  <a
                    href="https://openrouter.ai/keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary transition-colors"
                  >
                    openrouter.ai/keys
                  </a>
                  <ExternalLink className="h-2.5 w-2.5" />
                </div>
              )}
            </div>

            {provider.provider !== "openai" && provider.provider !== "anthropic" && provider.provider !== "google" && provider.provider !== "openrouter" && (
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  API 地址
                </label>
                <Input
                  placeholder="自定义 API 地址"
                  value={baseUrls[provider.provider] || provider.base_url || ""}
                  onChange={(e) => setBaseUrls({ ...baseUrls, [provider.provider]: e.target.value })}
                  className="h-10 bg-muted/30 border-border/40 font-mono text-sm"
                />
              </div>
            )}
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center gap-3">
            <Button
              onClick={() => handleSaveProvider(provider.provider)}
              disabled={saving === provider.provider}
              className="h-9 px-4"
            >
              {saving === provider.provider ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  保存中
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  保存配置
                </>
              )}
            </Button>
            {isConfigured && (
              <Button
                variant="outline"
                onClick={() => {
                  const model = provider.models[0]
                  handleSelectModel(provider.provider, model)
                }}
                className="h-9 px-4 border-border/40"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                选择此提供商
              </Button>
            )}
          </div>

          {/* 模型选择 */}
          {isConfigured && (
            <div className="space-y-3 pt-3 border-t border-border/40">
              <label className="flex items-center gap-2 text-sm font-medium">
                <Sparkles className="h-4 w-4 text-muted-foreground" />
                选择模型
              </label>
              {isOpenRouter && modelGroups ? (
                <div className="space-y-4">
                  {Object.entries(modelGroups).map(([group, groupModels]) =>
                    groupModels.length > 0 ? (
                      <div key={group}>
                        <div className="text-xs text-muted-foreground mb-2 px-1">{group}</div>
                        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                          {groupModels.map((model) => renderModelButton(provider.provider, model))}
                        </div>
                      </div>
                    ) : null
                  )}
                </div>
              ) : (
                <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                  {provider.models.map((model) => renderModelButton(provider.provider, model))}
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">AI 模型配置</h2>
          <p className="text-sm text-muted-foreground mt-1">
            配置 LLM 提供商，为 AI 智能体分析提供支持
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs">
          <Sparkles className="w-3.5 h-3.5" />
          <span>推荐 OpenRouter</span>
        </div>
      </div>

      {/* 配置选项卡 */}
      <Tabs defaultValue="providers" className="space-y-6">
        <TabsList className="bg-muted/20 border border-border/40 p-1">
          <TabsTrigger value="providers" className="px-4">
            <Key className="w-4 h-4 mr-2" />
            提供商配置
          </TabsTrigger>
          <TabsTrigger value="current" className="px-4">
            <Sparkles className="w-4 h-4 mr-2" />
            当前模型
          </TabsTrigger>
        </TabsList>

        <TabsContent value="providers" className="space-y-6">
          {/* OpenRouter 推荐 */}
          <div className="flex items-center gap-2 mb-4">
            <div className="h-px flex-1 bg-border/40" />
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              推荐使用 - 国内可直接访问
            </div>
            <div className="h-px flex-1 bg-border/40" />
          </div>
          {providers
            .filter((p) => p.provider === "openrouter")
            .map((provider) => renderProviderCard(provider))}

          {/* 国内可用 */}
          <div className="flex items-center gap-2 mb-4 mt-8">
            <div className="h-px flex-1 bg-border/40" />
            <div className="px-3 py-1.5 rounded-full bg-muted/30 border border-border/40 text-muted-foreground text-xs font-medium">
              国内可用
            </div>
            <div className="h-px flex-1 bg-border/40" />
          </div>
          {providers
            .filter((p) => p.provider === "deepseek" || p.provider === "qwen")
            .map((provider) => renderProviderCard(provider))}

          {/* 需要海外支付 */}
          <div className="flex items-center gap-2 mb-4 mt-8">
            <div className="h-px flex-1 bg-border/40" />
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/30 border border-border/40 text-muted-foreground text-xs font-medium">
              <AlertCircle className="w-3.5 h-3.5" />
              需要海外支付方式
            </div>
            <div className="h-px flex-1 bg-border/40" />
          </div>
          {providers
            .filter((p) => p.provider === "openai" || p.provider === "anthropic" || p.provider === "google")
            .map((provider) => renderProviderCard(provider))}
        </TabsContent>

        <TabsContent value="current">
          <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
            <CardContent className="pt-6">
              {selectedProvider && selectedModel ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 pb-4 border-b border-border/40">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">当前激活模型</h3>
                      <p className="text-sm text-muted-foreground">所有 AI 智能体将使用此模型</p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="p-4 rounded-lg bg-muted/20 border border-border/40">
                      <div className="data-label mb-1">提供商</div>
                      <div className="data-value text-base">
                        {providers.find((p) => p.provider === selectedProvider)?.name}
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/20 border border-border/40">
                      <div className="data-label mb-1">模型 ID</div>
                      <div className="data-value text-sm font-mono break-all">{selectedModel}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 rounded-lg bg-success/10 border border-success/20">
                    <Check className="h-5 w-5 text-success flex-shrink-0" />
                    <div>
                      <div className="font-medium text-success">已就绪</div>
                      <div className="text-sm text-muted-foreground">模型配置完成，可以开始 AI 分析</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="w-20 h-20 rounded-full bg-muted/20 flex items-center justify-center mx-auto mb-4">
                    <Key className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">尚未配置模型</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    请在「提供商配置」选项卡中配置 API Key 并选择一个模型
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
