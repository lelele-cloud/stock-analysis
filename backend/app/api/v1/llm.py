"""LLM 配置 API 路由"""
from fastapi import APIRouter, HTTPException
from typing import List

from ...core.llm_config import get_llm_config_manager, LLMProviderConfig

router = APIRouter(prefix="/llm", tags=["llm"])
config_manager = get_llm_config_manager()


@router.get("/providers")
async def get_providers():
    """获取所有 LLM 提供商配置"""
    providers = config_manager.get_providers()
    return {
        "providers": [p.model_dump() for p in providers],
        "selected_provider": config_manager.selected_provider,
        "selected_model": config_manager.selected_model,
    }


@router.get("/providers/{provider_id}")
async def get_provider(provider_id: str):
    """获取指定提供商配置"""
    provider = config_manager.get_provider(provider_id)
    if not provider:
        raise HTTPException(status_code=404, detail=f"提供商 {provider_id} 未找到")
    return provider.model_dump()


@router.put("/providers/{provider_id}")
async def update_provider(
    provider_id: str,
    api_key: str | None = None,
    enabled: bool | None = None,
    base_url: str | None = None,
):
    """更新提供商配置"""
    try:
        config_manager.update_provider(
            provider_id=provider_id,
            api_key=api_key,
            enabled=enabled,
            base_url=base_url,
        )
        return {"success": True, "message": "配置已更新"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/select")
async def select_model(provider_id: str, model: str):
    """选择当前使用的提供商和模型"""
    try:
        config_manager.set_selected(provider_id, model)
        provider = config_manager.get_provider(provider_id)
        return {
            "success": True,
            "provider": provider.model_dump(),
            "model": model,
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/current")
async def get_current_config():
    """获取当前选择的配置"""
    provider = config_manager.get_current_config()
    model = config_manager.get_current_model()

    if not provider:
        return {"provider": None, "model": None}

    return {
        "provider": provider.model_dump(),
        "model": model,
    }


@router.post("/test")
async def test_llm_connection(provider_id: str, model: str | None = None):
    """测试 LLM 连接"""
    from ...core.llm import get_llm

    try:
        # 临时切换到测试提供商
        original_provider = config_manager.selected_provider
        original_model = config_manager.selected_model

        test_model = model or config_manager.get_provider(provider_id).models[0]
        config_manager.set_selected(provider_id, test_model)

        # 尝试调用 LLM
        llm = get_llm()
        from langchain_core.messages import HumanMessage

        response = await llm.ainvoke([HumanMessage(content="Hello")])

        # 恢复原始配置
        if original_provider:
            config_manager.set_selected(original_provider, original_model)

        return {
            "success": True,
            "message": "连接成功",
            "response": response.content[:100],  # 返回部分响应
        }
    except Exception as e:
        # 恢复原始配置
        if original_provider:
            config_manager.set_selected(original_provider, original_model)
        raise HTTPException(status_code=400, detail=f"连接失败: {str(e)}")
