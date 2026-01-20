"""Akshare 数据采集服务"""
import asyncio
from datetime import datetime, date, timedelta
from typing import Optional
import logging
import akshare as ak
import pandas as pd

logger = logging.getLogger(__name__)


class AkshareService:
    """Akshare 数据服务"""

    def __init__(self):
        """初始化服务"""
        self.enabled = True
        logger.info("Akshare 数据服务初始化完成")

    async def get_spot_quote(self, code: str) -> Optional[dict]:
        """获取实时行情

        Args:
            code: 股票代码，如 "600519"

        Returns:
            行情数据字典
        """
        try:
            # 在线程池中执行同步的 akshare 调用
            loop = asyncio.get_event_loop()
            df = await loop.run_in_executor(
                None,
                lambda: ak.stock_zh_a_spot_em(),
            )

            # 查找目标股票
            stock_data = df[df["代码"] == code]

            if stock_data.empty:
                logger.warning(f"未找到股票 {code} 的行情数据")
                return None

            row = stock_data.iloc[0]

            return {
                "code": row["代码"],
                "name": row["名称"],
                "price": float(row["最新价"]),
                "change": float(row["涨跌额"]),
                "change_pct": float(row["涨跌幅"]),
                "volume": float(row["成交量"]),
                "amount": float(row["成交额"]),
                "high": float(row["最高"]),
                "low": float(row["最低"]),
                "open_price": float(row["今开"]),
                "close_prev": float(row["昨收"]),
                "timestamp": datetime.now(),
            }

        except Exception as e:
            logger.error(f"获取股票 {code} 实时行情失败: {e}")
            return None

    async def get_stock_info(self, code: str) -> Optional[dict]:
        """获取股票基本信息

        Args:
            code: 股票代码

        Returns:
            股票信息字典
        """
        try:
            loop = asyncio.get_event_loop()
            df = await loop.run_in_executor(
                None,
                lambda: ak.stock_individual_info_em(symbol=code),
            )

            if df is None or df.empty:
                logger.warning(f"未找到股票 {code} 的基本信息")
                return None

            # 转换为字典
            info = {}
            for _, row in df.iterrows():
                info[row["item"]] = row["value"]

            return {
                "code": code,
                "name": info.get("股票简称", ""),
                "industry": info.get("行业", ""),
                "market": info.get("市场类型", ""),
                "list_date": self._parse_date(info.get("上市日期", "")),
            }

        except Exception as e:
            logger.error(f"获取股票 {code} 基本信息失败: {e}")
            return None

    async def get_kline_data(
        self,
        code: str,
        period: str = "daily",
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        adjust: str = "qfq",
    ) -> list[dict]:
        """获取 K 线数据

        Args:
            code: 股票代码
            period: 周期 (daily, weekly, monthly)
            start_date: 开始日期 (YYYYMMDD)
            end_date: 结束日期 (YYYYMMDD)
            adjust: 复权类型 (qfq-前复权, hfq-后复权, ""-不复权)

        Returns:
            K 线数据列表
        """
        try:
            # 默认获取最近一年数据
            if end_date is None:
                end_date = datetime.now().strftime("%Y%m%d")
            if start_date is None:
                start_date = (datetime.now() - timedelta(days=365)).strftime("%Y%m%d")

            loop = asyncio.get_event_loop()
            symbol = f"{code}上海" if code.startswith("6") else f"{code}深圳"

            df = await loop.run_in_executor(
                None,
                lambda: ak.stock_zh_a_hist(
                    symbol=symbol,
                    period=period,
                    start_date=start_date,
                    end_date=end_date,
                    adjust=adjust,
                ),
            )

            if df is None or df.empty:
                logger.warning(f"未找到股票 {code} 的K线数据")
                return []

            # 转换数据格式
            kline_data = []
            for _, row in df.iterrows():
                kline_data.append(
                    {
                        "date": self._parse_date(str(row["日期"])),
                        "open_price": float(row["开盘"]),
                        "high": float(row["最高"]),
                        "low": float(row["最低"]),
                        "close": float(row["收盘"]),
                        "volume": float(row["成交量"]),
                        "amount": float(row["成交额"]),
                    }
                )

            return kline_data

        except Exception as e:
            logger.error(f"获取股票 {code} K线数据失败: {e}")
            return []

    async def get_financial_data(
        self,
        code: str,
        report_type: str = "yearly",
    ) -> Optional[dict]:
        """获取财务数据

        Args:
            code: 股票代码
            report_type: 报告类型 (yearly, quarterly)

        Returns:
            财务数据字典
        """
        try:
            loop = asyncio.get_event_loop()

            # 获取利润表
            profit_df = await loop.run_in_executor(
                None,
                lambda: ak.stock_profit_sheet_by_yearly_em(symbol=code),
            )

            # 获取资产负债表
            balance_df = await loop.run_in_executor(
                None,
                lambda: ak.stock_balance_sheet_by_yearly_em(symbol=code),
            )

            # 获取现金流量表
            cashflow_df = await loop.run_in_executor(
                None,
                lambda: ak.stock_cash_flow_sheet_by_yearly_em(symbol=code),
            )

            # 简化处理，返回最新一期数据
            if profit_df is None or profit_df.empty:
                return None

            latest = profit_df.iloc[0]

            return {
                "code": code,
                "report_date": self._parse_date(str(latest.get("报告期", ""))),
                "revenue": self._to_float(latest.get("营业总收入")),
                "net_profit": self._to_float(latest.get("净利润")),
                "gross_margin": self._to_float(latest.get("销售毛利率")),
                "net_margin": self._to_float(latest.get("销售净利率")),
                "roe": self._to_float(latest.get("净资产收益率")),
                "roa": self._to_float(latest.get("总资产净利率")),
            }

        except Exception as e:
            logger.error(f"获取股票 {code} 财务数据失败: {e}")
            return None

    async def search_stocks(self, keyword: str, limit: int = 20) -> list[dict]:
        """搜索股票

        Args:
            keyword: 搜索关键词 (代码或名称)
            limit: 返回结果数量限制

        Returns:
            股票列表
        """
        try:
            loop = asyncio.get_event_loop()
            df = await loop.run_in_executor(
                None,
                lambda: ak.stock_zh_a_spot_em(),
            )

            # 按代码或名称筛选
            if keyword.isdigit():
                result = df[df["代码"].str.contains(keyword)]
            else:
                result = df[df["名称"].str.contains(keyword)]

            result = result.head(limit)

            stocks = []
            for _, row in result.iterrows():
                stocks.append(
                    {
                        "code": row["代码"],
                        "name": row["名称"],
                        "price": float(row["最新价"]),
                        "change_pct": float(row["涨跌幅"]),
                    }
                )

            return stocks

        except Exception as e:
            logger.error(f"搜索股票失败: {e}")
            return []

    def _parse_date(self, date_str: str) -> Optional[date]:
        """解析日期字符串"""
        try:
            # 尝试多种日期格式
            for fmt in ("%Y-%m-%d", "%Y%m%d", "%Y/%m/%d"):
                try:
                    return datetime.strptime(date_str, fmt).date()
                except ValueError:
                    continue
            return None
        except Exception:
            return None

    def _to_float(self, value) -> Optional[float]:
        """转换为浮点数"""
        try:
            if pd.isna(value) or value == "-":
                return None
            return float(value)
        except (ValueError, TypeError):
            return None


# 全局单例
_akshare_service: Optional[AkshareService] = None


def get_akshare_service() -> AkshareService:
    """获取 Akshare 服务单例"""
    global _akshare_service
    if _akshare_service is None:
        _akshare_service = AkshareService()
    return _akshare_service
