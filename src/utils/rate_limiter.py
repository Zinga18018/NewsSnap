"""
Rate Limiting Middleware
Provides per-IP and per-endpoint rate limiting for API protection.
"""

import time
from collections import defaultdict
from typing import Dict, Tuple

from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware


class RateLimiterMiddleware(BaseHTTPMiddleware):
    """
    Rate limiting middleware that tracks requests per IP address.

    Default: 100 requests per minute per IP
    """

    def __init__(self, app, requests_per_minute: int = 100):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.requests: Dict[str, list] = defaultdict(list)  # IP -> list of timestamps

    async def dispatch(self, request: Request, call_next):
        """Process request and apply rate limiting."""
        client_ip = request.client.host if request.client else "unknown"
        now = time.time()
        one_minute_ago = now - 60

        # Clean old requests
        self.requests[client_ip] = [
            ts for ts in self.requests[client_ip] if ts > one_minute_ago
        ]

        # Check limit
        if len(self.requests[client_ip]) >= self.requests_per_minute:
            raise HTTPException(
                status_code=429,
                detail=f"Rate limit exceeded: {self.requests_per_minute} requests per minute"
            )

        # Record this request
        self.requests[client_ip].append(now)

        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(self.requests_per_minute)
        response.headers["X-RateLimit-Remaining"] = str(
            max(0, self.requests_per_minute - len(self.requests[client_ip]))
        )
        return response


class EndpointRateLimiter:
    """Per-endpoint rate limiter with configurable limits."""

    def __init__(self):
        self.endpoint_limits: Dict[str, Tuple[int, int]] = {}  # endpoint -> (limit, window_seconds)
        self.endpoint_requests: Dict[str, Dict[str, list]] = defaultdict(lambda: defaultdict(list))

    def set_limit(self, endpoint: str, requests_per_window: int, window_seconds: int = 60):
        """Configure rate limit for specific endpoint."""
        self.endpoint_limits[endpoint] = (requests_per_window, window_seconds)

    async def check_limit(self, endpoint: str, client_ip: str) -> bool:
        """Check if client has exceeded endpoint limit."""
        if endpoint not in self.endpoint_limits:
            return True

        limit, window = self.endpoint_limits[endpoint]
        now = time.time()
        window_start = now - window

        # Clean old requests
        self.endpoint_requests[endpoint][client_ip] = [
            ts for ts in self.endpoint_requests[endpoint][client_ip]
            if ts > window_start
        ]

        # Check limit
        if len(self.endpoint_requests[endpoint][client_ip]) >= limit:
            return False

        # Record this request
        self.endpoint_requests[endpoint][client_ip].append(now)
        return True

    async def rate_limit_check(self, endpoint: str, client_ip: str):
        """Check and raise HTTPException if limit exceeded."""
        if not await self.check_limit(endpoint, client_ip):
            limit, window = self.endpoint_limits[endpoint]
            raise HTTPException(
                status_code=429,
                detail=f"Rate limit: {limit} requests per {window} seconds"
            )
