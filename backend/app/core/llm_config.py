"""LLM 配置管理模块"""
import json
import logging
from typing import Dict, List, Optional
from pydantic import BaseModel
from pydantic import Field

logger = logging.getLogger(__name__)


class LLMProviderConfig(BaseModel):
    """LLM 提供商配置"""

    provider: str = Field(..., description="提供商名称")
    name: str = Field(..., description="显示名称")
    models: List[str] = Field(..., description="支持的模型列表")
    api_key: str = Field(default="", description="API Key")
    base_url: Optional[str] = Field(None, description="自定义 API 地址")
    enabled: bool = Field(default=True, description="是否启用")


class LLMConfigManager:
    """LLM 配置管理器"""

    # 支持的提供商配置
    # 模型列表更新于 2026-01-20
    # 官方文档来源:
    # - OpenAI: https://platform.openai.com/docs/models
    # - Anthropic: https://docs.anthropic.com/en/docs/about-claude/models
    # - Google: https://ai.google.dev/gemini-api/docs/models
    # - DeepSeek: https://api-docs.deepseek.com/
    # - OpenRouter: https://openrouter.ai/models
    PROVIDERS = {
        "openai": {
            "name": "OpenAI",
            "models": [
                # GPT-4.1 系列 (2025年最新旗舰)
                "gpt-4.1",
                "gpt-4.1-mini",
                "gpt-4.1-vision",
                # O1 推理系列
                "o1",
                "o1-mini",
            ],
        },
        "anthropic": {
            "name": "Anthropic",
            "models": [
                # Claude 4.1 Sonnet (2025年5月发布)
                "claude-sonnet-4-1-20250514",
                # Claude 3.7 Sonnet
                "claude-3-7-sonnet-20250219",
                # Claude 3.5 Haiku
                "claude-3-5-haiku-20241022",
                # Claude 3.5 Sonnet
                "claude-3-5-sonnet-20241022",
                # Claude 3 Opus
                "claude-3-opus-20240229",
            ],
        },
        "google": {
            "name": "Google",
            "models": [
                # Gemini 2.5 实验系列 (2025年3月)
                "gemini-2.5-pro-exp-03-25",
                "gemini-2.5-flash-exp-03-25",
                # LearnLM 1.5
                "learnlm-1.5-pro-experimental",
                # Gemini 实验版
                "gemini-exp-1206",
            ],
        },
        "openrouter": {
            "name": "OpenRouter",
            "models": [
                # OpenAI 模型 (通过 OpenRouter)
                "openai/gpt-4.1",
                "openai/gpt-4.1-mini",
                "openai/o1",
                "openai/o1-mini",
                # Anthropic 模型 (通过 OpenRouter)
                "anthropic/claude-sonnet-4-1-20250514",
                "anthropic/claude-3-7-sonnet-20250219",
                "anthropic/claude-3-5-haiku-20241022",
                "anthropic/claude-3-5-sonnet-20241022",
                "anthropic/claude-3-opus-20240229",
                # Google 模型 (通过 OpenRouter)
                "google/gemini-2.5-pro-exp-03-25",
                "google/gemini-2.5-flash-exp-03-25",
                "google/learnlm-1.5-pro-experimental",
                # DeepSeek 模型 (通过 OpenRouter)
                "deepseek/deepseek-chat",
                "deepseek/deepseek-r1",
                # Meta Llama 模型
                "meta-llama/llama-3.1-405b-instruct",
                "meta-llama/llama-3.3-70b-instruct",
                "meta-llama/llama-3.1-8b-instruct",
                # Mistral AI 模型
                "mistralai/mistral-large-2407",
                "mistralai/mistral-7b-instruct",
                "mistralai/mixtral-8x7b-instruct",
                # 其他流行模型
                "x-ai/grok-beta",
                "perplexity/llama-3.1-sonar-small-128k-online",
                "perplexity/llama-3.1-sonar-huge-128k-online",
            ],
            "base_url": "https://openrouter.ai/api/v1",
        },
        "deepseek": {
            "name": "DeepSeek",
            "models": [
                # DeepSeek-V3 对话模型
                "deepseek-chat",
                # DeepSeek-R1 推理模型
                "deepseek-reasoner",
            ],
            "base_url": "https://api.deepseek.com",
        },
        "qwen": {
            "name": "通义千问",
            "models": [
                # Qwen Max (旗舰模型)
                "qwen-max",
                # Qwen Plus (均衡版)
                "qwen-plus",
                # Qwen Turbo (高速版)
                "qwen-turbo",
                # Qwen Long (长文本版)
                "qwen-long",
            ],
            "base_url": "https://dashscope.aliyuncs.com/compatible-mode/v1",
        },
    }

    def __init__(self):
        """初始化配置管理器"""
        self.configs: Dict[str, LLMProviderConfig] = {}
        self.selected_provider: Optional[str] = None
        self.selected_model: Optional[str] = None
        self._load_from_env()

    def _load_from_env(self):
        """从环境变量加载配置"""
        from .config import settings

        for provider_id, info in self.PROVIDERS.items():
            api_key = ""
            if provider_id == "openai":
                api_key = settings.OPENAI_API_KEY
            elif provider_id == "anthropic":
                api_key = settings.ANTHROPIC_API_KEY
            elif provider_id == "google":
                api_key = settings.GOOGLE_API_KEY
            elif provider_id == "openrouter":
                api_key = getattr(settings, "OPENROUTER_API_KEY", "")
            elif provider_id == "deepseek":
                api_key = settings.DEEPSEEK_API_KEY
            elif provider_id == "qwen":
                api_key = getattr(settings, "QWEN_API_KEY", "")

            self.configs[provider_id] = LLMProviderConfig(
                provider=provider_id,
                name=info["name"],
                models=info["models"],
                api_key=api_key,
                base_url=info.get("base_url"),
                enabled=bool(api_key),
            )

        # 设置默认选择
        if settings.LLM_PROVIDER in self.configs:
            self.selected_provider = settings.LLM_PROVIDER
            self.selected_model = settings.LLM_MODEL

    def get_providers(self) -> List[LLMProviderConfig]:
        """获取所有提供商"""
        return list(self.configs.values())

    def get_provider(self, provider_id: str) -> Optional[LLMProviderConfig]:
        """获取指定提供商"""
        return self.configs.get(provider_id)

    def update_provider(
        self,
        provider_id: str,
        api_key: Optional[str] = None,
        enabled: Optional[bool] = None,
        base_url: Optional[str] = None,
    ):
        """更新提供商配置"""
        if provider_id not in self.configs:
            raise ValueError(f"未知的提供商: {provider_id}")

        config = self.configs[provider_id]
        if api_key is not None:
            config.api_key = api_key
        if enabled is not None:
            config.enabled = enabled
        if base_url is not None:
            config.base_url = base_url

        logger.info(f"更新提供商配置: {provider_id}")

    def set_selected(self, provider_id: str, model: str):
        """设置当前选择的提供商和模型"""
        if provider_id not in self.configs:
            raise ValueError(f"未知的提供商: {provider_id}")

        provider = self.configs[provider_id]
        if model not in provider.models:
            raise ValueError(f"提供商 {provider_id} 不支持模型 {model}")

        self.selected_provider = provider_id
        self.selected_model = model
        logger.info(f"选择模型: {provider_id}/{model}")

    def get_current_config(self) -> Optional[LLMProviderConfig]:
        """获取当前选择的配置"""
        if not self.selected_provider:
            return None
        return self.configs.get(self.selected_provider)

    def get_current_model(self) -> Optional[str]:
        """获取当前选择的模型"""
        return self.selected_model

    def export_config(self) -> dict:
        """导出配置"""
        return {
            "providers": [config.model_dump() for config in self.configs.values()],
            "selected_provider": self.selected_provider,
            "selected_model": self.selected_model,
        }

    def import_config(self, config_data: dict):
        """导入配置"""
        for provider_config in config_data.get("providers", []):
            provider_id = provider_config["provider"]
            if provider_id in self.configs:
                self.configs[provider_id] = LLMProviderConfig(**provider_config)

        self.selected_provider = config_data.get("selected_provider")
        self.selected_model = config_data.get("selected_model")
        logger.info("导入配置成功")


# 全局单例
_llm_config_manager: Optional[LLMConfigManager] = None


def get_llm_config_manager() -> LLMConfigManager:
    """获取 LLM 配置管理器单例"""
    global _llm_config_manager
    if _llm_config_manager is None:
        _llm_config_manager = LLMConfigManager()
    return _llm_config_manager
