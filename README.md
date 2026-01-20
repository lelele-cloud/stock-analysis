# A股专业分析系统

结合传统股票分析工具和 AI 多智能体协作分析框架的专业 A股分析系统。

## 功能特性

### 传统分析模块
- **实时行情**: A股实时行情数据查询
- **K线图表**: 日K、周K、月K图表展示
- **技术指标**: MACD、KDJ、RSI、BOLL、CCI、WR 等技术指标
- **基本面数据**: PE、PB、ROE 等财务指标
- **选股器**: 多维度股票筛选
- **回测引擎**: 策略回测与收益分析

### AI 智能体分析模块
- **7 个专业智能体**: 基本面、情绪、新闻、技术、研究员、交易员、风险管理师
- **多轮协作**: 智能体之间进行多空辩论
- **综合报告**: 生成专业的投资分析报告
- **实时进度**: WebSocket 实时推送分析进度

## 技术栈

### 前端
- Next.js 15 + React 19 + TypeScript
- shadcn/ui + Tailwind CSS
- Recharts / Lightweight Charts

### 后端
- FastAPI + Python 3.11
- LangChain (LLM 编排)
- SQLAlchemy + PostgreSQL
- Redis (缓存 + 消息队列)

### 数据源
- Akshare (免费 A股数据)

### LLM (选择一个)
- OpenAI GPT-5.2
- Anthropic Claude Opus 4.5
- Google Gemini 3 Pro
- DeepSeek-V3.2

## 快速开始

### 使用 Docker (推荐)

```bash
# 1. 复制环境变量文件
cp .env.example .env

# 2. 编辑 .env 文件，配置 LLM API Key
# 至少需要配置:
# LLM_PROVIDER=openai
# LLM_MODEL=gpt-4o
# OPENAI_API_KEY=sk-xxx

# 3. 启动所有服务
docker-compose up -d

# 4. 访问应用
# 前端: http://localhost:3000
# 后端 API: http://localhost:8000
# API 文档: http://localhost:8000/docs
```

### 本地开发

#### 后端开发

```bash
cd backend

# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env
# 编辑 .env 配置 API Key

# 启动服务
uvicorn app.main:app --reload
```

#### 前端开发

```bash
cd frontend

# 安装依赖
npm install

# 配置环境变量
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# 启动开发服务器
npm run dev
```

## 项目结构

```
stock-analysis-system/
├── backend/                 # FastAPI 后端
│   ├── app/
│   │   ├── api/            # API 路由
│   │   ├── core/           # 核心配置
│   │   ├── services/       # 业务逻辑
│   │   ├── models/         # 数据模型
│   │   └── main.py        # 应用入口
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/               # Next.js 前端
│   ├── app/               # App Router
│   ├── components/        # 组件
│   ├── lib/               # 工具库
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
├── .env.example
├── CLAUDE.md
└── README.md
```

## API 文档

启动后端服务后访问:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 开发指南

详见 [CLAUDE.md](./CLAUDE.md) 文件。

## 许可证

MIT License

## 参考项目

- [TradingAgents-CN](https://github.com/hsliuping/TradingAgents-CN) - 多智能体 LLM 金融交易框架
