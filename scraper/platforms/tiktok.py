"""
TikTok video stats scraper.
Extracts views, likes, comments and shares from public TikTok video pages.
"""

import re
import json
from typing import Optional
from playwright.async_api import Page, Response

from ..utils.browser import human_delay, scroll_page


class TikTokScraper:
    """Scraper for TikTok video statistics."""
    
    # XHR endpoints that contain video data
    API_PATTERNS = [
        r'/api/item/detail',
        r'/api/recommend/item_list',
        r'webapp/video/detail',
    ]
    
    # CSS selectors for fallback HTML parsing
    SELECTORS = {
        'views': '[data-e2e="video-views"]',
        'likes': '[data-e2e="like-count"], [data-e2e="browse-like-count"]',
        'comments': '[data-e2e="comment-count"], [data-e2e="browse-comment-count"]',
        'shares': '[data-e2e="share-count"]',
    }
    
    def __init__(self):
        self.intercepted_data = None
    
    def is_tiktok_url(self, url: str) -> bool:
        """Check if URL is a valid TikTok video URL."""
        patterns = [
            r'tiktok\.com/@[\w.-]+/video/\d+',
            r'vm\.tiktok\.com/\w+',
            r'tiktok\.com/t/\w+',
        ]
        return any(re.search(pattern, url) for pattern in patterns)
    
    async def _intercept_response(self, response: Response):
        """Intercept network responses to capture JSON data."""
        try:
            url = response.url
            if any(pattern in url for pattern in self.API_PATTERNS):
                if 'application/json' in response.headers.get('content-type', ''):
                    data = await response.json()
                    self.intercepted_data = data
        except Exception:
            pass
    
    def _parse_intercepted_data(self) -> Optional[dict]:
        """Parse stats from intercepted JSON response."""
        if not self.intercepted_data:
            return None
        
        try:
            # Navigate through TikTok's API response structure
            item_info = None
            
            if 'itemInfo' in self.intercepted_data:
                item_info = self.intercepted_data['itemInfo'].get('itemStruct', {})
            elif 'seoProps' in self.intercepted_data:
                item_info = self.intercepted_data.get('seoProps', {}).get('webVideoDetail', {})
            elif 'itemList' in self.intercepted_data:
                items = self.intercepted_data.get('itemList', [])
                if items:
                    item_info = items[0]
            
            if item_info:
                stats = item_info.get('stats', {})
                return {
                    'views': stats.get('playCount', 0),
                    'likes': stats.get('diggCount', 0),
                    'comments': stats.get('commentCount', 0),
                    'shares': stats.get('shareCount', 0),
                }
        except Exception as e:
            print(f"⚠️ Error parsing intercepted data: {e}")
        
        return None
    
    async def _parse_from_html(self, page: Page) -> dict:
        """Fallback: Parse stats from HTML using CSS selectors."""
        stats = {
            'views': 0,
            'likes': 0,
            'comments': 0,
            'shares': 0,
        }
        
        for stat_name, selector in self.SELECTORS.items():
            try:
                element = await page.query_selector(selector)
                if element:
                    text = await element.inner_text()
                    stats[stat_name] = self._parse_count(text)
            except Exception:
                pass
        
        return stats
    
    def _parse_count(self, text: str) -> int:
        """
        Parse count from text like '1.5M', '234K', '1,234'.
        """
        if not text:
            return 0
        
        text = text.strip().upper().replace(',', '').replace(' ', '')
        
        try:
            multiplier = 1
            if text.endswith('K'):
                multiplier = 1000
                text = text[:-1]
            elif text.endswith('M'):
                multiplier = 1000000
                text = text[:-1]
            elif text.endswith('B'):
                multiplier = 1000000000
                text = text[:-1]
            
            return int(float(text) * multiplier)
        except ValueError:
            return 0
    
    async def scrape(self, page: Page, url: str) -> dict:
        """
        Scrape TikTok video statistics.
        
        Args:
            page: Playwright page instance
            url: TikTok video URL
            
        Returns:
            dict with views, likes, comments, shares
        """
        self.intercepted_data = None
        
        # Set up response interception
        page.on('response', self._intercept_response)
        
        try:
            # Navigate to the page
            print(f"📱 Loading TikTok: {url[:50]}...")
            await page.goto(url, wait_until='networkidle', timeout=30000)
            
            # Wait for content and scroll
            await human_delay(2, 4)
            await scroll_page(page, 1)
            await human_delay(1, 2)
            
            # Try to get data from intercepted network requests first
            stats = self._parse_intercepted_data()
            
            if stats and stats.get('views', 0) > 0:
                print("✅ Data extracted from network response")
                return stats
            
            # Fallback to HTML parsing
            print("🔄 Falling back to HTML parsing...")
            stats = await self._parse_from_html(page)
            
            if stats.get('views', 0) > 0 or stats.get('likes', 0) > 0:
                print("✅ Data extracted from HTML")
            else:
                print("⚠️ Could not extract stats (page might be blocked)")
            
            return stats
            
        except Exception as e:
            print(f"❌ Error scraping TikTok: {e}")
            return {'views': 0, 'likes': 0, 'comments': 0, 'shares': 0, 'error': str(e)}
        
        finally:
            page.remove_listener('response', self._intercept_response)
