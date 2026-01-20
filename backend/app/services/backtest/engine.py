"""回测引擎"""
import logging
from typing import List, Dict, Any, Optional, Callable
from datetime import datetime
from decimal import Decimal

logger = logging.getLogger(__name__)


class BacktestEngine:
    """回测引擎"""

    def __init__(self, data_service):
        """
        初始化回测引擎

        Args:
            data_service: 数据服务 (akshare_service)
        """
        self.data_service = data_service

    async def run(
        self,
        stock_code: str,
        strategy_type: str,
        strategy_params: Dict[str, Any],
        start_date: str,
        end_date: str,
        initial_capital: float = 100000.0,
    ) -> Dict[str, Any]:
        """
        执行回测

        Args:
            stock_code: 股票代码
            strategy_type: 策略类型 (sma_cross, macd, rsi, boll)
            strategy_params: 策略参数
            start_date: 开始日期 (YYYYMMDD)
            end_date: 结束日期 (YYYYMMDD)
            initial_capital: 初始资金

        Returns:
            回测结果
        """
        try:
            # 获取历史数据
            kline_data = await self.data_service.get_kline_data(
                stock_code,
                period="daily",
                start_date=start_date,
                end_date=end_date,
                adjust="qfq",
            )

            if not kline_data or len(kline_data) < 50:
                return {
                    "success": False,
                    "error": "数据不足，无法回测",
                }

            # 执行回测
            if strategy_type == "sma_cross":
                result = self._sma_cross_strategy(kline_data, strategy_params, initial_capital)
            elif strategy_type == "macd":
                result = self._macd_strategy(kline_data, strategy_params, initial_capital)
            elif strategy_type == "rsi":
                result = self._rsi_strategy(kline_data, strategy_params, initial_capital)
            elif strategy_type == "boll":
                result = self._boll_strategy(kline_data, strategy_params, initial_capital)
            elif strategy_type == "buy_hold":
                result = self._buy_hold_strategy(kline_data, initial_capital)
            else:
                return {
                    "success": False,
                    "error": f"未知策略类型: {strategy_type}",
                }

            # 计算基准收益（买入持有）
            benchmark = self._buy_hold_strategy(kline_data, initial_capital)

            # 计算相对收益
            result["benchmark_return"] = benchmark["total_return"]
            result["excess_return"] = result["total_return"] - benchmark["total_return"]

            # 添加基本信息
            result["stock_code"] = stock_code
            result["stock_name"] = kline_data[0].get("name", "")
            result["start_date"] = start_date
            result["end_date"] = end_date
            result["initial_capital"] = initial_capital
            result["success"] = True

            return result

        except Exception as e:
            logger.error(f"回测失败: {e}")
            return {
                "success": False,
                "error": str(e),
            }

    def _sma_cross_strategy(
        self,
        data: List[Dict[str, Any]],
        params: Dict[str, Any],
        initial_capital: float,
    ) -> Dict[str, Any]:
        """SMA 金叉死叉策略"""
        short_period = params.get("short_period", 5)
        long_period = params.get("long_period", 20)

        # 计算 SMA
        short_sma = self._calculate_sma([d["close"] for d in data], short_period)
        long_sma = self._calculate_sma([d["close"] for d in data], long_period)

        # 生成交易信号
        signals = []
        for i in range(1, len(data)):
            if short_sma[i] and long_sma[i] and short_sma[i - 1] and long_sma[i - 1]:
                # 金叉买入
                if short_sma[i - 1] <= long_sma[i - 1] and short_sma[i] > long_sma[i]:
                    signals.append({"index": i, "action": "buy", "price": data[i]["close"]})
                # 死叉卖出
                elif short_sma[i - 1] >= long_sma[i - 1] and short_sma[i] < long_sma[i]:
                    signals.append({"index": i, "action": "sell", "price": data[i]["close"]})

        return self._execute_trades(data, signals, initial_capital)

    def _macd_strategy(
        self,
        data: List[Dict[str, Any]],
        params: Dict[str, Any],
        initial_capital: float,
    ) -> Dict[str, Any]:
        """MACD 策略"""
        from ...services.indicators.technical import technical_calculator

        close_prices = [d["close"] for d in data]
        macd_data = technical_calculator.macd(close_prices)

        # 生成交易信号
        signals = []
        for i in range(1, len(data)):
            macd = macd_data["macd"][i]
            signal = macd_data["signal"][i]
            prev_macd = macd_data["macd"][i - 1]
            prev_signal = macd_data["signal"][i - 1]

            if macd and signal and prev_macd and prev_signal:
                # MACD 上穿 Signal 买入
                if prev_macd <= prev_signal and macd > signal:
                    signals.append({"index": i, "action": "buy", "price": data[i]["close"]})
                # MACD 下穿 Signal 卖出
                elif prev_macd >= prev_signal and macd < signal:
                    signals.append({"index": i, "action": "sell", "price": data[i]["close"]})

        return self._execute_trades(data, signals, initial_capital)

    def _rsi_strategy(
        self,
        data: List[Dict[str, Any]],
        params: Dict[str, Any],
        initial_capital: float,
    ) -> Dict[str, Any]:
        """RSI 策略"""
        from ...services.indicators.technical import technical_calculator

        period = params.get("period", 14)
        oversold = params.get("oversold", 30)
        overbought = params.get("overbought", 70)

        close_prices = [d["close"] for d in data]
        rsi_values = technical_calculator.rsi(close_prices, period)

        # 生成交易信号
        signals = []
        for i in range(1, len(data)):
            rsi = rsi_values[i]
            prev_rsi = rsi_values[i - 1]

            if rsi and prev_rsi:
                # RSI 超卖区买入
                if prev_rsi >= oversold and rsi < oversold:
                    signals.append({"index": i, "action": "buy", "price": data[i]["close"]})
                # RSI 超买区卖出
                elif prev_rsi <= overbought and rsi > overbought:
                    signals.append({"index": i, "action": "sell", "price": data[i]["close"]})

        return self._execute_trades(data, signals, initial_capital)

    def _boll_strategy(
        self,
        data: List[Dict[str, Any]],
        params: Dict[str, Any],
        initial_capital: float,
    ) -> Dict[str, Any]:
        """布林带策略"""
        from ...services.indicators.technical import technical_calculator

        period = params.get("period", 20)

        close_prices = [d["close"] for d in data]
        boll_data = technical_calculator.bollinger_bands(close_prices, period)

        # 生成交易信号
        signals = []
        for i in range(1, len(data)):
            close = data[i]["close"]
            upper = boll_data["upper"][i]
            lower = boll_data["lower"][i]
            middle = boll_data["middle"][i]

            if close and upper and lower and middle:
                # 价格触及下轨买入
                if close <= lower:
                    signals.append({"index": i, "action": "buy", "price": close})
                # 价格触及上轨或中轨卖出
                elif close >= upper or close >= middle:
                    signals.append({"index": i, "action": "sell", "price": close})

        return self._execute_trades(data, signals, initial_capital)

    def _buy_hold_strategy(
        self,
        data: List[Dict[str, Any]],
        initial_capital: float,
    ) -> Dict[str, Any]:
        """买入持有策略（基准）"""
        if not data:
            return {"total_return": 0, "trades": [], "equity_curve": []}

        first_price = data[0]["close"]
        last_price = data[-1]["close"]
        shares = initial_capital / first_price
        final_value = shares * last_price
        total_return = ((final_value - initial_capital) / initial_capital) * 100

        # 生成权益曲线
        equity_curve = []
        for d in data:
            equity = (d["close"] / first_price) * initial_capital
            equity_curve.append({
                "date": d["date"],
                "equity": equity,
            })

        return {
            "total_return": total_return,
            "final_capital": final_value,
            "trades": [],
            "equity_curve": equity_curve,
        }

    def _execute_trades(
        self,
        data: List[Dict[str, Any]],
        signals: List[Dict[str, Any]],
        initial_capital: float,
    ) -> Dict[str, Any]:
        """执行交易并计算收益"""
        capital = initial_capital
        position = 0  # 持股数量
        trades = []
        equity_curve = []

        for i, d in enumerate(data):
            # 检查是否有信号
            for signal in signals:
                if signal["index"] == i:
                    if signal["action"] == "buy" and capital > 0:
                        # 买入
                        shares = capital // signal["price"]
                        if shares > 0:
                            position = shares
                            capital = capital - shares * signal["price"]
                            trades.append({
                                "date": d["date"],
                                "action": "buy",
                                "price": signal["price"],
                                "shares": shares,
                            })
                    elif signal["action"] == "sell" and position > 0:
                        # 卖出
                        capital = capital + position * signal["price"]
                        trades.append({
                            "date": d["date"],
                            "action": "sell",
                            "price": signal["price"],
                            "shares": position,
                        })
                        position = 0

            # 计算当前权益
            current_equity = capital + position * d["close"]
            equity_curve.append({
                "date": d["date"],
                "equity": current_equity,
            })

        # 最终价值
        final_capital = capital + position * data[-1]["close"]
        total_return = ((final_capital - initial_capital) / initial_capital) * 100

        # 计算统计指标
        returns = []
        for i in range(1, len(equity_curve)):
            daily_return = (equity_curve[i]["equity"] - equity_curve[i - 1]["equity"]) / equity_curve[i - 1]["equity"]
            returns.append(daily_return)

        win_trades = [t for t in trades if t["action"] == "sell"]
        total_trades = len(win_trades)

        return {
            "total_return": total_return,
            "final_capital": final_capital,
            "trades": trades,
            "total_trades": total_trades,
            "equity_curve": equity_curve,
            "max_drawdown": self._calculate_max_drawdown(equity_curve),
            "sharpe_ratio": self._calculate_sharpe_ratio(returns) if returns else 0,
        }

    def _calculate_sma(self, data: List[float], period: int) -> List[Optional[float]]:
        """计算简单移动平均"""
        result = []
        for i in range(len(data)):
            if i < period - 1:
                result.append(None)
            else:
                avg = sum(data[i - period + 1:i + 1]) / period
                result.append(avg)
        return result

    def _calculate_max_drawdown(self, equity_curve: List[Dict[str, Any]]) -> float:
        """计算最大回撤"""
        if not equity_curve:
            return 0

        peak = equity_curve[0]["equity"]
        max_drawdown = 0

        for item in equity_curve:
            if item["equity"] > peak:
                peak = item["equity"]
            drawdown = (peak - item["equity"]) / peak * 100
            max_drawdown = max(max_drawdown, drawdown)

        return max_drawdown

    def _calculate_sharpe_ratio(self, returns: List[float], risk_free_rate: float = 0.03) -> float:
        """计算夏普比率"""
        if not returns:
            return 0

        avg_return = sum(returns) / len(returns)
        variance = sum((r - avg_return) ** 2 for r in returns) / len(returns)
        std_dev = variance ** 0.5

        if std_dev == 0:
            return 0

        # 年化夏普比率（假设252个交易日）
        daily_risk_free = risk_free_rate / 252
        sharpe = (avg_return - daily_risk_free) / std_dev * (252 ** 0.5)

        return sharpe

    @staticmethod
    def get_strategy_templates() -> List[Dict[str, Any]]:
        """获取策略模板"""
        return [
            {
                "id": "sma_cross",
                "name": "SMA 金叉死叉",
                "description": "短期均线上穿长期均线买入，下穿卖出",
                "params": {
                    "short_period": {"name": "短期周期", "default": 5, "min": 2, "max": 60},
                    "long_period": {"name": "长期周期", "default": 20, "min": 5, "max": 200},
                },
            },
            {
                "id": "macd",
                "name": "MACD",
                "description": "MACD 上穿 Signal 线买入，下穿卖出",
                "params": {},
            },
            {
                "id": "rsi",
                "name": "RSI",
                "description": "RSI 超卖区买入，超买区卖出",
                "params": {
                    "period": {"name": "RSI 周期", "default": 14, "min": 5, "max": 30},
                    "oversold": {"name": "超卖线", "default": 30, "min": 10, "max": 40},
                    "overbought": {"name": "超买线", "default": 70, "min": 60, "max": 90},
                },
            },
            {
                "id": "boll",
                "name": "布林带",
                "description": "价格触及下轨买入，触及上轨卖出",
                "params": {
                    "period": {"name": "周期", "default": 20, "min": 10, "max": 50},
                },
            },
            {
                "id": "buy_hold",
                "name": "买入持有",
                "description": "买入后一直持有（基准策略）",
                "params": {},
            },
        ]


def get_backtest_engine(data_service):
    """获取回测引擎实例"""
    return BacktestEngine(data_service)
