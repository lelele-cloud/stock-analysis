# A股专业分析系统 - 后端服务

基于 FastAPI 的 A股分析后端服务，提供传统股票分析和 AI 多智能体分析功能。

## 技术栈

- **FastAPI** - Web 框架
- **SQLAlchemy** - ORM
- **Redis** - 缓存和消息队列
- **Akshare** - A股数据源
- **LangChain** - LLM 编排框架

## 开发环境设置

### 1. 安装依赖

```bash
pip install -r requirements.txt
```

### 2. 配置环境变量

复制 `.env.example` 到 `.env` 并配置:

```bash
cp .env.example .env
```

至少需要配置 LLM API Key:

```env
LLM_PROVIDER=openai
LLM_MODEL=gpt-4o
OPENAI_API_KEY=sk-xxx
```

### 3. 启动服务

```bash
# 开发模式
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 生产模式
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### 4. 访问 API 文档

启动后访问:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 项目结构

```
backend/
├── app/
│   ├── api/                # API 路由
│   ├── core/               # 核心配置
│   ├── services/           # 业务逻辑
│   ├── models/             # 数据模型
│   └── main.py            # 应用入口
├── tests/                  # 测试
├── requirements.txt        # 依赖
└── pyproject.toml         # 项目配置
```

## API 端点

### 健康检查
- `GET /health` - 健康检查
- `GET /` - 根路径

### 股票数据 (TODO)
- `GET /api/v1/stocks/quote` - 获取实时行情
- `GET /api/v1/stocks/{code}` - 获取股票详情
- `GET /api/v1/stocks/{code}/kline` - 获取K线数据
- `GET /api/v1/stocks/{code}/fundamental` - 获取基本面数据

### AI 分析 (TODO)
- `POST /api/v1/analysis/create` - 创建分析任务
- `GET /api/v1/analysis/{task_id}` - 获取分析结果
- `WebSocket /ws/analysis/{task_id}` - 实时分析进度

### 选股器 (TODO)
- `POST /api/v1/screener` - 执行选股
- `GET /api/v1/screener/templates` - 获取选股模板

### 回测 (TODO)
- `POST /api/v1/backtest` - 执行回测
- `GET /api/v1/backtest/{id}` - 获取回测结果

## 运行测试

```bash
# 运行所有测试
pytest

# 运行特定测试
pytest tests/test_services/

# 带覆盖率报告
pytest --cov=app --cov-report=html
```
