"""
Browser utilities for web scraping with Playwright.
Provides stealth configuration and human-like behavior.
"""

import random
import asyncio
from playwright.async_api import async_playwright, Browser, Page

# List of common User-Agents to rotate
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15",
]


def get_random_user_agent() -> str:
    """Return a random User-Agent string."""
    return random.choice(USER_AGENTS)


async def create_stealth_browser(headless: bool = True) -> tuple:
    """
    Create a Playwright browser instance with stealth settings.
    
    Returns:
        tuple: (playwright instance, browser instance, context)
    """
    playwright = await async_playwright().start()
    
    browser = await playwright.chromium.launch(
        headless=headless,
        args=[
            '--disable-blink-features=AutomationControlled',
            '--disable-dev-shm-usage',
            '--no-sandbox',
        ]
    )
    
    context = await browser.new_context(
        user_agent=get_random_user_agent(),
        viewport={'width': 1920, 'height': 1080},
        locale='en-US',
        timezone_id='America/New_York',
        # Prevent detection
        extra_http_headers={
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        }
    )
    
    # Add stealth scripts to avoid detection
    await context.add_init_script("""
        // Overwrite navigator.webdriver
        Object.defineProperty(navigator, 'webdriver', {
            get: () => undefined
        });
        
        // Overwrite chrome runtime
        window.chrome = {
            runtime: {}
        };
        
        // Overwrite permissions
        const originalQuery = window.navigator.permissions.query;
        window.navigator.permissions.query = (parameters) => (
            parameters.name === 'notifications' ?
                Promise.resolve({ state: Notification.permission }) :
                originalQuery(parameters)
        );
    """)
    
    return playwright, browser, context


async def human_delay(min_seconds: float = 2.0, max_seconds: float = 5.0):
    """
    Wait for a random duration to simulate human behavior.
    """
    delay = random.uniform(min_seconds, max_seconds)
    await asyncio.sleep(delay)


async def scroll_page(page: Page, scroll_count: int = 2):
    """
    Scroll the page to trigger lazy loading and appear more human.
    """
    for _ in range(scroll_count):
        await page.evaluate("window.scrollBy(0, window.innerHeight / 2)")
        await human_delay(0.5, 1.5)


async def safe_close(playwright, browser):
    """
    Safely close browser and playwright instances.
    """
    try:
        if browser:
            await browser.close()
        if playwright:
            await playwright.stop()
    except Exception:
        pass
