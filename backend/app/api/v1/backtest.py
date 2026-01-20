"""回测 API 路由"""
import uuid
from fastapi import APIRouter, HTTPException
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field

from ...services.data import get_akshare_service
from ...services.backtest import get_backtest_engine

router = APIRouter(prefix="/backtest", tags=["backtest"])
akshare = get_akshare_service()
backtest_engine = get_backtest_engine(akshare)


class BacktestRequest(BaseModel):
    """回测请求"""
    stock_code: str = Field(..., description="股票代码")
    strategy_type: str = Field(..., description="策略类型: sma_cross, macd, rsi, boll, buy_hold")
    strategy_params: Dict[str, Any] = Field(default_factory=dict, description="策略参数")
    start_date: str = Field(..., description="开始日期 YYYYMMDD")
    end_date: str = Field(..., description="结束日期 YYYYMMDD")
    initial_capital: float = Field(100000.0, description="初始资金")


@router.post("/")
async def run_backtest(request: BacktestRequest):
    """执行回测"""
    try:
        result = await backtest_engine.run(
            stock_code=request.stock_code,
            strategy_type=request.strategy_type,
            strategy_params=request.strategy_params,
            start_date=request.start_date,
            end_date=request.end_date,
            initial_capital=request.initial_capital,
        )

        if not result.get("success"):
            raise HTTPException(status_code=400, detail=result.get("error", "回测失败"))

        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"回测失败: {str(e)}")


@router.get("/templates")
async def get_strategy_templates():
    """获取策略模板"""
    templates = backtest_engine.get_strategy_templates()
    return templates
