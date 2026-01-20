"""API v1 路由"""
from fastapi import APIRouter

from .stock import router as stock_router
from .agent import router as agent_router
from .screener import router as screener_router
from .backtest import router as backtest_router
from .llm import router as llm_router

router = APIRouter()

router.include_router(stock_router)
router.include_router(agent_router)
router.include_router(screener_router)
router.include_router(backtest_router)
router.include_router(llm_router)
