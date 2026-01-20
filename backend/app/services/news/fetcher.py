"""新闻采集服务"""
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import re

logger = logging.getLogger(__name__)


class NewsFetcher:
    """新闻获取器"""

    async def fetch_stock_news(
        self,
        stock_code: str,
        stock_name: str,
        days: int = 7,
        limit: int = 20,
    ) -> List[Dict[str, Any]]:
        """
        获取股票相关新闻

        Args:
            stock_code: 股票代码
            stock_name: 股票名称
            days: 获取最近几天的新闻
            limit: 返回数量限制

        Returns:
            新闻列表
        """
        try:
            # 使用 Akshare 获取新闻
            import akshare as ak

            news_list = []

            # 根据股票代码判断市场
            if stock_code.startswith('6'):
                # 上海证券交易所
                market = 'sh'
            elif stock_code.startswith(('0', '3')):
                # 深圳证券交易所
                market = 'sz'
            else:
                # 默认上海
                market = 'sh'

            # 获取个股新闻（使用东方财富）
            try:
                # 东财个股新闻
                df = ak.stock_news_em_stock(stock=f"{market}{stock_code}")

                if df is not None and not df.empty:
                    for _, row in df.head(limit).iterrows():
                        # 解析发布时间
                        publish_time = self._parse_publish_time(row.get('发布时间', ''))

                        # 只返回最近几天的新闻
                        if publish_time and publish_time >= datetime.now() - timedelta(days=days):
                            news_list.append({
                                'title': row.get('新闻标题', ''),
                                'content': row.get('新闻内容', '')[:500],  # 截取部分内容
                                'url': row.get('新闻链接', ''),
                                'source': '东方财富',
                                'publish_time': publish_time.strftime('%Y-%m-%d %H:%M:%S') if publish_time else '',
                                'sentiment': self._analyze_sentiment(row.get('新闻标题', '')),
                            })

            except Exception as e:
                logger.debug(f"获取东方财富新闻失败: {e}")

            # 如果东财没有数据，尝试同花顺
            if len(news_list) == 0:
                try:
                    df = ak.stock_news_jsu(stock=f"{market}{stock_code}")

                    if df is not None and not df.empty:
                        for _, row in df.head(limit).iterrows():
                            publish_time = self._parse_publish_time(row.get('datetime', ''))

                            if publish_time and publish_time >= datetime.now() - timedelta(days=days):
                                news_list.append({
                                    'title': row.get('title', ''),
                                    'content': row.get('content', '')[:500],
                                    'url': row.get('url', ''),
                                    'source': '同花顺',
                                    'publish_time': publish_time.strftime('%Y-%m-%d %H:%M:%S') if publish_time else '',
                                    'sentiment': self._analyze_sentiment(row.get('title', '')),
                                })

                except Exception as e:
                    logger.debug(f"获取同花顺新闻失败: {e}")

            # 按时间倒序排序
            news_list.sort(key=lambda x: x.get('publish_time', ''), reverse=True)

            return news_list[:limit]

        except Exception as e:
            logger.error(f"获取股票新闻失败: {e}")
            return []

    def _parse_publish_time(self, time_str: str) -> Optional[datetime]:
        """解析发布时间"""
        if not time_str:
            return None

        try:
            # 处理各种时间格式
            time_str = time_str.strip()

            # 格式: "2024-01-20 10:30:00"
            if '-' in time_str and ':' in time_str:
                return datetime.strptime(time_str, '%Y-%m-%d %H:%M:%S')

            # 格式: "2024-01-20"
            if '-' in time_str and ':' not in time_str:
                return datetime.strptime(time_str, '%Y-%m-%d')

            # 格式: "10分钟前"
            if '分钟前' in time_str:
                minutes = int(re.search(r'(\d+)', time_str).group(1))
                return datetime.now() - timedelta(minutes=minutes)

            # 格式: "2小时前"
            if '小时前' in time_str:
                hours = int(re.search(r'(\d+)', time_str).group(1))
                return datetime.now() - timedelta(hours=hours)

            # 格式: "今天"
            if time_str == '今天':
                return datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)

            # 格式: "昨天"
            if time_str == '昨天':
                return datetime.now() - timedelta(days=1)

        except Exception as e:
            logger.debug(f"解析时间失败: {time_str}, {e}")

        return None

    def _analyze_sentiment(self, text: str) -> str:
        """
        分析新闻情感倾向

        Args:
            text: 新闻标题或内容

        Returns:
            positive, negative, neutral
        """
        if not text:
            return 'neutral'

        text_lower = text.lower()

        # 积极关键词
        positive_keywords = [
            '上涨', '大涨', '涨停', '突破', '创新高', '利好', '增长', '盈利', '业绩',
            '收购', '回购', '增持', '分红', '派息', '扩张', '合作', '签署', '中标',
            '获批', '成功', '优异', '稳健', '向好', '回暖', '反弹', '拉升'
        ]

        # 消极关键词
        negative_keywords = [
            '下跌', '大跌', '跌停', '跌破', '创新低', '利空', '亏损', '下滑', '业绩',
            '减持', '质押', '违约', '调查', '处罚', '退市', '暂停', '风险', '危机',
            '亏损', '下滑', '暴跌', '跳水', '疲软', '回调', '震荡', '担忧', '压力'
        ]

        positive_count = sum(1 for keyword in positive_keywords if keyword in text_lower)
        negative_count = sum(1 for keyword in negative_keywords if keyword in text_lower)

        if positive_count > negative_count:
            return 'positive'
        elif negative_count > positive_count:
            return 'negative'
        else:
            return 'neutral'

    async def fetch_market_news(self, limit: int = 20) -> List[Dict[str, Any]]:
        """
        获取市场整体新闻

        Args:
            limit: 返回数量限制

        Returns:
            新闻列表
        """
        try:
            import akshare as ak

            news_list = []

            # 获取A股市场新闻
            try:
                df = ak.stock_news_em()

                if df is not None and not df.empty:
                    for _, row in df.head(limit).iterrows():
                        publish_time = self._parse_publish_time(row.get('发布时间', ''))

                        news_list.append({
                            'title': row.get('新闻标题', ''),
                            'content': row.get('新闻内容', '')[:500],
                            'url': row.get('新闻链接', ''),
                            'source': '东方财富',
                            'publish_time': publish_time.strftime('%Y-%m-%d %H:%M:%S') if publish_time else '',
                            'sentiment': self._analyze_sentiment(row.get('新闻标题', '')),
                        })

            except Exception as e:
                logger.debug(f"获取市场新闻失败: {e}")

            # 按时间倒序排序
            news_list.sort(key=lambda x: x.get('publish_time', ''), reverse=True)

            return news_list[:limit]

        except Exception as e:
            logger.error(f"获取市场新闻失败: {e}")
            return []


# 创建新闻获取器实例
def get_news_fetcher():
    """获取新闻获取器实例"""
    return NewsFetcher()
