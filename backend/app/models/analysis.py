"""分析相关数据模型"""
from datetime import datetime
from typing import Optional
from enum import Enum
from pydantic import BaseModel, Field


class AgentRole(str, Enum):
    """智能体角色"""

    FUNDAMENTAL = "fundamental"  # 基本面分析师
    SENTIMENT = "sentiment"  # 情绪分析师
    NEWS = "news"  # 新闻分析师
    TECHNICAL = "technical"  # 技术分析师
    RESEARCHER = "researcher"  # 研究员
    TRADER = "trader"  # 交易员
    RISK_MANAGER = "risk_manager"  # 风险管理师


class AnalysisStatus(str, Enum):
    """分析状态"""

    PENDING = "pending"  # 等待中
    COLLECTING = "collecting"  # 数据采集中
    ANALYZING = "analyzing"  # 分析中
    DEBATING = "debating"  # 辩论中
    DECIDING = "deciding"  # 决策中
    COMPLETED = "completed"  # 已完成
    FAILED = "failed"  # 失败


class AnalysisRequest(BaseModel):
    """分析请求"""

    stock_code: str = Field(..., description="股票代码", min_length=6, max_length=6)
    analysis_type: str = Field(default="comprehensive", description="分析类型")
    user_note: Optional[str] = Field(None, description="用户备注")


class AnalysisTask(BaseModel):
    """分析任务"""

    task_id: str = Field(..., description="任务 ID")
    stock_code: str = Field(..., description="股票代码")
    stock_name: str = Field(..., description="股票名称")
    status: AnalysisStatus = Field(default=AnalysisStatus.PENDING, description="任务状态")
    progress: float = Field(default=0.0, description="进度 0-100")
    created_at: datetime = Field(default_factory=datetime.now, description="创建时间")
    updated_at: datetime = Field(default_factory=datetime.now, description="更新时间")


class AgentMessage(BaseModel):
    """智能体消息"""

    task_id: str = Field(..., description="任务 ID")
    agent_role: AgentRole = Field(..., description="智能体角色")
    content: str = Field(..., description="消息内容")
    timestamp: datetime = Field(default_factory=datetime.now, description="时间戳")
    is_final: bool = Field(default=False, description="是否为最终结论")


class AnalysisReport(BaseModel):
    """分析报告"""

    task_id: str = Field(..., description="任务 ID")
    stock_code: str = Field(..., description="股票代码")
    stock_name: str = Field(..., description="股票名称")

    # 各智能体分析结果
    fundamental_analysis: Optional[str] = Field(None, description="基本面分析")
    sentiment_analysis: Optional[str] = Field(None, description="情绪分析")
    news_analysis: Optional[str] = Field(None, description="新闻分析")
    technical_analysis: Optional[str] = Field(None, description="技术分析")

    # 综合分析
    research_summary: Optional[str] = Field(None, description="研究总结")
    trading_decision: Optional[str] = Field(None, description="交易决策")
    risk_assessment: Optional[str] = Field(None, description="风险评估")

    # 评分
    fundamental_score: Optional[int] = Field(None, ge=0, le=100, description="基本面评分")
    sentiment_score: Optional[int] = Field(None, ge=0, le=100, description="情绪评分")
    technical_score: Optional[int] = Field(None, ge=0, le=100, description="技术面评分")

    # 建议
    recommendation: Optional[str] = Field(None, description="综合建议 (买入/持有/卖出)")
    target_price: Optional[float] = Field(None, description="目标价")
    stop_loss: Optional[float] = Field(None, description="止损价")

    created_at: datetime = Field(default_factory=datetime.now, description="创建时间")


class ScreenerCondition(BaseModel):
    """选股条件"""

    field: str = Field(..., description="字段名")
    operator: str = Field(..., description="操作符 (>, <, =, >=, <=, between)")
    value: str | float | list[float] = Field(..., description="值")


class ScreenerRequest(BaseModel):
    """选股请求"""

    name: str = Field(..., description="策略名称")
    conditions: list[ScreenerCondition] = Field(..., description="筛选条件")
    order_by: Optional[str] = Field(None, description="排序字段")
    order_dir: str = Field(default="desc", description="排序方向")


class BacktestRequest(BaseModel):
    """回测请求"""

    name: str = Field(..., description="策略名称")
    stock_pool: list[str] = Field(..., description="股票池")
    start_date: str = Field(..., description="开始日期")
    end_date: str = Field(..., description="结束日期")
    initial_capital: float = Field(default=100000.0, description="初始资金")
    conditions: list[ScreenerCondition] = Field(..., description="交易条件")


class BacktestResult(BaseModel):
    """回测结果"""

    total_return: float = Field(..., description="总收益率")
    annual_return: float = Field(..., description="年化收益率")
    max_drawdown: float = Field(..., description="最大回撤")
    sharpe_ratio: Optional[float] = Field(None, description="夏普比率")
    win_rate: float = Field(..., description="胜率")
    total_trades: int = Field(..., description="总交易次数")
    profit_trades: int = Field(..., description="盈利交易次数")
    loss_trades: int = Field(..., description="亏损交易次数")
