import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

// ==================== 股票相关 API ====================
export const stockApi = {
  // 获取股票列表
  search: (keyword: string) =>
    api.get('/stock/search', { params: { keyword } }),

  // 获取股票详情
  getDetail: (code: string) =>
    api.get(`/stock/${code}/detail`),

  // 获取 K 线数据
  getKLine: (code: string, period: string = 'daily', limit: number = 100) =>
    api.get(`/stock/${code}/kline`, { params: { period, limit } }),

  // 获取技术指标
  getIndicators: (code: string, indicators: string[]) =>
    api.post(`/stock/${code}/indicators`, { indicators }),
}

// ==================== 选股器 API ====================
export const screenerApi = {
  // 获取可选字段
  getFields: () =>
    api.get('/screener/fields'),

  // 执行选股
  screen: (conditions: any[]) =>
    api.post('/screener/screen', { conditions }),

  // 获取预设策略
  getTemplates: () =>
    api.get('/screener/templates'),
}

// ==================== 回测 API ====================
export const backtestApi = {
  // 执行回测
  run: (params: any) =>
    api.post('/backtest/run', params),

  // 获取回测结果
  getResult: (id: string) =>
    api.get(`/backtest/result/${id}`),
}

// ==================== 分析 API ====================
export const analysisApi = {
  // 执行 AI 分析
  analyze: (code: string, options?: any) =>
    api.post(`/agent/analyze`, { stock_code: code, ...options }),

  // 获取分析结果
  getResult: (taskId: string) =>
    api.get(`/agent/result/${taskId}`),
}

// ==================== LLM 配置 API ====================
export const llmApi = {
  // 获取配置
  getConfig: () =>
    api.get('/llm/config'),

  // 更新配置
  updateConfig: (config: any) =>
    api.post('/llm/config', config),

  // 测试连接
  testConnection: (config: any) =>
    api.post('/llm/test', config),
}

// ==================== 新闻 API ====================
export const newsApi = {
  // 获取股票新闻
  getStockNews: (code: string, limit: number = 10) =>
    api.get(`/news/${code}`, { params: { limit } }),

  // 获取市场新闻
  getMarketNews: (limit: number = 20) =>
    api.get('/news/market', { params: { limit } }),
}

export default api
