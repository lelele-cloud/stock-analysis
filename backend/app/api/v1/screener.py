"""选股器 API 路由"""
from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

from ...services.data import get_akshare_service
from ...services.screener import get_screener_engine

router = APIRouter(prefix="/screener", tags=["screener"])
akshare = get_akshare_service()
screener_engine = get_screener_engine(akshare)


class ScreenerCondition(BaseModel):
    """选股条件"""
    field: str = Field(..., description="字段名")
    operator: str = Field(..., description="操作符: <, <=, >, >=, ==, !=, between, contains, startswith")
    value: Any = Field(..., description="值")


class ScreenerRequest(BaseModel):
    """选股请求"""
    name: str = Field(..., description="选股策略名称")
    conditions: List[ScreenerCondition] = Field(..., description="筛选条件")
    sort_by: Optional[str] = Field(None, description="排序字段")
    sort_order: str = Field("desc", description="排序方向: asc, desc")
    limit: int = Field(100, description="返回数量限制", ge=1, le=500)


@router.post("/")
async def screen_stocks(request: ScreenerRequest):
    """执行选股"""
    try:
        # 转换条件格式
        conditions = [cond.model_dump() for cond in request.conditions]

        # 执行选股
        results = await screener_engine.screen(
            conditions=conditions,
            sort_by=request.sort_by,
            sort_order=request.sort_order,
            limit=request.limit,
        )

        return {
            "name": request.name,
            "count": len(results),
            "results": results,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"选股失败: {str(e)}")


@router.get("/templates")
async def get_screener_templates():
    """获取选股模板"""
    templates = screener_engine.get_template_strategies()
    return templates


@router.get("/fields")
async def get_available_fields():
    """获取可用的筛选字段"""
    fields = screener_engine.get_available_fields()
    return fields
