"""股票数据模型"""
from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, Field


class StockInfo(BaseModel):
    """股票基本信息"""

    code: str = Field(..., description="股票代码")
    name: str = Field(..., description="股票名称")
    industry: Optional[str] = Field(None, description="所属行业")
    market: str = Field(..., description="市场类型")
    list_date: Optional[date] = Field(None, description="上市日期")


class StockQuote(BaseModel):
    """股票行情"""

    code: str = Field(..., description="股票代码")
    name: str = Field(..., description="股票名称")
    price: float = Field(..., description="当前价格")
    change: float = Field(..., description="涨跌额")
    change_pct: float = Field(..., description="涨跌幅(%)")
    volume: float = Field(..., description="成交量")
    amount: float = Field(..., description="成交额")
    high: float = Field(..., description="最高价")
    low: float = Field(..., description="最低价")
    open_price: float = Field(..., description="开盘价")
    close_prev: float = Field(..., description="昨收价")
    timestamp: datetime = Field(default_factory=datetime.now, description="时间戳")


class KLineData(BaseModel):
    """K线数据"""

    date: date = Field(..., description="日期")
    open_price: float = Field(..., description="开盘价")
    high: float = Field(..., description="最高价")
    low: float = Field(..., description="最低价")
    close: float = Field(..., description="收盘价")
    volume: float = Field(..., description="成交量")
    amount: float = Field(..., description="成交额")


class TechnicalIndicator(BaseModel):
    """技术指标"""

    name: str = Field(..., description="指标名称")
    values: list[float] = Field(..., description="指标值")
    params: dict = Field(default_factory=dict, description="指标参数")


class FundamentalData(BaseModel):
    """基本面数据"""

    code: str = Field(..., description="股票代码")
    pe: Optional[float] = Field(None, description="市盈率")
    pb: Optional[float] = Field(None, description="市净率")
    ps: Optional[float] = Field(None, description="市销率")
    roe: Optional[float] = Field(None, description="净资产收益率")
    roa: Optional[float] = Field(None, description="总资产收益率")
    gross_margin: Optional[float] = Field(None, description="毛利率")
    net_margin: Optional[float] = Field(None, description="净利率")
    debt_ratio: Optional[float] = Field(None, description="资产负债率")
    current_ratio: Optional[float] = Field(None, description="流动比率")
    quick_ratio: Optional[float] = Field(None, description="速动比率")
