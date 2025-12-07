import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Validate Upstash credentials
const upstashUrl = process.env.KV_REST_API_URL;
const upstashToken = process.env.KV_REST_API_TOKEN;

if (!upstashUrl || !upstashToken) {
  console.warn("⚠️ Upstash Redis credentials not configured. Rate limiting will be disabled.");
}

// Initialize Redis client only if credentials are available
const redis = upstashUrl && upstashToken
  ? new Redis({
    url: upstashUrl,
    token: upstashToken,
  })
  : null;

// API route rate limiter: 10 requests per 10 seconds
export const apiRateLimiter = redis
  ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "10 s"),
    analytics: true,
    prefix: "@ratelimit/api",
  })
  : null;

// Sensitive action rate limiter: 5 requests per minute
export const actionRateLimiter = redis
  ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "60 s"),
    analytics: true,
    prefix: "@ratelimit/action",
  })
  : null;

// Helper to get client IP from request
export function getClientIp(request: Request): string {
  // Try to get IP from various headers (Vercel, Cloudflare, etc.)
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  if (realIp) {
    return realIp;
  }

  // Fallback to a default identifier
  return "unknown";
}
