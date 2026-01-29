"""
Instagram video/reel stats scraper.
Extracts views, likes, comments from public Instagram video pages.
"""

import re
import json
from typing import Optional
from playwright.async_api import Page, Response

from ..utils.browser import human_delay, scroll_page


class InstagramScraper:
    """Scraper for Instagram video/reel statistics."""
    
    # XHR endpoints that contain video data
    API_PATTERNS = [
        r'/api/v1/media/',
        r'/graphql/query',
        r'i.instagram.com/api',
    ]
    
    # CSS selectors for HTML parsing
    SELECTORS = {
        'likes': 'section span[class*="html-span"]',
        'views': 'span[class*="html-span"]',
        'comments': 'ul li span[class*="html-span"]',
    }
    
    def __init__(self):
        self.intercepted_data = None
    
    def is_instagram_url(self, url: str) -> bool:
        """Check if URL is a valid Instagram video/reel URL."""
        patterns = [
            r'instagram\.com/p/[\w-]+',
            r'instagram\.com/reel/[\w-]+',
            r'instagram\.com/reels/[\w-]+',
            r'instagram\.com/tv/[\w-]+',
        ]
        return any(re.search(pattern, url) for pattern in patterns)
    
    async def _intercept_response(self, response: Response):
        """Intercept network responses to capture JSON data."""
        try:
            url = response.url
            if any(pattern in url for pattern in self.API_PATTERNS):
                content_type = response.headers.get('content-type', '')
                if 'application/json' in content_type or 'text/javascript' in content_type:
                    data = await response.json()
                    if self._contains_media_data(data):
                        self.intercepted_data = data
        except Exception:
            pass
    
    def _contains_media_data(self, data: dict) -> bool:
        """Check if response contains media statistics."""
        if not isinstance(data, dict):
            return False
        
        # Check common Instagram response structures
        keys_to_check = ['edge_media_preview_like', 'edge_media_to_comment', 
                         'like_count', 'comment_count', 'play_count']
        
        data_str = str(data)
        return any(key in data_str for key in keys_to_check)
    
    def _parse_intercepted_data(self) -> Optional[dict]:
        """Parse stats from intercepted JSON response."""
        if not self.intercepted_data:
            return None
        
        try:
            data = self.intercepted_data
            
            # Try different Instagram API response structures
            media = None
            
            # GraphQL response
            if 'data' in data:
                shortcode_media = data.get('data', {}).get('shortcode_media', {})
                if shortcode_media:
                    media = shortcode_media
                
                xdt_shortcode_media = data.get('data', {}).get('xdt_shortcode_media', {})
                if xdt_shortcode_media:
                    media = xdt_shortcode_media
            
            # Direct media response
            if 'items' in data:
                items = data.get('items', [])
                if items:
                    media = items[0]
            
            if media:
                # GraphQL structure
                likes = media.get('edge_media_preview_like', {}).get('count', 0)
                comments = media.get('edge_media_to_comment', {}).get('count', 0)
                views = media.get('video_view_count', 0) or media.get('play_count', 0)
                
                # Alternative structure
                if not likes:
                    likes = media.get('like_count', 0)
                if not comments:
                    comments = media.get('comment_count', 0)
                if not views:
                    views = media.get('view_count', 0)
                
                return {
                    'views': views,
                    'likes': likes,
                    'comments': comments,
                    'shares': 0,  # Instagram doesn't expose share count publicly
                }
                
        except Exception as e:
            print(f"⚠️ Error parsing intercepted data: {e}")
        
        return None
    
    async def _parse_from_html(self, page: Page) -> dict:
        """Fallback: Parse stats from HTML/meta tags."""
        stats = {
            'views': 0,
            'likes': 0,
            'comments': 0,
            'shares': 0,
        }
        
        try:
            # Try to extract from meta tags
            meta_content = await page.query_selector('meta[property="og:description"]')
            if meta_content:
                content = await meta_content.get_attribute('content')
                if content:
                    # Parse "X likes, Y comments" from description
                    likes_match = re.search(r'([\d,KMB.]+)\s*likes?', content, re.I)
                    comments_match = re.search(r'([\d,KMB.]+)\s*comments?', content, re.I)
                    views_match = re.search(r'([\d,KMB.]+)\s*views?', content, re.I)
                    
                    if likes_match:
                        stats['likes'] = self._parse_count(likes_match.group(1))
                    if comments_match:
                        stats['comments'] = self._parse_count(comments_match.group(1))
                    if views_match:
                        stats['views'] = self._parse_count(views_match.group(1))
            
            # Try script tag with JSON data
            scripts = await page.query_selector_all('script[type="application/ld+json"]')
            for script in scripts:
                try:
                    content = await script.inner_text()
                    data = json.loads(content)
                    if 'interactionStatistic' in data:
                        for stat in data.get('interactionStatistic', []):
                            stat_type = stat.get('interactionType', '')
                            count = stat.get('userInteractionCount', 0)
                            if 'Like' in stat_type:
                                stats['likes'] = count
                            elif 'Comment' in stat_type:
                                stats['comments'] = count
                            elif 'Watch' in stat_type:
                                stats['views'] = count
                except Exception:
                    pass
                    
        except Exception as e:
            print(f"⚠️ Error parsing HTML: {e}")
        
        return stats
    
    def _parse_count(self, text: str) -> int:
        """Parse count from text like '1.5M', '234K', '1,234'."""
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
        Scrape Instagram video statistics.
        
        Args:
            page: Playwright page instance
            url: Instagram video/reel URL
            
        Returns:
            dict with views, likes, comments
        """
        self.intercepted_data = None
        
        # Set up response interception
        page.on('response', self._intercept_response)
        
        try:
            # Navigate to the page
            print(f"📷 Loading Instagram: {url[:50]}...")
            await page.goto(url, wait_until='networkidle', timeout=30000)
            
            # Wait for content
            await human_delay(3, 5)
            await scroll_page(page, 1)
            await human_delay(1, 2)
            
            # Try to get data from intercepted network requests first
            stats = self._parse_intercepted_data()
            
            if stats and (stats.get('views', 0) > 0 or stats.get('likes', 0) > 0):
                print("✅ Data extracted from network response")
                return stats
            
            # Fallback to HTML parsing
            print("🔄 Falling back to HTML parsing...")
            stats = await self._parse_from_html(page)
            
            if stats.get('views', 0) > 0 or stats.get('likes', 0) > 0:
                print("✅ Data extracted from HTML/meta")
            else:
                print("⚠️ Could not extract stats (login wall or blocked)")
            
            return stats
            
        except Exception as e:
            print(f"❌ Error scraping Instagram: {e}")
            return {'views': 0, 'likes': 0, 'comments': 0, 'shares': 0, 'error': str(e)}
        
        finally:
            page.remove_listener('response', self._intercept_response)
