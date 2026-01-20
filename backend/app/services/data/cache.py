"""缓存服务"""
import json
import logging
from typing import Optional, Any

import redis.asyncio as redis

from ...core.config import settings

logger = logging.getLogger(__name__)


class CacheService:
    """Redis 缓存服务"""

    def __init__(self):
        """初始化服务"""
        self.redis: Optional[redis.Redis] = None
        self.default_ttl = settings.CACHE_TTL

    async def connect(self):
        """连接 Redis"""
        try:
            self.redis = await redis.from_url(
                settings.REDIS_URL,
                encoding="utf-8",
                decode_responses=True,
            )
            await self.redis.ping()
            logger.info("Redis 连接成功")
        except Exception as e:
            logger.warning(f"Redis 连接失败: {e}，缓存功能将不可用")

    async def disconnect(self):
        """断开 Redis 连接"""
        if self.redis:
            await self.redis.close()
            logger.info("Redis 连接已关闭")

    async def get(self, key: str) -> Optional[Any]:
        """获取缓存"""
        if not self.redis:
            return None

        try:
            value = await self.redis.get(key)
            if value:
                return json.loads(value)
            return None
        except Exception as e:
            logger.error(f"获取缓存失败: {e}")
            return None

    async def set(
        self,
        key: str,
        value: Any,
        ttl: Optional[int] = None,
    ) -> bool:
        """设置缓存"""
        if not self.redis:
            return False

        try:
            ttl = ttl or self.default_ttl
            await self.redis.setex(
                key,
                ttl,
                json.dumps(value, ensure_ascii=False),
            )
            return True
        except Exception as e:
            logger.error(f"设置缓存失败: {e}")
            return False

    async def delete(self, key: str) -> bool:
        """删除缓存"""
        if not self.redis:
            return False

        try:
            await self.redis.delete(key)
            return True
        except Exception as e:
            logger.error(f"删除缓存失败: {e}")
            return False

    async def exists(self, key: str) -> bool:
        """检查缓存是否存在"""
        if not self.redis:
            return False

        try:
            return await self.redis.exists(key) > 0
        except Exception as e:
            logger.error(f"检查缓存失败: {e}")
            return False


# 全局单例
_cache_service: Optional[CacheService] = None


def get_cache_service() -> CacheService:
    """获取缓存服务单例"""
    global _cache_service
    if _cache_service is None:
        _cache_service = CacheService()
    return _cache_service
