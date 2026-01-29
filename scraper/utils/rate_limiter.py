"""
Rate limiter for ethical web scraping.
Implements delays and request limiting.
"""

import time
import asyncio
from functools import wraps


class RateLimiter:
    """
    Rate limiter to control request frequency.
    """
    
    def __init__(self, min_delay: float = 3.0, max_delay: float = 5.0, max_requests: int = 20):
        """
        Initialize rate limiter.
        
        Args:
            min_delay: Minimum delay between requests (seconds)
            max_delay: Maximum delay between requests (seconds)
            max_requests: Maximum number of requests per session
        """
        self.min_delay = min_delay
        self.max_delay = max_delay
        self.max_requests = max_requests
        self.request_count = 0
        self.last_request_time = 0
    
    def can_make_request(self) -> bool:
        """Check if we can make another request."""
        return self.request_count < self.max_requests
    
    async def wait(self):
        """
        Wait for appropriate delay before next request.
        Adds random jitter for more human-like behavior.
        """
        import random
        
        if self.last_request_time > 0:
            elapsed = time.time() - self.last_request_time
            delay = random.uniform(self.min_delay, self.max_delay)
            
            if elapsed < delay:
                wait_time = delay - elapsed
                print(f"⏳ Rate limit: waiting {wait_time:.1f}s...")
                await asyncio.sleep(wait_time)
        
        self.last_request_time = time.time()
        self.request_count += 1
    
    def get_remaining_requests(self) -> int:
        """Get number of remaining allowed requests."""
        return max(0, self.max_requests - self.request_count)
    
    def reset(self):
        """Reset the rate limiter."""
        self.request_count = 0
        self.last_request_time = 0


# Global rate limiter instance
_rate_limiter = None


def get_rate_limiter() -> RateLimiter:
    """Get or create global rate limiter."""
    global _rate_limiter
    if _rate_limiter is None:
        _rate_limiter = RateLimiter()
    return _rate_limiter
