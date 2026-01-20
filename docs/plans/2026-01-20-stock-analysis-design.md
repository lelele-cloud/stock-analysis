# A股专业分析系统 - 设计文档

**创建日期:** 2026-01-20
**项目类型:** A股股票分析平台 (传统分析 + AI 多智能体)

---

## 一、项目概述

构建一个专业的 A股分析系统，完整复刻 TradingAgents-CN 的 7 个 AI 智能体协作分析框架，同时提供传统股票分析工具。

### 核心功能

1. **传统分析模块**: K线图表、技术指标、基本面数据、选股器、回测引擎
2. **AI 智能体分析**: 7 个智能体角色协作完成股票分析决策

---

## 二、技术栈

### 前端
- **Next.js 15** + **React 19** + **TypeScript**
- **shadcn/ui** (UI 组件库)
- **Recharts** / **Lightweight Charts** (图表)

### 后端
- **Python FastAPI** (API 服务)
- **LangChain** (LLM 编排框架)

### 数据源
- **Akshare** (A 股数据，免费，无需 API Key)

### 数据库
- **PostgreSQL** (持久化存储)
- **Redis** (缓存 + 消息队列)

### LLM 模型 (用户选择一个)
- GPT-5.2 (OpenAI)
- Claude Opus 4.5 (Anthropic)
- Gemini 3 Pro (Google)
- DeepSeek-V3.2 (深度求索)

---

## 三、系统架构

```
┌─────────────────────────────────────────────────────────┐
│                    前端层 (Next.js)                      │
├──────────────────────┬──────────────────────────────────┤
│    传统分析模块       │         AI 智能体分析模块          │
│  - K线图表            │  - 分析任务配置                   │
│  - 技术指标           │  - 智能体协作可视化               │
│  - 基本面数据         │  - 分析报告展示                   │
│  - 选股器             │  - 实时进度跟踪                   │
│  - 回测引擎           │                                  │
└──────────────────────┴──────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│              API 网关层 (FastAPI)                        │
├─────────────────────────────────────────────────────────┤
│  RESTful API  │  WebSocket (实时推送)  │  SSE (事件流)  │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│                   业务逻辑层                             │
├──────────────────────┬──────────────────────────────────┤
│    传统分析服务       │        多智能体协调服务           │
│                      │                                   │
│  - 数据采集服务       │   ┌─────────────────────────┐   │
│  - 指标计算引擎       │   │    智能体管理器          │   │
│  - 选股策略引擎       │   ├─────────────────────────┤   │
│  - 回测引擎           │   │  1. 基本面分析师        │   │
│                      │   │  2. 情绪分析师          │   │
│                      │   │  3. 新闻分析师          │   │
│                      │   │  4. 技术分析师          │   │
│                      │   │  5. 研究员 (多空辩论)   │   │
│                      │   │  6. 交易员              │   │
│                      │   │  7. 风险管理师          │   │
│                      │   └─────────────────────────┘   │
└──────────────────────┴──────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│                   数据访问层                             │
├─────────────────────────────────────────────────────────┤
│  Akshare 数据  │  PostgreSQL  │  Redis  │  LLM APIs    │
└─────────────────────────────────────────────────────────┘
```

---

## 四、AI 智能体分析模块

### 多智能体协作流程

```
用户输入: 股票代码 + 分析任务
         │
         ▼
    ┌─────────┐
    │ 任务分发器 │
    └─────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐ ┌────────┐
│数据采集  │ │上下文构建│
└────────┘ └────────┘
    │         │
    └────┬────┘
         │
         ▼
┌─────────────────────────────────────┐
│         并行分析阶段                  │
├─────────────────────────────────────┤
│ ┌──────┐ ┌──────┐ ┌──────┐         │
│ │基本面 │ │情绪  │ │新闻  │         │
│ │分析师 │ │分析师 │ │分析师 │         │
│ └──────┘ └──────┘ └──────┘         │
│ ┌──────┐                          │
│ │技术  │                          │
│ │分析师 │                          │
│ └──────┘                          │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│         协作辩论阶段                  │
├─────────────────────────────────────┤
│         ┌────────┐                  │
│         │ 研究员  │ ◄── 多轮多空辩论  │
│         └────────┘                  │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│         决策与风控阶段                │
├─────────────────────────────────────┤
│  ┌────────┐      ┌──────────┐      │
│  │ 交易员 │ ───▶ │风险管理师  │      │
│  └────────┘      └──────────┘      │
└─────────────────────────────────────┘
         │
         ▼
    ┌─────────┐
    │ 综合报告  │
    └─────────┘
```

### 7 个智能体角色

| 智能体 | 输入数据 | 分析内容 | 输出结果 |
|-------|---------|---------|---------|
| **1. 基本面分析师** | 财报数据、估值指标 | 盈利能力、成长性、估值水平 | 基本面评分 + 投资逻辑 |
| **2. 情绪分析师** | 市场情绪指标 | 恐慌贪婪指数、资金流向 | 情绪判断 + 市场热度 |
| **3. 新闻分析师** | 个股新闻、公告 | 新闻情感、事件影响 | 新闻摘要 + 影响评级 |
| **4. 技术分析师** | 价格、成交量、技术指标 | 趋势、支撑阻力、买卖信号 | 技术面评分 + 操作建议 |
| **5. 研究员** | 以上 4 个分析结果 | 综合分析、多空辩论 | 综合观点 + 关键论据 |
| **6. 交易员** | 研究员报告 | 交易决策、仓位建议 | 交易信号 + 目标价位 |
| **7. 风险管理师** | 交易员建议 | 风险评估、止损策略 | 风险评级 + 风控建议 |

---

## 五、传统分析模块

### 1. 数据采集服务

**功能:** 通过 Akshare 获取 A 股市场数据

**核心接口:**
- `stock_zh_a_spot_em()` - A股实时行情
- `stock_zh_a_hist()` - 个股历史行情
- `stock_individual_info_em()` - 个股基本信息
- `stock_balance_sheet_by_yearly_em()` - 资产负债表
- `stock_profit_sheet_by_yearly_em()` - 利润表
- `stock_cash_flow_sheet_by_yearly_em()` - 现金流量表

### 2. 技术指标计算引擎

**支持的指标分类:**

| 指标类型 | 具体指标 |
|---------|---------|
| **趋势指标** | SMA, EMA, MACD, BOLL, DMI |
| **震荡指标** | RSI, KDJ, CCI, WR, ROC |
| **成交量指标** | OBV, VOL, MA_VOLUME |
| **动量指标** | MTM, BIAS, ASY |

### 3. 选股策略引擎

**功能:**
- 多维度条件筛选(技术面 + 基本面)
- 自定义策略组合
- 历史筛选记录回溯

### 4. 回测引擎

**功能:**
- 基于历史数据验证策略
- 计算收益率、最大回撤、夏普比率
- 生成回测报告和可视化图表

---

## 六、LLM 配置

### 简化配置方案

用户只需选择一个大模型，所有 7 个智能体共用该模型:

```python
# 支持的模型选项
available_models = {
    "gpt-5.2": "OpenAI GPT-5.2 - 综合能力最强",
    "claude-opus-4.5": "Anthropic Claude Opus 4.5 - 编程与推理最强",
    "gemini-3-pro": "Google Gemini 3 Pro - 百万上下文",
    "deepseek-v3.2": "DeepSeek-V3.2 - 开源高性价比"
}
```

### 配置文件示例

```yaml
# config/llm.yaml
llm:
  provider: openai
  model: gpt-5.2
  api_key: ${OPENAI_API_KEY}
  temperature: 0.7
  max_tokens: 4000
```

---

## 七、项目目录结构

```
stock-analysis-system/
├── frontend/                    # Next.js 前端
│   ├── src/
│   │   ├── app/                # App Router
│   │   │   ├── (dashboard)/   # 仪表盘布局
│   │   │   │   ├── page.tsx   # 首页
│   │   │   │   ├── stock/     # 个股页面
│   │   │   │   ├── screener/  # 选股器
│   │   │   │   ├── backtest/  # 回测
│   │   │   │   └── analysis/  # AI 分析
│   │   │   └── api/           # API Routes
│   │   ├── components/        # 组件
│   │   │   ├── charts/        # 图表组件
│   │   │   ├── tables/        # 表格组件
│   │   │   ├── forms/         # 表单组件
│   │   │   └── agents/        # 智能体可视化
│   │   ├── lib/               # 工具库
│   │   │   ├── api.ts         # API 客户端
│   │   │   └── websocket.ts   # WebSocket
│   │   └── styles/            # 样式
│   ├── public/
│   ├── package.json
│   └── tsconfig.json
│
├── backend/                     # FastAPI 后端
│   ├── app/
│   │   ├── api/               # API 路由
│   │   │   ├── v1/
│   │   │   │   ├── stock.py   # 股票数据 API
│   │   │   │   ├── screener.py # 选股 API
│   │   │   │   ├── backtest.py # 回测 API
│   │   │   │   └── agent.py   # AI 智能体 API
│   │   │   └── deps.py        # 依赖注入
│   │   ├── core/              # 核心配置
│   │   │   ├── config.py      # 配置管理
│   │   │   ├── security.py    # 安全
│   │   │   └── llm.py         # LLM 配置
│   │   ├── services/          # 业务逻辑
│   │   │   ├── data/          # 数据服务
│   │   │   │   ├── akshare.py # Akshare 封装
│   │   │   │   └── cache.py   # 缓存服务
│   │   │   ├── indicators/    # 指标计算
│   │   │   │   ├── technical.py
│   │   │   │   └── fundamental.py
│   │   │   ├── screener/      # 选股引擎
│   │   │   ├── backtest/      # 回测引擎
│   │   │   └── agents/        # 智能体服务
│   │   │       ├── coordinator.py # 协调器
│   │   │       ├── agents/        # 7个智能体
│   │   │       │   ├── fundamental.py
│   │   │       │   ├── sentiment.py
│   │   │       │   ├── news.py
│   │   │       │   ├── technical.py
│   │   │       │   ├── researcher.py
│   │   │       │   ├── trader.py
│   │   │       │   └── risk_manager.py
│   │   │       └── prompts/       # 提示词模板
│   │   ├── models/            # 数据模型
│   │   │   ├── stock.py
│   │   │   └── analysis.py
│   │   └── main.py           # FastAPI 应用入口
│   ├── tests/                # 测试
│   ├── requirements.txt
│   └── pyproject.toml
│
├── shared/                      # 共享代码
│   ├── types/                 # TypeScript 类型
│   └── schemas/               # Pydantic schemas
│
├── docker/                     # Docker 配置
│   ├── Dockerfile.frontend
│   ├── Dockerfile.backend
│   └── docker-compose.yml
│
├── docs/                       # 文档
│   └── plans/
│       └── 2026-01-20-stock-analysis-design.md
│
├── .env.example               # 环境变量示例
├── docker-compose.yml
└── README.md
```

---

## 八、环境变量配置

```env
# .env.example

# LLM 配置 (用户只需配置一个)
LLM_PROVIDER=openai
LLM_MODEL=gpt-5.2
OPENAI_API_KEY=sk-xxx
# 或者
# LLM_PROVIDER=anthropic
# LLM_MODEL=claude-opus-4.5
# ANTHROPIC_API_KEY=sk-ant-xxx

# 数据库
DATABASE_URL=postgresql://user:pass@localhost:5432/stock_analysis
REDIS_URL=redis://localhost:6379/0

# API 配置
API_HOST=0.0.0.0
API_PORT=8000
FRONTEND_URL=http://localhost:3000

# Akshare (无需配置，免费使用)
```

---

## 九、核心命令

```bash
# 开发环境启动
docker-compose up -d

# 前端开发
cd frontend && npm run dev

# 后端开发
cd backend && uvicorn app.main:app --reload

# 运行测试
cd backend && pytest
cd frontend && npm test

# 构建生产版本
docker-compose -f docker-compose.prod.yml build
```

---

## 十、参考资源

- [TradingAgents-CN](https://github.com/hsliuping/TradingAgents-CN) - 多智能体 LLM 金融交易框架
- [Akshare 官方文档](https://akshare.akfamily.xyz/introduction.html) - A股数据接口
- [Next.js 官方文档](https://nextjs.org/docs) - React 全栈框架
- [FastAPI 官方文档](https://fastapi.tiangolo.com/) - Python Web 框架
- [LangChain 官方文档](https://docs.langchain.com/) - LLM 应用开发框架
