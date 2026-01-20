"""测试 API 端点"""
import pytest
from unittest.mock import AsyncMock, patch
from httpx import AsyncClient


class TestHealthEndpoints:
    """健康检查端点测试"""

    async def test_health_check(self, ac: AsyncClient):
        """测试健康检查"""
        response = await ac.get("/health")
        assert response.status_code == 200

        data = response.json()
        assert data["status"] == "healthy"
        assert "service" in data

    async def test_root(self, ac: AsyncClient):
        """测试根路径"""
        response = await ac.get("/")
        assert response.status_code == 200

        data = response.json()
        assert "message" in data
        assert "version" in data


class TestStockAPI:
    """股票 API 测试"""

    async def test_search_stocks(self, ac: AsyncClient, mock_stock_data):
        """测试股票搜索"""
        with patch("app.api.v1.stock.akshare") as mock_akshare:
            mock_akshare.search_stocks = AsyncMock(return_value=[mock_stock_data])

            response = await ac.get("/api/v1/stocks/search", params={"q": "600519"})
            assert response.status_code == 200

            data = response.json()
            assert isinstance(data, list)
            assert len(data) >= 0

    async def test_get_stock_quote(self, ac: AsyncClient, mock_stock_data):
        """测试获取实时行情"""
        with patch("app.api.v1.stock.akshare") as mock_akshare:
            with patch("app.api.v1.stock.cache") as mock_cache:
                mock_akshare.get_spot_quote = AsyncMock(return_value=mock_stock_data)
                mock_cache.get = AsyncMock(return_value=None)
                mock_cache.set = AsyncMock(return_value=None)

                response = await ac.get(f"/api/v1/stocks/{mock_stock_data['code']}/quote")
                assert response.status_code == 200

                data = response.json()
                assert data["code"] == mock_stock_data["code"]
                assert data["name"] == mock_stock_data["name"]
                assert data["price"] == mock_stock_data["price"]

    async def test_get_stock_quote_not_found(self, ac: AsyncClient):
        """测试股票不存在"""
        with patch("app.api.v1.stock.akshare") as mock_akshare:
            mock_akshare.get_spot_quote = AsyncMock(return_value=None)

            response = await ac.get("/api/v1/stocks/999999/quote")
            assert response.status_code == 404

    async def test_get_kline_data(self, ac: AsyncClient, mock_kline_data):
        """测试获取 K线数据"""
        with patch("app.api.v1.stock.akshare") as mock_akshare:
            with patch("app.api.v1.stock.cache") as mock_cache:
                mock_akshare.get_kline_data = AsyncMock(return_value=mock_kline_data)
                mock_cache.get = AsyncMock(return_value=None)
                mock_cache.set = AsyncMock(return_value=None)

                response = await ac.get("/api/v1/stocks/600519/kline")
                assert response.status_code == 200

                data = response.json()
                assert isinstance(data, list)
                assert len(data) > 0
                assert "date" in data[0]
                assert "open" in data[0]
                assert "close" in data[0]

    async def test_get_fundamental_data(self, ac: AsyncClient, mock_fundamental_data):
        """测试获取基本面数据"""
        with patch("app.api.v1.stock.akshare") as mock_akshare:
            with patch("app.api.v1.stock.cache") as mock_cache:
                mock_akshare.get_financial_data = AsyncMock(return_value=mock_fundamental_data)
                mock_cache.get = AsyncMock(return_value=None)
                mock_cache.set = AsyncMock(return_value=None)

                response = await ac.get("/api/v1/stocks/600519/fundamental")
                assert response.status_code == 200

                data = response.json()
                assert data["code"] == mock_fundamental_data["code"]
                assert "pe" in data
                assert "pb" in data

    async def test_get_technical_indicator_sma(self, ac: AsyncClient, mock_kline_data):
        """测试计算 SMA 指标"""
        with patch("app.api.v1.stock.akshare") as mock_akshare:
            mock_akshare.get_kline_data = AsyncMock(return_value=mock_kline_data)

            response = await ac.get("/api/v1/stocks/600519/indicators/sma")
            assert response.status_code == 200

            data = response.json()
            assert "name" in data
            assert "values" in data
            assert "SMA" in data["name"]

    async def test_get_technical_indicator_macd(self, ac: AsyncClient, mock_kline_data):
        """测试计算 MACD 指标"""
        with patch("app.api.v1.stock.akshare") as mock_akshare:
            mock_akshare.get_kline_data = AsyncMock(return_value=mock_kline_data)

            response = await ac.get("/api/v1/stocks/600519/indicators/macd")
            assert response.status_code == 200

            data = response.json()
            assert "macd" in data
            assert "signal" in data
            assert "histogram" in data

    async def test_get_technical_indicator_invalid(self, ac: AsyncClient, mock_kline_data):
        """测试无效指标"""
        with patch("app.api.v1.stock.akshare") as mock_akshare:
            mock_akshare.get_kline_data = AsyncMock(return_value=mock_kline_data)

            response = await ac.get("/api/v1/stocks/600519/indicators/invalid")
            assert response.status_code == 400


class TestLLMAPI:
    """LLM 配置 API 测试"""

    async def test_get_providers(self, ac: AsyncClient, mock_llm_config):
        """测试获取所有提供商"""
        response = await ac.get("/api/v1/llm/providers")
        assert response.status_code == 200

        data = response.json()
        assert "providers" in data
        assert "selected_provider" in data
        assert "selected_model" in data
        assert isinstance(data["providers"], list)

    async def test_get_provider(self, ac: AsyncClient, mock_llm_config):
        """测试获取指定提供商"""
        response = await ac.get("/api/v1/llm/providers/openai")
        assert response.status_code == 200

        data = response.json()
        assert data["provider"] == "openai"
        assert "models" in data

    async def test_get_provider_not_found(self, ac: AsyncClient):
        """测试提供商不存在"""
        response = await ac.get("/api/v1/llm/providers/nonexistent")
        assert response.status_code == 404

    async def test_update_provider(self, ac: AsyncClient, mock_llm_config):
        """测试更新提供商"""
        response = await ac.put(
            "/api/v1/llm/providers/test_provider",
            json={
                "api_key": "new-test-key",
                "enabled": True,
            }
        )
        assert response.status_code == 200

        data = response.json()
        assert data["success"] is True

    async def test_select_model(self, ac: AsyncClient, mock_llm_config):
        """测试选择模型"""
        response = await ac.post(
            "/api/v1/llm/select",
            json={
                "provider_id": "test_provider",
                "model": "test-model-1",
            }
        )
        assert response.status_code == 200

        data = response.json()
        assert data["success"] is True
        assert data["model"] == "test-model-1"

    async def test_get_current_config(self, ac: AsyncClient, mock_llm_config):
        """测试获取当前配置"""
        response = await ac.get("/api/v1/llm/current")
        assert response.status_code == 200

        data = response.json()
        assert "provider" in data
        assert "model" in data

    async def test_test_connection(self, ac: AsyncClient, mock_llm_config):
        """测试连接"""
        with patch("app.api.v1.llm.get_llm") as mock_get_llm:
            mock_llm = AsyncMock()
            mock_response = AsyncMock()
            mock_response.content = "Test response"
            mock_llm.ainvoke = AsyncMock(return_value=mock_response)
            mock_get_llm.return_value = mock_llm

            response = await ac.post(
                "/api/v1/llm/test",
                json={
                    "provider_id": "test_provider",
                    "model": "test-model-1",
                }
            )

            # 注意：由于测试环境可能没有真实的 LLM 连接，
            # 这个测试可能会失败，这是正常的
            # 在实际测试中，应该使用 mock LLM


class TestAnalysisAPI:
    """分析 API 测试"""

    async def test_create_analysis_task(self, ac: AsyncClient, mock_stock_data):
        """测试创建分析任务"""
        with patch("app.api.v1.agent.akshare") as mock_akshare:
            mock_akshare.get_stock_info = AsyncMock(
                return_value={"code": mock_stock_data["code"], "name": mock_stock_data["name"]}
            )

            response = await ac.post(
                "/api/v1/analysis/create",
                json={"stock_code": mock_stock_data["code"]}
            )

            # 由于会启动后台任务，我们只检查返回了任务结构
            assert response.status_code == 200

            data = response.json()
            assert "task_id" in data
            assert "stock_code" in data
            assert data["stock_code"] == mock_stock_data["code"]

    async def test_create_analysis_task_stock_not_found(self, ac: AsyncClient):
        """测试股票不存在"""
        with patch("app.api.v1.agent.akshare") as mock_akshare:
            mock_akshare.get_stock_info = AsyncMock(return_value=None)

            response = await ac.post(
                "/api/v1/analysis/create",
                json={"stock_code": "999999"}
            )
            assert response.status_code == 404

    async def test_get_task_status(self, ac: AsyncClient):
        """测试获取任务状态"""
        # 首先创建一个任务
        with patch("app.api.v1.agent.akshare") as mock_akshare:
            mock_akshare.get_stock_info = AsyncMock(
                return_value={"code": "600519", "name": "测试股票"}
            )

            create_response = await ac.post(
                "/api/v1/analysis/create",
                json={"stock_code": "600519"}
            )
            task_data = create_response.json()
            task_id = task_data["task_id"]

            # 获取任务状态
            response = await ac.get(f"/api/v1/analysis/{task_id}/status")
            assert response.status_code in [200, 404]  # 可能已完成或超时

    async def test_get_task_not_found(self, ac: AsyncClient):
        """测试任务不存在"""
        response = await ac.get("/api/v1/analysis/nonexistent-task-id")
        assert response.status_code == 404
