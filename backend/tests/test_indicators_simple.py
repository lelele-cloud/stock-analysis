"""Simple technical indicators test (no Pydantic dependency)"""
import sys
sys.path.insert(0, '.')

from app.services.indicators import technical_calculator


def test_sma():
    """Test Simple Moving Average"""
    prices = [10, 12, 14, 16, 18, 20, 22, 24, 26, 28]
    period = 5

    result = technical_calculator.sma(prices, period)

    assert len(result) == len(prices)
    assert result[4] == 14.0
    assert result[5] == 16.0
    print("[PASS] SMA test passed")


def test_ema():
    """Test Exponential Moving Average"""
    prices = [10, 12, 14, 16, 18, 20, 22, 24, 26, 28]
    period = 5

    result = technical_calculator.ema(prices, period)

    assert len(result) == len(prices)
    assert result[4] is not None
    print("[PASS] EMA test passed")


def test_macd():
    """Test MACD indicator"""
    prices = list(range(100, 200, 2))

    result = technical_calculator.macd(prices)

    assert "macd" in result
    assert "signal" in result
    assert "histogram" in result
    print("[PASS] MACD test passed")


def test_rsi():
    """Test RSI indicator"""
    prices = [100, 102, 104, 106, 108, 110, 112, 114, 116, 118,
              120, 119, 118, 117, 116, 115, 114, 113, 112, 111]
    period = 14

    result = technical_calculator.rsi(prices, period)

    assert len(result) == len(prices)
    # RSI should be between 0-100 (ignoring None and nan)
    import math
    valid_values = [r for r in result if r is not None and not (isinstance(r, float) and math.isnan(r))]
    if valid_values:
        assert all(0 <= r <= 100 for r in valid_values)
    print("[PASS] RSI test passed")


def test_kdj():
    """Test KDJ indicator"""
    high = [105, 107, 109, 111, 113, 115, 117, 119, 121, 123]
    low = [95, 97, 99, 101, 103, 105, 107, 109, 111, 113]
    close = [100, 102, 104, 106, 108, 110, 112, 114, 116, 118]

    result = technical_calculator.kdj(high, low, close)

    assert "k" in result
    assert "d" in result
    assert "j" in result
    print("[PASS] KDJ test passed")


def test_bollinger_bands():
    """Test Bollinger Bands"""
    prices = list(range(100, 200, 2))
    period = 20

    result = technical_calculator.bollinger_bands(prices, period)

    assert "upper" in result
    assert "middle" in result
    assert "lower" in result
    print("[PASS] Bollinger Bands test passed")


def test_cci():
    """Test CCI indicator"""
    high = [105, 107, 109, 111, 113, 115, 117, 119, 121, 123]
    low = [95, 97, 99, 101, 103, 105, 107, 109, 111, 113]
    close = [100, 102, 104, 106, 108, 110, 112, 114, 116, 118]
    period = 14

    result = technical_calculator.cci(high, low, close, period)

    assert len(result) == len(close)
    # CCI typically between -200 and +200 (ignoring None and nan)
    import math
    valid_values = [r for r in result if r is not None and not (isinstance(r, float) and math.isnan(r))]
    if valid_values:
        assert all(-300 <= r <= 300 for r in valid_values)
    print("[PASS] CCI test passed")


def test_wr():
    """Test Williams %R indicator"""
    high = [105, 107, 109, 111, 113, 115, 117, 119, 121, 123]
    low = [95, 97, 99, 101, 103, 105, 107, 109, 111, 113]
    close = [100, 102, 104, 106, 108, 110, 112, 114, 116, 118]
    period = 14

    result = technical_calculator.wr(high, low, close, period)

    assert len(result) == len(close)
    # WR should be between -100 and 0
    assert all(-100 <= r <= 0 for r in result if r is not None)
    print("[PASS] Williams %R test passed")


def test_empty_data():
    """Test empty data handling"""
    result = technical_calculator.sma([], 5)
    assert result == []

    result = technical_calculator.rsi([], 14)
    assert result == []
    print("[PASS] Empty data test passed")


if __name__ == "__main__":
    print("=" * 60)
    print("Testing Technical Indicators")
    print("=" * 60)
    print()

    test_sma()
    test_ema()
    test_macd()
    test_rsi()
    test_kdj()
    test_bollinger_bands()
    test_cci()
    test_wr()
    test_empty_data()

    print()
    print("=" * 60)
    print("All technical indicator tests PASSED!")
    print("=" * 60)
