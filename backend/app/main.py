"""FastAPI 应用入口"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from .core.config import settings
from .api.v1 import router as api_v1_router
from .services.data import get_cache_service

# 配置日志
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    logger.info("启动股票分析系统后端服务...")
    # 初始化 Redis 连接
    cache_service = get_cache_service()
    await cache_service.connect()
    yield
    logger.info("关闭股票分析系统后端服务...")
    # 关闭 Redis 连接
    await cache_service.disconnect()


# 创建 FastAPI 应用
app = FastAPI(
    title="A股专业分析系统 API",
    description="提供传统股票分析和 AI 多智能体分析服务",
    version="0.1.0",
    lifespan=lifespan,
)

# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(api_v1_router, prefix="/api/v1")


# 健康检查
@app.get("/health")
async def health_check():
    """健康检查接口"""
    return {"status": "healthy", "service": "stock-analysis-backend"}


# 根路径
@app.get("/")
async def root():
    """根路径"""
    return {
        "message": "A股专业分析系统 API",
        "version": "0.1.0",
        "docs": "/docs",
    }
