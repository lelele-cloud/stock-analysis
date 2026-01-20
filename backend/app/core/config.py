"""核心配置模块"""
from functools import lru_cache
from typing import Literal
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """应用配置"""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # API 配置
    API_HOST: str = Field(default="0.0.0.0", description="API 主机")
    API_PORT: int = Field(default=8000, description="API 端口")
    FRONTEND_URL: str = Field(default="http://localhost:3000", description="前端 URL")

    # 数据库配置
    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/stock_analysis",
        description="数据库连接 URL",
    )

    # Redis 配置
    REDIS_URL: str = Field(
        default="redis://localhost:6379/0",
        description="Redis 连接 URL",
    )

    # LLM 配置
    LLM_PROVIDER: Literal["openai", "anthropic", "google", "openrouter", "deepseek", "qwen"] = Field(
        default="openrouter",
        description="LLM 提供商",
    )
    LLM_MODEL: str = Field(
        default="openai/gpt-4.1",
        description="LLM 模型名称",
    )
    OPENAI_API_KEY: str = Field(default="", description="OpenAI API Key")
    ANTHROPIC_API_KEY: str = Field(default="", description="Anthropic API Key")
    GOOGLE_API_KEY: str = Field(default="", description="Google API Key")
    OPENROUTER_API_KEY: str = Field(default="", description="OpenRouter API Key")
    DEEPSEEK_API_KEY: str = Field(default="", description="DeepSeek API Key")
    QWEN_API_KEY: str = Field(default="", description="通义千问 API Key")

    # Akshare 配置 (无需 API Key)
    AKSHARE_ENABLED: bool = Field(default=True, description="是否启用 Akshare")

    # 缓存配置
    CACHE_TTL: int = Field(default=3600, description="缓存过期时间(秒)")

    # 日志配置
    LOG_LEVEL: str = Field(default="INFO", description="日志级别")

    # JWT 配置 (如果需要用户系统)
    SECRET_KEY: str = Field(default="your-secret-key-change-in-production", description="JWT 密钥")
    ALGORITHM: str = Field(default="HS256", description="JWT 算法")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30, description="访问令牌过期时间(分钟)")


@lru_cache
def get_settings() -> Settings:
    """获取配置单例"""
    return Settings()


settings = get_settings()
