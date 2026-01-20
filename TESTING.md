# 单元测试说明

## 测试概览

本项目包含完整的单元测试套件，覆盖后端和前端的核心功能。

## 后端测试 (Python/pytest)

### 安装测试依赖

```bash
cd backend
pip install -e ".[dev]"
```

### 运行测试

```bash
# 运行所有测试
pytest

# 运行特定测试文件
pytest tests/test_indicators.py

# 运行特定测试类
pytest tests/test_indicators.py::TestTechnicalIndicators

# 运行特定测试函数
pytest tests/test_indicators.py::TestTechnicalIndicators::test_sma

# 带覆盖率报告
pytest --cov=app --cov-report=html

# 查看详细输出
pytest -v

# 只运行失败的测试
pytest --lf

# 并行运行测试
pytest -n auto
```

### 测试文件结构

```
backend/tests/
├── __init__.py           # 测试包初始化
├── conftest.py           # pytest 配置和 fixtures
├── test_indicators.py    # 技术指标计算测试
├── test_llm_config.py    # LLM 配置管理测试
└── test_api.py           # API 端点测试
```

### 测试覆盖范围

| 模块 | 测试文件 | 覆盖内容 |
|------|----------|----------|
| 技术指标 | `test_indicators.py` | SMA, EMA, MACD, RSI, KDJ, BOLL, CCI, WR |
| LLM 配置 | `test_llm_config.py` | 提供商管理、模型选择、配置导入导出 |
| API 端点 | `test_api.py` | 健康检查、股票 API、LLM API、分析 API |

### 后端测试示例

```python
# 运行技术指标测试
pytest tests/test_indicators.py -v

# 运行 LLM 配置测试
pytest tests/test_llm_config.py -v

# 运行 API 测试
pytest tests/test_api.py -v

# 生成覆盖率报告
pytest --cov=app --cov-report=html
open htmlcov/index.html
```

## 前端测试 (Jest/React Testing Library)

### 安装测试依赖

```bash
cd frontend
npm install
```

### 运行测试

```bash
# 运行所有测试
npm test

# 监听模式
npm run test:watch

# 生成覆盖率报告
npm run test:coverage

# 运行特定测试文件
npm test -- lib/__tests__/utils.test.ts

# 运行特定测试套件
npm test -- -t "Button Component"
```

### 测试文件结构

```
frontend/
├── jest.config.js        # Jest 配置
├── jest.setup.js         # 测试环境设置
├── lib/__tests__/        # 工具函数测试
│   ├── utils.test.ts     # cn 函数测试
│   └── api.test.ts       # API 客户端测试
└── components/ui/__tests__/  # UI 组件测试
    ├── button.test.tsx   # 按钮组件测试
    └── input.test.tsx    # 输入框组件测试
```

### 测试覆盖范围

| 模块 | 测试文件 | 覆盖内容 |
|------|----------|----------|
| 工具函数 | `lib/__tests__/utils.test.ts` | cn 类名合并函数 |
| API 客户端 | `lib/__tests__/api.test.ts` | stockApi, analysisApi, llmApi |
| UI 组件 | `components/ui/__tests__/` | Button, Input 等组件 |

### 前端测试示例

```bash
# 运行工具函数测试
npm test -- lib/__tests__/utils.test.ts

# 运行 API 客户端测试
npm test -- lib/__tests__/api.test.ts

# 运行组件测试
npm test -- components/ui/__tests__/button.test.tsx
```

## Fixtures 说明

### 后端 Fixtures (`tests/conftest.py`)

- `ac`: 异步 HTTP 客户端
- `test_db`: 测试数据库
- `mock_cache`: 模拟缓存服务
- `mock_llm_config`: 模拟 LLM 配置
- `mock_stock_data`: 模拟股票数据
- `mock_kline_data`: 模拟 K线数据
- `mock_fundamental_data`: 模拟基本面数据

## 最佳实践

### 编写后端测试

1. 使用 `pytest.mark` 标记测试
2. 使用 fixtures 减少重复代码
3. 使用 `unittest.mock` 模拟外部依赖
4. 测试边界条件和错误情况

```python
class TestExample:
    @pytest.mark.asyncio
    async def test_async_function(self, mock_data):
        result = await async_function(mock_data)
        assert result is not None

    def test_error_case(self):
        with pytest.raises(ValueError):
            function_with_error()
```

### 编写前端测试

1. 使用 `@testing-library` 的查询方法
2. 测试用户交互而不是实现细节
3. 使用 `jest.fn()` 模拟函数
4. 保持测试简单和专注

```typescript
describe('Component', () => {
  it('should handle user interaction', async () => {
    render(<Component onClick={handleClick} />)
    await userEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

## CI/CD 集成

### GitHub Actions 示例

```yaml
name: Tests

on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - name: Install dependencies
        run: |
          cd backend
          pip install -e ".[dev]"
      - name: Run tests
        run: |
          cd backend
          pytest --cov=app --cov-report=xml

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - name: Install dependencies
        run: |
          cd frontend
          npm install
      - name: Run tests
        run: |
          cd frontend
          npm test -- --coverage
```

## 故障排除

### 后端测试问题

1. **导入错误**: 确保在 `backend/` 目录下运行测试
2. **数据库错误**: 测试使用内存数据库，无需安装 PostgreSQL
3. **异步测试**: 使用 `pytest-asyncio` 并添加 `@pytest.mark.asyncio`

### 前端测试问题

1. **模块未找到**: 确保 `tsconfig.json` 配置正确
2. **CSS-in-JS**: Jest 无法测试样式，只测试逻辑
3. **Next.js 特性**: 需要使用 `next/jest` 配置

## 测试覆盖率目标

| 模块 | 目标覆盖率 | 当前状态 |
|------|------------|----------|
| 技术指标 | 90%+ | ✅ |
| LLM 配置 | 85%+ | ✅ |
| API 端点 | 80%+ | ✅ |
| 前端工具函数 | 80%+ | ✅ |
| 前端组件 | 70%+ | ✅ |
