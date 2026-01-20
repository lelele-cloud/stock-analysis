"""测试技术指标计算"""
import pytest
from app.services.indicators import technical_calculator


class TestTechnicalIndicators:
    """技术指标计算测试"""

    def test_sma(self):
        """测试简单移动平均线"""
        prices = [10, 12, 14, 16, 18, 20, 22, 24, 26, 28]
        period = 5

        result = technical_calculator.sma(prices, period)

        assert len(result) == len(prices)
        # 前4个值应该是None
        assert result[0] is None
        assert result[1] is None
        assert result[2] is None
        assert result[3] is None
        # 第5个值应该是前5个的平均
        assert result[4] == pytest.approx(14.0)
        # 第6个值
        assert result[5] == pytest.approx(16.0)

    def test_ema(self):
        """测试指数移动平均线"""
        prices = [10, 12, 14, 16, 18, 20, 22, 24, 26, 28]
        period = 5

        result = technical_calculator.ema(prices, period)

        assert len(result) == len(prices)
        # EMA 应该有值（包括第一个）
        assert result[4] is not None
        assert result[9] is not None
        # EMA 应该比 SMA 反应更快
        sma = technical_calculator.sma(prices, period)
        assert result[9] > sma[9]  # 上升趋势中，EMA > SMA

    def test_macd(self):
        """测试 MACD 指标"""
        prices = list(range(100, 200, 2))  # 上升价格序列

        result = technical_calculator.macd(prices)

        assert "macd" in result
        assert "signal" in result
        assert "histogram" in result
        assert len(result["macd"]) == len(prices)
        assert len(result["signal"]) == len(prices)
        assert len(result["histogram"]) == len(prices)

        # 上升趋势中，MACD 应该 > Signal
        assert result["macd"][-1] > result["signal"][-1]

    def test_rsi(self):
        """测试 RSI 指标"""
        prices = [100, 102, 104, 106, 108, 110, 112, 114, 116, 118,
                  120, 119, 118, 117, 116, 115, 114, 113, 112, 111]
        period = 14

        result = technical_calculator.rsi(prices, period)

        assert len(result) == len(prices)
        # RSI 应该在 0-100 之间
        assert all(0 <= r <= 100 for r in result if r is not None)
        # 上升趋势中，RSI 应该 > 50
        assert result[-1] > 50

    def test_kdj(self):
        """测试 KDJ 指标"""
        high = [105, 107, 109, 111, 113, 115, 117, 119, 121, 123]
        low = [95, 97, 99, 101, 103, 105, 107, 109, 111, 113]
        close = [100, 102, 104, 106, 108, 110, 112, 114, 116, 118]

        result = technical_calculator.kdj(high, low, close)

        assert "k" in result
        assert "d" in result
        assert "j" in result
        assert len(result["k"]) == len(close)
        assert len(result["d"]) == len(close)
        assert len(result["j"]) == len(close)

        # KDJ 应该在 0-100 之间
        assert all(0 <= v <= 100 for v in result["k"] if v is not None)
        assert all(0 <= v <= 100 for v in result["d"] if v is not None)
        # J 可以超出 0-100
        assert result["j"][-1] is not None

    def test_bollinger_bands(self):
        """测试布林带"""
        prices = list(range(100, 200, 2))
        period = 20

        result = technical_calculator.bollinger_bands(prices, period)

        assert "upper" in result
        assert "middle" in result
        assert "lower" in result
        assert len(result["upper"]) == len(prices)
        assert len(result["middle"]) == len(prices)
        assert len(result["lower"]) == len(prices)

        # 上轨 > 中轨 > 下轨
        if result["upper"][-1] and result["middle"][-1] and result["lower"][-1]:
            assert result["upper"][-1] > result["middle"][-1]
            assert result["middle"][-1] > result["lower"][-1]

    def test_cci(self):
        """测试 CCI 指标"""
        high = [105, 107, 109, 111, 113, 115, 117, 119, 121, 123]
        low = [95, 97, 99, 101, 103, 105, 107, 109, 111, 113]
        close = [100, 102, 104, 106, 108, 110, 112, 114, 116, 118]
        period = 14

        result = technical_calculator.cci(high, low, close, period)

        assert len(result) == len(close)
        # CCI 通常在 -200 到 +200 之间
        assert all(-300 <= r <= 300 for r in result if r is not None)

    def test_wr(self):
        """测试威廉指标"""
        high = [105, 107, 109, 111, 113, 115, 117, 119, 121, 123]
        low = [95, 97, 99, 101, 103, 105, 107, 109, 111, 113]
        close = [100, 102, 104, 106, 108, 110, 112, 114, 116, 118]
        period = 14

        result = technical_calculator.wr(high, low, close, period)

        assert len(result) == len(close)
        # WR 应该在 -100 到 0 之间
        assert all(-100 <= r <= 0 for r in result if r is not None)

    def test_empty_data(self):
        """测试空数据"""
        result = technical_calculator.sma([], 5)
        assert result == []

        result = technical_calculator.rsi([], 14)
        assert result == []

    def test_insufficient_data(self):
        """测试数据不足的情况"""
        prices = [1, 2, 3]
        period = 10

        result = technical_calculator.sma(prices, period)
        assert len(result) == len(prices)
        assert all(r is None for r in result)
