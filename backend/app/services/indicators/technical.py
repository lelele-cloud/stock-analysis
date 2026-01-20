"""技术指标计算引擎"""
from typing import Optional
from decimal import Decimal
import logging

try:
    import pandas as pd
    import numpy as np
except ImportError:
    pd = None
    np = None

logger = logging.getLogger(__name__)


class TechnicalIndicators:
    """技术指标计算器"""

    @staticmethod
    def sma(data: list[float], period: int) -> list[Optional[float]]:
        """简单移动平均 (SMA)

        Args:
            data: 价格数据
            period: 周期

        Returns:
            移动平均线数据
        """
        if pd is None:
            logger.warning("pandas 未安装，无法计算技术指标")
            return [None] * len(data)

        try:
            df = pd.DataFrame({"value": data})
            sma = df["value"].rolling(window=period).mean()
            return sma.tolist()
        except Exception as e:
            logger.error(f"计算 SMA 失败: {e}")
            return [None] * len(data)

    @staticmethod
    def ema(data: list[float], period: int) -> list[Optional[float]]:
        """指数移动平均 (EMA)

        Args:
            data: 价格数据
            period: 周期

        Returns:
            EMA 数据
        """
        if pd is None:
            return [None] * len(data)

        try:
            df = pd.DataFrame({"value": data})
            ema = df["value"].ewm(span=period, adjust=False).mean()
            return ema.tolist()
        except Exception as e:
            logger.error(f"计算 EMA 失败: {e}")
            return [None] * len(data)

    @staticmethod
    def macd(
        close: list[float],
        fast_period: int = 12,
        slow_period: int = 26,
        signal_period: int = 9,
    ) -> dict[str, list[Optional[float]]]:
        """MACD 指标

        Args:
            close: 收盘价
            fast_period: 快线周期
            slow_period: 慢线周期
            signal_period: 信号线周期

        Returns:
            MACD, Signal, Histogram
        """
        if pd is None:
            return {
                "macd": [None] * len(close),
                "signal": [None] * len(close),
                "histogram": [None] * len(close),
            }

        try:
            ema_fast = pd.Series(close).ewm(span=fast_period, adjust=False).mean()
            ema_slow = pd.Series(close).ewm(span=slow_period, adjust=False).mean()
            macd_line = ema_fast - ema_slow
            signal_line = macd_line.ewm(span=signal_period, adjust=False).mean()
            histogram = macd_line - signal_line

            return {
                "macd": macd_line.tolist(),
                "signal": signal_line.tolist(),
                "histogram": histogram.tolist(),
            }
        except Exception as e:
            logger.error(f"计算 MACD 失败: {e}")
            return {
                "macd": [None] * len(close),
                "signal": [None] * len(close),
                "histogram": [None] * len(close),
            }

    @staticmethod
    def rsi(close: list[float], period: int = 14) -> list[Optional[float]]:
        """相对强弱指标 (RSI)

        Args:
            close: 收盘价
            period: 周期

        Returns:
            RSI 数据
        """
        if pd is None:
            return [None] * len(close)

        try:
            df = pd.DataFrame({"close": close})
            delta = df["close"].diff()

            gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
            loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()

            # 处理除零情况
            rs = gain / loss.replace(0, float('inf'))
            rsi = 100 - (100 / (1 + rs))

            return rsi.tolist()
        except Exception as e:
            logger.error(f"计算 RSI 失败: {e}")
            return [None] * len(close)

    @staticmethod
    def kdj(
        high: list[float],
        low: list[float],
        close: list[float],
        n: int = 9,
        m1: int = 3,
        m2: int = 3,
    ) -> dict[str, list[Optional[float]]]:
        """KDJ 指标

        Args:
            high: 最高价
            low: 最低价
            close: 收盘价
            n: RSV 周期
            m1: K 值平滑周期
            m2: D 值平滑周期

        Returns:
            K, D, J 数据
        """
        if pd is None:
            return {
                "k": [None] * len(close),
                "d": [None] * len(close),
                "j": [None] * len(close),
            }

        try:
            df = pd.DataFrame(
                {
                    "high": high,
                    "low": low,
                    "close": close,
                }
            )

            low_list = df["low"].rolling(window=n, min_periods=1).min()
            high_list = df["high"].rolling(window=n, min_periods=1).max()
            rsv = (df["close"] - low_list) / (high_list - low_list) * 100

            k = rsv.ewm(com=m1 - 1, adjust=False).mean()
            d = k.ewm(com=m2 - 1, adjust=False).mean()
            j = 3 * k - 2 * d

            return {
                "k": k.tolist(),
                "d": d.tolist(),
                "j": j.tolist(),
            }
        except Exception as e:
            logger.error(f"计算 KDJ 失败: {e}")
            return {
                "k": [None] * len(close),
                "d": [None] * len(close),
                "j": [None] * len(close),
            }

    @staticmethod
    def bollinger_bands(
        close: list[float],
        period: int = 20,
        std_dev: float = 2.0,
    ) -> dict[str, list[Optional[float]]]:
        """布林带 (BOLL)

        Args:
            close: 收盘价
            period: 周期
            std_dev: 标准差倍数

        Returns:
            上轨、中轨、下轨数据
        """
        if pd is None:
            return {
                "upper": [None] * len(close),
                "middle": [None] * len(close),
                "lower": [None] * len(close),
            }

        try:
            df = pd.DataFrame({"close": close})
            middle = df["close"].rolling(window=period).mean()
            std = df["close"].rolling(window=period).std()
            upper = middle + std_dev * std
            lower = middle - std_dev * std

            return {
                "upper": upper.tolist(),
                "middle": middle.tolist(),
                "lower": lower.tolist(),
            }
        except Exception as e:
            logger.error(f"计算 BOLL 失败: {e}")
            return {
                "upper": [None] * len(close),
                "middle": [None] * len(close),
                "lower": [None] * len(close),
            }

    @staticmethod
    def cci(
        high: list[float],
        low: list[float],
        close: list[float],
        period: int = 14,
    ) -> list[Optional[float]]:
        """顺势指标 (CCI)

        Args:
            high: 最高价
            low: 最低价
            close: 收盘价
            period: 周期

        Returns:
            CCI 数据
        """
        if pd is None:
            return [None] * len(close)

        try:
            df = pd.DataFrame(
                {
                    "high": high,
                    "low": low,
                    "close": close,
                }
            )

            tp = (df["high"] + df["low"] + df["close"]) / 3
            ma_tp = tp.rolling(window=period).mean()
            md = tp.rolling(window=period).apply(lambda x: abs(x - x.mean()).mean(), raw=True)
            cci = (tp - ma_tp) / (0.015 * md)

            return cci.tolist()
        except Exception as e:
            logger.error(f"计算 CCI 失败: {e}")
            return [None] * len(close)

    @staticmethod
    def wr(
        high: list[float],
        low: list[float],
        close: list[float],
        period: int = 14,
    ) -> list[Optional[float]]:
        """威廉指标 (WR)

        Args:
            high: 最高价
            low: 最低价
            close: 收盘价
            period: 周期

        Returns:
            WR 数据
        """
        if pd is None:
            return [None] * len(close)

        try:
            df = pd.DataFrame(
                {
                    "high": high,
                    "low": low,
                    "close": close,
                }
            )

            high_list = df["high"].rolling(window=period, min_periods=1).max()
            low_list = df["low"].rolling(window=period, min_periods=1).min()
            wr = (high_list - df["close"]) / (high_list - low_list) * -100

            return wr.tolist()
        except Exception as e:
            logger.error(f"计算 WR 失败: {e}")
            return [None] * len(close)


# 计算服务实例
technical_calculator = TechnicalIndicators()
