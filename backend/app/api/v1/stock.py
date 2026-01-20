"""股票数据 API 路由"""
from fastapi import APIRouter, HTTPException, Query
from typing import Optional

from ...models.stock import StockQuote, KLineData, FundamentalData, StockInfo
from ...services.data import get_akshare_service, get_cache_service
from ...services.indicators import technical_calculator

router = APIRouter(prefix="/stocks", tags=["stocks"])
akshare = get_akshare_service()
cache = get_cache_service()


@router.get("/search")
async def search_stocks(q: str = Query(..., description="搜索关键词")):
    """搜索股票"""
    cache_key = f"stock:search:{q}"

    # 尝试从缓存获取
    cached = await cache.get(cache_key)
    if cached:
        return cached

    # 从 Akshare 获取
    results = await akshare.search_stocks(q)

    # 缓存结果 (5分钟)
    await cache.set(cache_key, results, ttl=300)

    return results


@router.get("/{code}/quote", response_model=StockQuote)
async def get_stock_quote(code: str):
    """获取实时行情"""
    cache_key = f"stock:{code}:quote"

    # 尝试从缓存获取 (1分钟)
    cached = await cache.get(cache_key)
    if cached:
        return cached

    # 从 Akshare 获取
    quote = await akshare.get_spot_quote(code)

    if not quote:
        raise HTTPException(status_code=404, detail=f"股票 {code} 未找到")

    # 缓存结果
    await cache.set(cache_key, quote, ttl=60)

    return quote


@router.get("/{code}/info", response_model=StockInfo)
async def get_stock_info(code: str):
    """获取股票基本信息"""
    cache_key = f"stock:{code}:info"

    # 尝试从缓存获取 (1天)
    cached = await cache.get(cache_key)
    if cached:
        return cached

    # 从 Akshare 获取
    info = await akshare.get_stock_info(code)

    if not info:
        raise HTTPException(status_code=404, detail=f"股票 {code} 信息未找到")

    # 缓存结果
    await cache.set(cache_key, info, ttl=86400)

    return info


@router.get("/{code}/kline")
async def get_kline_data(
    code: str,
    period: str = Query("daily", description="周期: daily, weekly, monthly"),
    start_date: Optional[str] = Query(None, description="开始日期 YYYYMMDD"),
    end_date: Optional[str] = Query(None, description="结束日期 YYYYMMDD"),
    adjust: str = Query("qfq", description="复权: qfq, hfq, 空"),
):
    """获取 K线数据"""
    cache_key = f"stock:{code}:kline:{period}:{start_date}:{end_date}:{adjust}"

    # 尝试从缓存获取 (1小时)
    cached = await cache.get(cache_key)
    if cached:
        return cached

    # 从 Akshare 获取
    kline_data = await akshare.get_kline_data(code, period, start_date, end_date, adjust)

    if not kline_data:
        raise HTTPException(status_code=404, detail=f"股票 {code} K线数据未找到")

    # 缓存结果
    await cache.set(cache_key, kline_data, ttl=3600)

    return kline_data


@router.get("/{code}/fundamental")
async def get_fundamental_data(code: str):
    """获取基本面数据"""
    cache_key = f"stock:{code}:fundamental"

    # 尝试从缓存获取 (1天)
    cached = await cache.get(cache_key)
    if cached:
        return cached

    # 从 Akshare 获取
    data = await akshare.get_financial_data(code)

    if not data:
        raise HTTPException(status_code=404, detail=f"股票 {code} 财务数据未找到")

    # 缓存结果
    await cache.set(cache_key, data, ttl=86400)

    return data


@router.get("/{code}/indicators/{indicator}")
async def get_technical_indicator(
    code: str,
    indicator: str = Query(..., description="指标: sma, ema, macd, rsi, kdj, boll, cci, wr"),
    period: int = Query(20, description="计算周期"),
):
    """计算技术指标"""
    # 获取 K线数据
    kline_data = await akshare.get_kline_data(code)

    if not kline_data:
        raise HTTPException(status_code=404, detail=f"股票 {code} 数据未找到")

    # 提取价格数据
    close = [k["close"] for k in kline_data]
    high = [k["high"] for k in kline_data]
    low = [k["low"] for k in kline_data]
    open_price = [k["open_price"] for k in kline_data]

    # 计算指标
    result = None

    if indicator == "sma":
        values = technical_calculator.sma(close, period)
        result = {"name": f"SMA({period})", "values": values}
    elif indicator == "ema":
        values = technical_calculator.ema(close, period)
        result = {"name": f"EMA({period})", "values": values}
    elif indicator == "macd":
        result = technical_calculator.macd(close)
        result["name"] = "MACD"
    elif indicator == "rsi":
        values = technical_calculator.rsi(close, period)
        result = {"name": f"RSI({period})", "values": values}
    elif indicator == "kdj":
        result = technical_calculator.kdj(high, low, close)
        result["name"] = "KDJ"
    elif indicator == "boll":
        result = technical_calculator.bollinger_bands(close, period)
        result["name"] = f"BOLL({period})"
    elif indicator == "cci":
        values = technical_calculator.cci(high, low, close, period)
        result = {"name": f"CCI({period})", "values": values}
    elif indicator == "wr":
        values = technical_calculator.wr(high, low, close, period)
        result = {"name": f"WR({period})", "values": values}
    else:
        raise HTTPException(status_code=400, detail=f"不支持的指标: {indicator}")

    return result
