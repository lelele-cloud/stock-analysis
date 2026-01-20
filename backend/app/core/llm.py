"""LLM 配置模块 - 支持动态配置"""
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain_google_genai import ChatGoogleGenerativeAI

from .llm_config import get_llm_config_manager

# 配置管理器
config_manager = get_llm_config_manager()


def get_llm():
    """获取当前配置的 LLM 实例"""
    provider_config = config_manager.get_current_config()
    model = config_manager.get_current_model()

    if not provider_config:
        raise ValueError("未配置任何 LLM 提供商，请先在设置中配置")

    if not provider_config.api_key:
        raise ValueError(f"提供商 {provider_config.name} 未配置 API Key")

    provider_id = provider_config.provider
    base_url = provider_config.base_url

    # OpenAI 兼容的提供商 (包括 OpenRouter)
    if provider_id in ["openai", "openrouter", "deepseek", "qwen"]:
        return ChatOpenAI(
            model=model,
            api_key=provider_config.api_key,
            base_url=base_url,
            temperature=0.7,
        )
    elif provider_id == "anthropic":
        return ChatAnthropic(
            model=model,
            api_key=provider_config.api_key,
            temperature=0.7,
        )
    elif provider_id == "google":
        return ChatGoogleGenerativeAI(
            model=model,
            api_key=provider_config.api_key,
            temperature=0.7,
        )
    else:
        raise ValueError(f"不支持的 LLM 提供商: {provider_id}")


def refresh_llm():
    """刷新 LLM 实例（配置更改后调用）"""
    # 由于每次调用 get_llm() 都会获取最新配置，这个函数主要用于兼容
    pass
