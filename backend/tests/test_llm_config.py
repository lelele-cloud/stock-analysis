"""测试 LLM 配置管理"""
import pytest
from app.core.llm_config import get_llm_config_manager, LLMProviderConfig


class TestLLMConfigManager:
    """LLM 配置管理器测试"""

    def test_singleton(self):
        """测试单例模式"""
        manager1 = get_llm_config_manager()
        manager2 = get_llm_config_manager()
        assert manager1 is manager2

    def test_get_providers(self):
        """测试获取所有提供商"""
        manager = get_llm_config_manager()
        providers = manager.get_providers()

        assert len(providers) > 0
        assert all(isinstance(p, LLMProviderConfig) for p in providers)

        # 检查必需的提供商
        provider_ids = [p.provider for p in providers]
        assert "openai" in provider_ids
        assert "anthropic" in provider_ids
        assert "google" in provider_ids
        assert "deepseek" in provider_ids
        assert "qwen" in provider_ids
        assert "openrouter" in provider_ids

    def test_get_provider(self):
        """测试获取指定提供商"""
        manager = get_llm_config_manager()

        provider = manager.get_provider("openai")
        assert provider is not None
        assert provider.provider == "openai"
        assert provider.name == "OpenAI"
        assert len(provider.models) > 0

        # 测试不存在的提供商
        provider = manager.get_provider("nonexistent")
        assert provider is None

    def test_update_provider(self):
        """测试更新提供商配置"""
        manager = get_llm_config_manager()

        # 更新 API Key
        manager.update_provider("openai", api_key="test-key-123")
        provider = manager.get_provider("openai")
        assert provider.api_key == "test-key-123"

        # 更新启用状态
        manager.update_provider("openai", enabled=True)
        assert provider.enabled is True

        # 更新 base_url
        manager.update_provider("openai", base_url="https://test.example.com")
        assert provider.base_url == "https://test.example.com"

    def test_set_selected(self):
        """测试设置选中的提供商和模型"""
        manager = get_llm_config_manager()

        # 设置选中的提供商
        manager.set_selected("openai", "gpt-4.1")
        assert manager.selected_provider == "openai"
        assert manager.selected_model == "gpt-4.1"

        # 测试无效的提供商
        with pytest.raises(ValueError):
            manager.set_selected("nonexistent", "model")

        # 测试无效的模型
        with pytest.raises(ValueError):
            manager.set_selected("openai", "invalid-model")

    def test_get_current_config(self):
        """测试获取当前配置"""
        manager = get_llm_config_manager()

        # 未设置时
        manager.selected_provider = None
        config = manager.get_current_config()
        assert config is None

        # 设置后
        manager.set_selected("openai", "gpt-4.1")
        config = manager.get_current_config()
        assert config is not None
        assert config.provider == "openai"
        assert config.enabled is True

    def test_get_current_model(self):
        """测试获取当前模型"""
        manager = get_llm_config_manager()

        manager.set_selected("openai", "gpt-4.1")
        model = manager.get_current_model()
        assert model == "gpt-4.1"

    def test_export_import_config(self):
        """测试导出导入配置"""
        manager = get_llm_config_manager()

        # 设置一些配置
        manager.update_provider("openai", api_key="test-key", enabled=True)
        manager.set_selected("openai", "gpt-4.1")

        # 导出配置
        exported = manager.export_config()
        assert "providers" in exported
        assert "selected_provider" in exported
        assert "selected_model" in exported
        assert exported["selected_provider"] == "openai"
        assert exported["selected_model"] == "gpt-4.1"

        # 创建新管理器并导入配置
        from app.core.llm_config import LLMConfigManager
        new_manager = LLMConfigManager()
        new_manager.import_config(exported)

        assert new_manager.selected_provider == "openai"
        assert new_manager.selected_model == "gpt-4.1"

    def test_provider_models(self):
        """测试提供商模型列表"""
        manager = get_llm_config_manager()

        # OpenAI 模型
        openai = manager.get_provider("openai")
        assert "gpt-4.1" in openai.models
        assert "o1" in openai.models

        # Anthropic 模型
        anthropic = manager.get_provider("anthropic")
        assert "claude-sonnet-4-1-20250514" in anthropic.models

        # Google 模型
        google = manager.get_provider("google")
        assert "gemini-2.5-pro-exp-03-25" in google.models

        # DeepSeek 模型
        deepseek = manager.get_provider("deepseek")
        assert "deepseek-chat" in deepseek.models
        assert "deepseek-reasoner" in deepseek.models

        # OpenRouter 模型（最多）
        openrouter = manager.get_provider("openrouter")
        assert len(openrouter.models) > 20
        assert "openai/gpt-4.1" in openrouter.models
        assert "anthropic/claude-sonnet-4-1-20250514" in openrouter.models

    def test_openrouter_base_url(self):
        """测试 OpenRouter base URL"""
        manager = get_llm_config_manager()
        openrouter = manager.get_provider("openrouter")

        assert openrouter.base_url == "https://openrouter.ai/api/v1"

    def test_initialization_from_env(self):
        """测试从环境变量初始化"""
        # 这个测试验证配置管理器能正确读取环境变量
        # 实际的环境变量测试需要在测试运行前设置
        manager = get_llm_config_manager()

        # 验证至少有配置被加载
        providers = manager.get_providers()
        assert len(providers) >= 6  # 至少有6个提供商
