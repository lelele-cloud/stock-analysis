"""测试配置"""
import pytest
import asyncio
from typing import AsyncGenerator, Generator
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.core.config import settings
from app.core.llm_config import get_llm_config_manager, LLMProviderConfig
from app.services.data import get_cache_service
from app.models.stock import Base


@pytest.fixture(scope="session")
def event_loop() -> asyncio.AbstractEventLoop:
    """创建事件循环"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
async def ac() -> AsyncGenerator:
    """异步 HTTP 客户端"""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        yield client


@pytest.fixture
async def test_db() -> AsyncGenerator:
    """测试数据库"""
    # 使用内存 SQLite 数据库进行测试
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    async_session_maker = async_sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )

    # 创建表
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield async_session_maker

    # 清理
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture
async def mock_cache() -> AsyncGenerator:
    """模拟缓存服务"""
    from app.services.data.cache import CacheService
    from unittest.mock import AsyncMock, MagicMock

    cache = AsyncMock(spec=CacheService)
    cache.connect = AsyncMock(return_value=None)
    cache.disconnect = AsyncMock(return_value=None)
    cache.get = AsyncMock(return_value=None)
    cache.set = AsyncMock(return_value=None)
    cache.delete = AsyncMock(return_value=None)
    cache.exists = AsyncMock(return_value=False)

    yield cache


@pytest.fixture
def mock_llm_config():
    """模拟 LLM 配置"""
    config_manager = get_llm_config_manager()

    # 添加测试提供商
    config_manager.configs["test_provider"] = LLMProviderConfig(
        provider="test_provider",
        name="测试提供商",
        models=["test-model-1", "test-model-2"],
        api_key="test-key",
        enabled=True,
    )

    config_manager.selected_provider = "test_provider"
    config_manager.selected_model = "test-model-1"

    return config_manager


@pytest.fixture
def mock_stock_data():
    """模拟股票数据"""
    return {
        "code": "600519",
        "name": "贵州茅台",
        "price": 1800.50,
        "change": 25.30,
        "change_pct": 1.42,
        "volume": 125000,
        "amount": 225000000,
        "high": 1810.00,
        "low": 1790.00,
        "open": 1795.00,
        "close_prev": 1775.20,
    }


@pytest.fixture
def mock_kline_data():
    """模拟 K线数据"""
    import datetime
    data = []
    base_price = 1800.0
    for i in range(30):
        data.append({
            "date": (datetime.date.today() - datetime.timedelta(days=29-i)).isoformat(),
            "open": base_price + i * 2,
            "high": base_price + i * 2 + 10,
            "low": base_price + i * 2 - 5,
            "close": base_price + i * 2 + 3,
            "volume": 100000 + i * 1000,
            "amount": 180000000 + i * 10000,
        })
    return data


@pytest.fixture
def mock_fundamental_data():
    """模拟基本面数据"""
    return {
        "code": "600519",
        "pe": 35.5,
        "pb": 12.8,
        "ps": 15.2,
        "roe": 28.5,
        "roa": 18.2,
        "gross_margin": 91.2,
        "net_margin": 52.8,
        "debt_ratio": 22.5,
    }
