"""AI 智能体分析 API 路由"""
import uuid
import json
from datetime import datetime
from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from typing import Dict, Set

from ...models.analysis import (
    AnalysisRequest,
    AnalysisTask,
    AnalysisReport,
    AnalysisStatus,
)
from ...services.data import get_akshare_service
from ...services.agents import (
    FundamentalAgent,
    SentimentAgent,
    NewsAgent,
    TechnicalAgent,
    ResearcherAgent,
    TraderAgent,
    RiskManagerAgent,
)

router = APIRouter(prefix="/analysis", tags=["analysis"])
akshare = get_akshare_service()

# 存储任务状态
tasks: Dict[str, AnalysisTask] = {}
# WebSocket 连接管理
active_connections: Dict[str, Set[WebSocket]] = {}


async def send_websocket_update(task_id: str, message: dict):
    """发送 WebSocket 更新"""
    if task_id in active_connections:
        disconnected = set()
        for ws in active_connections[task_id]:
            try:
                await ws.send_json(message)
            except Exception:
                disconnected.add(ws)

        # 移除断开的连接
        if disconnected:
            active_connections[task_id] -= disconnected


@router.post("/create")
async def create_analysis_task(request: AnalysisRequest):
    """创建分析任务"""
    task_id = str(uuid.uuid4())

    # 获取股票信息
    stock_info = await akshare.get_stock_info(request.stock_code)
    if not stock_info:
        raise HTTPException(status_code=404, detail=f"股票 {request.stock_code} 未找到")

    # 创建任务
    task = AnalysisTask(
        task_id=task_id,
        stock_code=request.stock_code,
        stock_name=stock_info.get("name", ""),
        status=AnalysisStatus.PENDING,
        progress=0.0,
    )
    tasks[task_id] = task

    # 启动异步分析
    import asyncio

    asyncio.create_task(run_analysis(task, request))

    return task


@router.get("/{task_id}")
async def get_analysis_result(task_id: str):
    """获取分析结果"""
    if task_id not in tasks:
        raise HTTPException(status_code=404, detail="任务未找到")

    task = tasks[task_id]

    if task.status == AnalysisStatus.COMPLETED:
        # 返回完整报告
        report = getattr(task, "report", None)
        if report:
            return report

    return task


@router.get("/{task_id}/status")
async def get_task_status(task_id: str):
    """获取任务状态"""
    if task_id not in tasks:
        raise HTTPException(status_code=404, detail="任务未找到")

    return tasks[task_id]


@router.websocket("/ws/{task_id}")
async def websocket_analysis(websocket: WebSocket, task_id: str):
    """WebSocket 实时分析进度"""
    await websocket.accept()

    if task_id not in active_connections:
        active_connections[task_id] = set()

    active_connections[task_id].add(websocket)

    try:
        # 发送当前状态
        if task_id in tasks:
            await websocket.send_json(tasks[task_id].model_dump())

        # 保持连接
        while True:
            await websocket.receive_text()

    except WebSocketDisconnect:
        active_connections[task_id].discard(websocket)


async def run_analysis(task: AnalysisTask, request: AnalysisRequest):
    """运行分析流程"""
    try:
        # 更新状态: 数据采集中
        task.status = AnalysisStatus.COLLECTING
        task.progress = 10.0
        task.updated_at = datetime.now()
        await send_websocket_update(task.task_id, {"type": "status", "data": task.model_dump()})

        # 采集数据
        quote = await akshare.get_spot_quote(request.stock_code)
        stock_info = await akshare.get_stock_info(request.stock_code)
        fundamental_data = await akshare.get_financial_data(request.stock_code)
        kline_data = await akshare.get_kline_data(request.stock_code)

        # 获取新闻
        from ...services.news import get_news_fetcher
        news_fetcher = get_news_fetcher()
        stock_name = stock_info.get('name', '') if stock_info else ''
        news_list = await news_fetcher.fetch_stock_news(
            stock_code=request.stock_code,
            stock_name=stock_name,
            days=7,
            limit=20
        )

        # 计算技术指标
        close = [k["close"] for k in kline_data] if kline_data else []
        high = [k["high"] for k in kline_data] if kline_data else []
        low = [k["low"] for k in kline_data] if kline_data else []

        from ...services.indicators import technical_calculator

        indicators = {}
        if close:
            macd = technical_calculator.macd(close)
            rsi = technical_calculator.rsi(close)
            kdj = technical_calculator.kdj(high, low, close)
            indicators = {"macd": macd, "rsi": rsi, "kdj": kdj}

        task.progress = 30.0
        await send_websocket_update(task.task_id, {"type": "progress", "progress": 30.0})

        # 并行分析阶段
        task.status = AnalysisStatus.ANALYZING
        task.progress = 40.0
        await send_websocket_update(task.task_id, {"type": "status", "data": task.model_dump()})

        context = {
            "stock_info": stock_info,
            "quote": quote,
            "fundamental_data": fundamental_data,
            "indicators": indicators,
            "news": news_list,
        }

        # 并行执行 4 个分析师
        fundamental_agent = FundamentalAgent()
        sentiment_agent = SentimentAgent()
        news_agent = NewsAgent()
        technical_agent = TechnicalAgent()

        fundamental_result = await fundamental_agent.analyze(context)
        await send_websocket_update(
            task.task_id,
            {
                "type": "agent_message",
                "agent": "fundamental",
                "content": fundamental_result.get("analysis", ""),
            },
        )

        sentiment_result = await sentiment_agent.analyze(context)
        await send_websocket_update(
            task.task_id,
            {
                "type": "agent_message",
                "agent": "sentiment",
                "content": sentiment_result.get("analysis", ""),
            },
        )

        news_result = await news_agent.analyze(context)
        await send_websocket_update(
            task.task_id,
            {
                "type": "agent_message",
                "agent": "news",
                "content": news_result.get("summary", ""),
            },
        )

        technical_result = await technical_agent.analyze(context)
        await send_websocket_update(
            task.task_id,
            {
                "type": "agent_message",
                "agent": "technical",
                "content": technical_result.get("analysis", ""),
            },
        )

        task.progress = 70.0

        # 协作辩论阶段
        task.status = AnalysisStatus.DEBATING
        task.progress = 75.0
        await send_websocket_update(task.task_id, {"type": "status", "data": task.model_dump()})

        researcher_agent = ResearcherAgent()
        research_context = {
            "fundamental_analysis": fundamental_result,
            "sentiment_analysis": sentiment_result,
            "news_analysis": news_result,
            "technical_analysis": technical_result,
        }
        research_result = await researcher_agent.analyze(research_context)
        await send_websocket_update(
            task.task_id,
            {"type": "agent_message", "agent": "researcher", "content": str(research_result)},
        )

        task.progress = 85.0

        # 决策与风控阶段
        task.status = AnalysisStatus.DECIDING
        await send_websocket_update(task.task_id, {"type": "status", "data": task.model_dump()})

        trading_context = {"research_analysis": research_result, "quote": quote}
        trader_agent = TraderAgent()
        trading_result = await trader_agent.analyze(trading_context)
        await send_websocket_update(
            task.task_id,
            {"type": "agent_message", "agent": "trader", "content": str(trading_result)},
        )

        risk_manager_agent = RiskManagerAgent()
        risk_context = {"trading_decision": trading_result, "quote": quote}
        risk_result = await risk_manager_agent.analyze(risk_context)
        await send_websocket_update(
            task.task_id,
            {"type": "agent_message", "agent": "risk_manager", "content": str(risk_result)},
        )

        # 生成报告
        task.progress = 95.0

        report = AnalysisReport(
            task_id=task.task_id,
            stock_code=task.stock_code,
            stock_name=task.stock_name,
            fundamental_analysis=str(fundamental_result),
            sentiment_analysis=str(sentiment_result),
            news_analysis=str(news_result),
            technical_analysis=str(technical_result),
            research_summary=str(research_result),
            trading_decision=str(trading_result),
            risk_assessment=str(risk_result),
            fundamental_score=fundamental_result.get("score"),
            sentiment_score=sentiment_result.get("score"),
            technical_score=technical_result.get("score"),
            recommendation=trading_result.get("action"),
            target_price=trading_result.get("target_price"),
            stop_loss=trading_result.get("stop_loss"),
        )

        task.status = AnalysisStatus.COMPLETED
        task.progress = 100.0
        task.report = report
        task.updated_at = datetime.now()

        await send_websocket_update(
            task.task_id,
            {"type": "completed", "data": report.model_dump()},
        )

    except Exception as e:
        task.status = AnalysisStatus.FAILED
        task.updated_at = datetime.now()
        await send_websocket_update(
            task.task_id,
            {"type": "error", "message": str(e)},
        )
