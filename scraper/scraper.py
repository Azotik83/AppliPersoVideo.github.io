#!/usr/bin/env python3
"""
Social Media Stats Scraper
Extracts video statistics from TikTok and Instagram.

Usage:
    python scraper.py --url "https://tiktok.com/@user/video/123"
    python scraper.py --file input_urls.txt
    python scraper.py --url "https://..." --visible
"""

import argparse
import asyncio
import json
import csv
import sys
from datetime import datetime
from pathlib import Path
from typing import List, Optional

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from utils.browser import create_stealth_browser, safe_close
from utils.rate_limiter import get_rate_limiter
from platforms.tiktok import TikTokScraper
from platforms.instagram import InstagramScraper


class SocialMediaScraper:
    """Main scraper class for multiple platforms."""
    
    def __init__(self, headless: bool = True):
        """
        Initialize the scraper.
        
        Args:
            headless: Whether to run browser in headless mode
        """
        self.headless = headless
        self.tiktok = TikTokScraper()
        self.instagram = InstagramScraper()
        self.rate_limiter = get_rate_limiter()
        self.results = []
    
    def detect_platform(self, url: str) -> Optional[str]:
        """Detect which platform a URL belongs to."""
        if self.tiktok.is_tiktok_url(url):
            return 'tiktok'
        elif self.instagram.is_instagram_url(url):
            return 'instagram'
        return None
    
    async def scrape_url(self, url: str) -> dict:
        """
        Scrape a single URL.
        
        Args:
            url: Video URL to scrape
            
        Returns:
            dict with platform, url, stats, and timestamp
        """
        platform = self.detect_platform(url)
        
        if not platform:
            return {
                'url': url,
                'platform': 'unknown',
                'error': 'Unsupported platform',
                'views': 0,
                'likes': 0,
                'comments': 0,
                'shares': 0,
            }
        
        playwright, browser, context = await create_stealth_browser(self.headless)
        
        try:
            page = await context.new_page()
            
            if platform == 'tiktok':
                stats = await self.tiktok.scrape(page, url)
            else:  # instagram
                stats = await self.instagram.scrape(page, url)
            
            return {
                'url': url,
                'platform': platform,
                'scraped_at': datetime.now().isoformat(),
                **stats
            }
            
        finally:
            await safe_close(playwright, browser)
    
    async def scrape_urls(self, urls: List[str]) -> List[dict]:
        """
        Scrape multiple URLs with rate limiting.
        
        Args:
            urls: List of video URLs
            
        Returns:
            List of result dicts
        """
        self.results = []
        
        print(f"\n🚀 Starting scrape of {len(urls)} URLs...")
        print(f"📊 Rate limit: {self.rate_limiter.max_requests} max requests\n")
        
        playwright, browser, context = await create_stealth_browser(self.headless)
        
        try:
            page = await context.new_page()
            
            for i, url in enumerate(urls):
                # Check rate limit
                if not self.rate_limiter.can_make_request():
                    print(f"\n⚠️ Rate limit reached ({self.rate_limiter.max_requests} requests)")
                    break
                
                print(f"\n[{i+1}/{len(urls)}] Processing: {url[:60]}...")
                
                # Apply rate limiting delay
                await self.rate_limiter.wait()
                
                # Detect platform and scrape
                platform = self.detect_platform(url)
                
                if not platform:
                    result = {
                        'url': url,
                        'platform': 'unknown',
                        'error': 'Unsupported platform',
                        'views': 0,
                        'likes': 0,
                        'comments': 0,
                        'shares': 0,
                    }
                elif platform == 'tiktok':
                    stats = await self.tiktok.scrape(page, url)
                    result = {'url': url, 'platform': platform, **stats}
                else:  # instagram
                    stats = await self.instagram.scrape(page, url)
                    result = {'url': url, 'platform': platform, **stats}
                
                result['scraped_at'] = datetime.now().isoformat()
                self.results.append(result)
                
                # Print result
                print(f"   👁️ Views: {result.get('views', 0):,}")
                print(f"   ❤️ Likes: {result.get('likes', 0):,}")
                print(f"   💬 Comments: {result.get('comments', 0):,}")
            
            return self.results
            
        finally:
            await safe_close(playwright, browser)
    
    def save_json(self, filepath: str = 'output.json'):
        """Save results to JSON file."""
        output = {
            'scraped_at': datetime.now().isoformat(),
            'total_urls': len(self.results),
            'results': self.results
        }
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(output, f, indent=2, ensure_ascii=False)
        
        print(f"\n💾 Results saved to: {filepath}")
    
    def save_csv(self, filepath: str = 'output.csv'):
        """Save results to CSV file."""
        if not self.results:
            return
        
        fieldnames = ['url', 'platform', 'views', 'likes', 'comments', 'shares', 'scraped_at', 'error']
        
        with open(filepath, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction='ignore')
            writer.writeheader()
            writer.writerows(self.results)
        
        print(f"💾 Results saved to: {filepath}")


def load_urls_from_file(filepath: str) -> List[str]:
    """Load URLs from a text file (one per line)."""
    urls = []
    with open(filepath, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#'):
                urls.append(line)
    return urls


async def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description='Scrape video statistics from TikTok and Instagram'
    )
    parser.add_argument(
        '--url', '-u',
        help='Single URL to scrape'
    )
    parser.add_argument(
        '--file', '-f',
        help='File containing URLs (one per line)'
    )
    parser.add_argument(
        '--output', '-o',
        default='output.json',
        help='Output file path (default: output.json)'
    )
    parser.add_argument(
        '--csv',
        action='store_true',
        help='Also export as CSV'
    )
    parser.add_argument(
        '--visible',
        action='store_true',
        help='Run browser in visible (non-headless) mode'
    )
    
    args = parser.parse_args()
    
    if not args.url and not args.file:
        parser.print_help()
        print("\n❌ Error: Please provide --url or --file")
        sys.exit(1)
    
    # Collect URLs
    urls = []
    if args.url:
        urls.append(args.url)
    if args.file:
        urls.extend(load_urls_from_file(args.file))
    
    if not urls:
        print("❌ No URLs to process")
        sys.exit(1)
    
    # Initialize scraper
    scraper = SocialMediaScraper(headless=not args.visible)
    
    # Run scraping
    await scraper.scrape_urls(urls)
    
    # Save results
    scraper.save_json(args.output)
    
    if args.csv:
        csv_path = args.output.replace('.json', '.csv')
        scraper.save_csv(csv_path)
    
    # Print summary
    total_views = sum(r.get('views', 0) for r in scraper.results)
    total_likes = sum(r.get('likes', 0) for r in scraper.results)
    total_comments = sum(r.get('comments', 0) for r in scraper.results)
    
    print(f"\n{'='*50}")
    print(f"📊 SUMMARY")
    print(f"{'='*50}")
    print(f"   Videos scraped: {len(scraper.results)}")
    print(f"   Total views:    {total_views:,}")
    print(f"   Total likes:    {total_likes:,}")
    print(f"   Total comments: {total_comments:,}")
    print(f"{'='*50}\n")


if __name__ == '__main__':
    asyncio.run(main())
