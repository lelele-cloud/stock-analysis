"""选股引擎"""
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


class ScreenerEngine:
    """选股引擎"""

    def __init__(self, data_service):
        """
        初始化选股引擎

        Args:
            data_service: 数据服务 (akshare_service)
        """
        self.data_service = data_service

    async def screen(
        self,
        conditions: List[Dict[str, Any]],
        sort_by: Optional[str] = None,
        sort_order: str = "desc",
        limit: int = 100,
    ) -> List[Dict[str, Any]]:
        """
        执行选股

        Args:
            conditions: 筛选条件列表
                [{
                    "field": "pe",           # 字段名
                    "operator": "<",         # 操作符: <, <=, >, >=, ==, !=, between
                    "value": 20,             # 值 (between 时为 [min, max])
                }]
            sort_by: 排序字段
            sort_order: 排序方向 (asc/desc)
            limit: 返回数量限制

        Returns:
            筛选结果列表
        """
        try:
            # 获取所有A股列表
            all_stocks = await self._get_all_stocks()

            if not all_stocks:
                return []

            # 应用筛选条件
            filtered_stocks = await self._apply_conditions(all_stocks, conditions)

            # 排序
            if sort_by:
                filtered_stocks = self._sort_results(filtered_stocks, sort_by, sort_order)

            # 限制返回数量
            return filtered_stocks[:limit]

        except Exception as e:
            logger.error(f"选股失败: {e}")
            return []

    async def _get_all_stocks(self) -> List[Dict[str, Any]]:
        """获取所有A股列表及基础数据"""
        try:
            # 获取股票列表
            stocks = await self.data_service.get_stock_list()

            if not stocks:
                return []

            # 获取每只股票的实时行情
            results = []
            for stock in stocks[:500]:  # 限制数量避免超时
                try:
                    code = stock.get("code")
                    if not code:
                        continue

                    quote = await self.data_service.get_spot_quote(code)
                    if quote:
                        results.append(quote)
                except Exception as e:
                    logger.debug(f"获取股票 {stock.get('code')} 数据失败: {e}")
                    continue

            return results

        except Exception as e:
            logger.error(f"获取股票列表失败: {e}")
            return []

    async def _apply_conditions(
        self,
        stocks: List[Dict[str, Any]],
        conditions: List[Dict[str, Any]],
    ) -> List[Dict[str, Any]]:
        """应用筛选条件"""
        filtered = stocks

        for condition in conditions:
            field = condition.get("field")
            operator = condition.get("operator")
            value = condition.get("value")

            if not field or operator is None:
                continue

            filtered = [
                stock for stock in filtered
                if self._match_condition(stock, field, operator, value)
            ]

        return filtered

    def _match_condition(
        self,
        stock: Dict[str, Any],
        field: str,
        operator: str,
        value: Any,
    ) -> bool:
        """判断单个股票是否匹配条件"""
        try:
            # 获取字段值
            stock_value = stock.get(field)

            if stock_value is None:
                return False

            # 根据操作符判断
            if operator == "<":
                return stock_value < value
            elif operator == "<=":
                return stock_value <= value
            elif operator == ">":
                return stock_value > value
            elif operator == ">=":
                return stock_value >= value
            elif operator == "==":
                return stock_value == value
            elif operator == "!=":
                return stock_value != value
            elif operator == "between":
                if isinstance(value, (list, tuple)) and len(value) == 2:
                    return value[0] <= stock_value <= value[1]
            elif operator == "contains":
                if isinstance(stock_value, str):
                    return value in stock_value
            elif operator == "startswith":
                if isinstance(stock_value, str):
                    return stock_value.startswith(value)

            return False

        except Exception as e:
            logger.debug(f"条件判断失败: {e}")
            return False

    def _sort_results(
        self,
        stocks: List[Dict[str, Any]],
        sort_by: str,
        sort_order: str = "desc",
    ) -> List[Dict[str, Any]]:
        """排序结果"""
        try:
            reverse = sort_order.lower() == "desc"

            return sorted(
                stocks,
                key=lambda x: x.get(sort_by, 0) or 0,
                reverse=reverse,
            )

        except Exception as e:
            logger.error(f"排序失败: {e}")
            return stocks

    @staticmethod
    def get_available_fields() -> Dict[str, Dict[str, str]]:
        """
        获取可用的筛选字段

        Returns:
            字段信息字典
            {
                "field_name": {
                    "name": "显示名称",
                    "type": "数据类型",
                    "description": "描述",
                }
            }
        """
        return {
            # 价格相关
            "price": {
                "name": "价格",
                "type": "number",
                "description": "当前股价",
            },
            "change_pct": {
                "name": "涨跌幅",
                "type": "number",
                "description": "当日涨跌幅百分比",
            },
            "high": {
                "name": "最高价",
                "type": "number",
                "description": "当日最高价",
            },
            "low": {
                "name": "最低价",
                "type": "number",
                "description": "当日最低价",
            },
            "open": {
                "name": "开盘价",
                "type": "number",
                "description": "当日开盘价",
            },
            # 成交量相关
            "volume": {
                "name": "成交量",
                "type": "number",
                "description": "成交量（手）",
            },
            "amount": {
                "name": "成交额",
                "type": "number",
                "description": "成交额（元）",
            },
            # 基本面
            "pe": {
                "name": "市盈率",
                "type": "number",
                "description": "静态市盈率",
            },
            "pb": {
                "name": "市净率",
                "type": "number",
                "description": "市净率",
            },
            "roe": {
                "name": "净资产收益率",
                "type": "number",
                "description": "ROE (%)",
            },
            # 字符串字段
            "name": {
                "name": "股票名称",
                "type": "string",
                "description": "股票名称",
            },
            "code": {
                "name": "股票代码",
                "type": "string",
                "description": "股票代码",
            },
        }

    @staticmethod
    def get_template_strategies() -> List[Dict[str, Any]]:
        """获取预设的选股策略模板"""
        return [
            {
                "id": "low_pe_growth",
                "name": "低估值成长股",
                "description": "PE < 20, 涨跌幅 > 0%",
                "category": "价值投资",
                "conditions": [
                    {"field": "pe", "operator": "<", "value": 20},
                    {"field": "change_pct", "operator": ">", "value": 0},
                ],
                "sort_by": "pe",
                "sort_order": "asc",
            },
            {
                "id": "momentum",
                "name": "动量策略",
                "description": "当日涨幅 > 3%, 成交额 > 1亿",
                "category": "技术分析",
                "conditions": [
                    {"field": "change_pct", "operator": ">", "value": 3},
                    {"field": "amount", "operator": ">", "value": 100000000},
                ],
                "sort_by": "change_pct",
                "sort_order": "desc",
            },
            {
                "id": "low_price",
                "name": "低价股",
                "description": "股价 < 10元",
                "category": "价格筛选",
                "conditions": [
                    {"field": "price", "operator": "<", "value": 10},
                ],
                "sort_by": "price",
                "sort_order": "asc",
            },
            {
                "id": "high_volume",
                "name": "高成交量",
                "description": "成交额 > 10亿",
                "category": "活跃股",
                "conditions": [
                    {"field": "amount", "operator": ">", "value": 1000000000},
                ],
                "sort_by": "amount",
                "sort_order": "desc",
            },
            {
                "id": "gainers",
                "name": "涨幅榜",
                "description": "涨幅 > 5%",
                "category": "强势股",
                "conditions": [
                    {"field": "change_pct", "operator": ">", "value": 5},
                ],
                "sort_by": "change_pct",
                "sort_order": "desc",
            },
            {
                "id": "losers",
                "name": "跌幅榜",
                "description": "跌幅 < -5%",
                "category": "弱势股",
                "conditions": [
                    {"field": "change_pct", "operator": "<", "value": -5},
                ],
                "sort_by": "change_pct",
                "sort_order": "asc",
            },
        ]


# 创建选股引擎实例
def get_screener_engine(data_service):
    """获取选股引擎实例"""
    return ScreenerEngine(data_service)
