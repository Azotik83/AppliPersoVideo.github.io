#!/usr/bin/env python3
"""
Social Media Stats API
Flask API for the Video Manager app to fetch stats from TikTok/Instagram.

Usage:
    python api.py
    
Then the API will be available at http://localhost:5000
"""

import asyncio
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime

from utils.browser import create_stealth_browser, safe_close
from platforms.tiktok import TikTokScraper
from platforms.instagram import InstagramScraper

app = Flask(__name__)
CORS(app)  # Allow requests from React app

# Initialize scrapers
tiktok_scraper = TikTokScraper()
instagram_scraper = InstagramScraper()


def detect_platform(url: str) -> str:
    """Detect which platform a URL belongs to."""
    if tiktok_scraper.is_tiktok_url(url):
        return 'tiktok'
    elif instagram_scraper.is_instagram_url(url):
        return 'instagram'
    return 'unknown'


async def scrape_single_url(url: str, headless: bool = True) -> dict:
    """Scrape a single URL and return stats."""
    platform = detect_platform(url)
    
    if platform == 'unknown':
        return {
            'url': url,
            'platform': 'unknown',
            'error': 'Unsupported platform. Only TikTok and Instagram are supported.',
            'views': 0,
            'likes': 0,
            'comments': 0,
            'shares': 0,
        }
    
    playwright, browser, context = await create_stealth_browser(headless)
    
    try:
        page = await context.new_page()
        
        if platform == 'tiktok':
            stats = await tiktok_scraper.scrape(page, url)
        else:  # instagram
            stats = await instagram_scraper.scrape(page, url)
        
        return {
            'url': url,
            'platform': platform,
            'scraped_at': datetime.now().isoformat(),
            **stats
        }
        
    except Exception as e:
        return {
            'url': url,
            'platform': platform,
            'error': str(e),
            'views': 0,
            'likes': 0,
            'comments': 0,
            'shares': 0,
        }
    finally:
        await safe_close(playwright, browser)


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({'status': 'ok', 'message': 'Scraper API is running'})


@app.route('/scrape', methods=['POST'])
def scrape_url():
    """
    Scrape a single URL for stats.
    
    Request body:
        {
            "url": "https://tiktok.com/@user/video/123",
            "headless": true  // optional, default true
        }
    
    Response:
        {
            "success": true,
            "data": {
                "url": "...",
                "platform": "tiktok",
                "views": 12500,
                "likes": 890,
                "comments": 45,
                "shares": 12
            }
        }
    """
    data = request.get_json()
    
    if not data or 'url' not in data:
        return jsonify({
            'success': False,
            'error': 'Missing "url" in request body'
        }), 400
    
    url = data['url']
    headless = data.get('headless', True)
    
    # Run async scraping
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    
    try:
        result = loop.run_until_complete(scrape_single_url(url, headless))
        
        if 'error' in result and result['error']:
            return jsonify({
                'success': False,
                'error': result['error'],
                'data': result
            })
        
        return jsonify({
            'success': True,
            'data': result
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
    finally:
        loop.close()


@app.route('/scrape/batch', methods=['POST'])
def scrape_batch():
    """
    Scrape multiple URLs for stats.
    
    Request body:
        {
            "urls": ["https://...", "https://..."],
            "headless": true  // optional
        }
    
    Response:
        {
            "success": true,
            "data": [
                { "url": "...", "views": 123, ... },
                { "url": "...", "views": 456, ... }
            ],
            "summary": {
                "total_views": 579,
                "total_likes": 100,
                "total_comments": 50
            }
        }
    """
    data = request.get_json()
    
    if not data or 'urls' not in data:
        return jsonify({
            'success': False,
            'error': 'Missing "urls" in request body'
        }), 400
    
    urls = data['urls']
    headless = data.get('headless', True)
    
    if not urls or len(urls) == 0:
        return jsonify({
            'success': False,
            'error': 'Empty URL list'
        }), 400
    
    # Limit to 10 URLs per batch
    if len(urls) > 10:
        urls = urls[:10]
    
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    
    try:
        results = []
        for url in urls:
            if url and url.strip():
                result = loop.run_until_complete(scrape_single_url(url.strip(), headless))
                results.append(result)
        
        # Calculate summary
        summary = {
            'total_views': sum(r.get('views', 0) for r in results),
            'total_likes': sum(r.get('likes', 0) for r in results),
            'total_comments': sum(r.get('comments', 0) for r in results),
            'total_shares': sum(r.get('shares', 0) for r in results),
        }
        
        return jsonify({
            'success': True,
            'data': results,
            'summary': summary
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
    finally:
        loop.close()


if __name__ == '__main__':
    print("\n" + "="*50)
    print("🚀 Social Media Stats API")
    print("="*50)
    print("\nEndpoints:")
    print("  GET  /health       - Health check")
    print("  POST /scrape       - Scrape single URL")
    print("  POST /scrape/batch - Scrape multiple URLs")
    print("\nServer running at: http://localhost:5000")
    print("="*50 + "\n")
    
    app.run(host='0.0.0.0', port=5000, debug=True)
