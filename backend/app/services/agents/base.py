"""智能体基类"""
import json
import logging
from typing import Optional
from abc import ABC, abstractmethod

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI

from ...core.llm import get_llm
from ...models.stock import StockQuote, FundamentalData
from ...models.analysis import AgentRole

logger = logging.getLogger(__name__)


class BaseAgent(ABC):
    """智能体基类"""

    def __init__(self, role: AgentRole):
        """初始化智能体

        Args:
            role: 智能体角色
        """
        self.role = role
        self.llm = get_llm()
        self.system_prompt = self._load_prompt()

    @abstractmethod
    def _load_prompt(self) -> str:
        """加载系统提示词"""
        pass

    @abstractmethod
    async def analyze(self, context: dict) -> dict:
        """执行分析

        Args:
            context: 分析上下文数据

        Returns:
            分析结果
        """
        pass

    async def _call_llm(self, user_message: str) -> str:
        """调用 LLM

        Args:
            user_message: 用户消息

        Returns:
            LLM 响应
        """
        try:
            messages = [
                SystemMessage(content=self.system_prompt),
                HumanMessage(content=user_message),
            ]

            response = await self.llm.ainvoke(messages)
            return response.content

        except Exception as e:
            logger.error(f"LLM 调用失败: {e}")
            raise

    def _parse_json_response(self, response: str) -> dict:
        """解析 JSON 响应

        Args:
            response: LLM 响应字符串

        Returns:
            解析后的字典
        """
        try:
            # 尝试直接解析
            return json.loads(response)
        except json.JSONDecodeError:
            # 尝试提取 JSON 代码块
            import re

            json_match = re.search(r"```json\n(.*?)\n```", response, re.DOTALL)
            if json_match:
                return json.loads(json_match.group(1))

            # 尝试提取任何 JSON
            json_match = re.search(r"\{.*\}", response, re.DOTALL)
            if json_match:
                return json.loads(json_match.group(0))

            # 解析失败，返回原始响应
            logger.warning(f"无法解析 JSON 响应，返回原始内容")
            return {"raw_response": response}


class FundamentalAgent(BaseAgent):
    """基本面分析师"""

    def __init__(self):
        super().__init__(AgentRole.FUNDAMENTAL)

    def _load_prompt(self) -> str:
        """加载基本面分析提示词"""
        try:
            from .prompts.fundamental import PROMPT
            return PROMPT
        except ImportError:
            return """你是一位专业的股票基本面分析师。请分析公司的基本面情况，包括盈利能力、财务健康、估值水平和成长性。"""

    async def analyze(self, context: dict) -> dict:
        """执行基本面分析"""
        fundamental_data: FundamentalData = context.get("fundamental_data")
        stock_info = context.get("stock_info", {})

        # 构建分析请求
        analysis_request = f"""
请分析以下股票的基本面情况：

股票代码: {stock_info.get('code')}
股票名称: {stock_info.get('name')}
所属行业: {stock_info.get('industry')}

财务数据:
- 市盈率(PE): {fundamental_data.pe}
- 市净率(PB): {fundamental_data.pb}
- 净资产收益率(ROE): {fundamental_data.roe}%
- 毛利率: {fundamental_data.gross_margin}%
- 净利率: {fundamental_data.net_margin}%
- 资产负债率: {fundamental_data.debt_ratio}%

请给出基本面评分、投资逻辑和风险提示。
"""

        response = await self._call_llm(analysis_request)
        return self._parse_json_response(response)


class SentimentAgent(BaseAgent):
    """情绪分析师"""

    def __init__(self):
        super().__init__(AgentRole.SENTIMENT)

    def _load_prompt(self) -> str:
        """加载情绪分析提示词"""
        try:
            from .prompts.sentiment import PROMPT
            return PROMPT
        except ImportError:
            return """你是一位专业的市场情绪分析师。请分析市场情绪和投资者行为。"""

    async def analyze(self, context: dict) -> dict:
        """执行情绪分析"""
        quote: StockQuote = context.get("quote")

        analysis_request = f"""
请分析以下股票的市场情绪：

股票代码: {quote.code}
股票名称: {quote.name}
当前价格: {quote.price}
涨跌幅: {quote.change_pct}%
成交量: {quote.volume}
成交额: {quote.amount}

请给出情绪评分、情绪状态和情绪趋势。
"""

        response = await self._call_llm(analysis_request)
        return self._parse_json_response(response)


class NewsAgent(BaseAgent):
    """新闻分析师"""

    def __init__(self):
        super().__init__(AgentRole.NEWS)

    def _load_prompt(self) -> str:
        """加载新闻分析提示词"""
        try:
            from .prompts.news import PROMPT
            return PROMPT
        except ImportError:
            return """你是一位专业的新闻分析师。请分析与公司相关的新闻和公告。"""

    async def analyze(self, context: dict) -> dict:
        """执行新闻分析"""
        news_list = context.get("news", [])
        stock_info = context.get("stock_info", {})

        news_text = "\n".join([f"- {n.get('title', '')}: {n.get('summary', '')}" for n in news_list])

        analysis_request = f"""
请分析以下股票的相关新闻：

股票代码: {stock_info.get('code')}
股票名称: {stock_info.get('name')}

相关新闻:
{news_text if news_text else "暂无相关新闻"}

请给出新闻汇总、影响评级和预期影响。
"""

        response = await self._call_llm(analysis_request)
        return self._parse_json_response(response)


class TechnicalAgent(BaseAgent):
    """技术分析师"""

    def __init__(self):
        super().__init__(AgentRole.TECHNICAL)

    def _load_prompt(self) -> str:
        """加载技术分析提示词"""
        try:
            from .prompts.technical import PROMPT
            return PROMPT
        except ImportError:
            return """你是一位专业的技术分析师。请进行技术面分析，包括趋势、支撑阻力、技术指标和买卖信号。"""

    async def analyze(self, context: dict) -> dict:
        """执行技术分析"""
        quote: StockQuote = context.get("quote")
        indicators = context.get("indicators", {})

        analysis_request = f"""
请分析以下股票的技术面：

股票代码: {quote.code}
股票名称: {quote.name}
当前价格: {quote.price}
最高价: {quote.high}
最低价: {quote.low}
开盘价: {quote.open}

技术指标:
{json.dumps(indicators, ensure_ascii=False, indent=2)}

请给出技术面评分、趋势判断和操作建议。
"""

        response = await self._call_llm(analysis_request)
        return self._parse_json_response(response)


class ResearcherAgent(BaseAgent):
    """研究员"""

    def __init__(self):
        super().__init__(AgentRole.RESEARCHER)

    def _load_prompt(self) -> str:
        """加载研究员提示词"""
        try:
            from .prompts.researcher import PROMPT
            return PROMPT
        except ImportError:
            return """你是一位专业的研究员，负责组织多方观点并进行多空辩论。"""

    async def analyze(self, context: dict) -> dict:
        """执行综合研究"""
        fundamental = context.get("fundamental_analysis", {})
        sentiment = context.get("sentiment_analysis", {})
        news = context.get("news_analysis", {})
        technical = context.get("technical_analysis", {})

        analysis_request = f"""
请基于以下四个分析师的报告进行多空辩论并形成综合结论：

基本面分析: {json.dumps(fundamental, ensure_ascii=False)}
情绪分析: {json.dumps(sentiment, ensure_ascii=False)}
新闻分析: {json.dumps(news, ensure_ascii=False)}
技术分析: {json.dumps(technical, ensure_ascii=False)}

请组织多轮辩论并给出综合结论。
"""

        response = await self._call_llm(analysis_request)
        return self._parse_json_response(response)


class TraderAgent(BaseAgent):
    """交易员"""

    def __init__(self):
        super().__init__(AgentRole.TRADER)

    def _load_prompt(self) -> str:
        """加载交易员提示词"""
        try:
            from .prompts.trader import PROMPT
            return PROMPT
        except ImportError:
            return """你是一位专业的交易员，负责根据研究员的报告做出交易决策。"""

    async def analyze(self, context: dict) -> dict:
        """执行交易决策"""
        research = context.get("research_analysis", {})
        quote: StockQuote = context.get("quote")

        analysis_request = f"""
请基于研究员的报告做出交易决策：

研究员结论: {json.dumps(research, ensure_ascii=False)}
当前价格: {quote.price}

请给出交易建议、仓位管理、目标价位和止损价位。
"""

        response = await self._call_llm(analysis_request)
        return self._parse_json_response(response)


class RiskManagerAgent(BaseAgent):
    """风险管理师"""

    def __init__(self):
        super().__init__(AgentRole.RISK_MANAGER)

    def _load_prompt(self) -> str:
        """加载风险管理师提示词"""
        try:
            from .prompts.risk_manager import PROMPT
            return PROMPT
        except ImportError:
            return """你是一位专业的风险管理师，负责评估交易风险。"""

    async def analyze(self, context: dict) -> dict:
        """执行风险评估"""
        trading = context.get("trading_decision", {})
        quote: StockQuote = context.get("quote")

        analysis_request = f"""
请评估以下交易决策的风险：

交易决策: {json.dumps(trading, ensure_ascii=False)}
当前价格: {quote.price}

请给出风险评级、风险评估和风控建议。
"""

        response = await self._call_llm(analysis_request)
        return self._parse_json_response(response)
