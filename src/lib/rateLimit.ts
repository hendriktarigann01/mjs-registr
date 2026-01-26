import { Ratelimit as UpstashRatelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Simple in-memory rate limiter for development
class InMemoryRateLimit {
  private requests: Map<string, number[]> = new Map();

  async limit(identifier: string, windowMs: number, maxRequests: number) {
    const now = Date.now();
    const requests = this.requests.get(identifier) || [];

    // Clean old requests outside window
    const validRequests = requests.filter((time) => now - time < windowMs);

    if (validRequests.length >= maxRequests) {
      return {
        success: false,
        limit: maxRequests,
        remaining: 0,
        reset: Math.max(...validRequests) + windowMs,
      };
    }

    validRequests.push(now);
    this.requests.set(identifier, validRequests);

    return {
      success: true,
      limit: maxRequests,
      remaining: maxRequests - validRequests.length,
      reset: now + windowMs,
    };
  }
}

// Check if in production and Upstash is configured
const isProduction = process.env.NODE_ENV === "production";
const hasUpstashConfig =
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN &&
  process.env.UPSTASH_REDIS_REST_URL.length > 0 &&
  process.env.UPSTASH_REDIS_REST_TOKEN.length > 0;

// Only use Upstash in production with valid config
let redis = null;
let Ratelimit = null;

if (isProduction && hasUpstashConfig) {
  try {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });

    Ratelimit = UpstashRatelimit;
    console.log("✅ Upstash Redis connected");
  } catch (error) {
    console.warn("⚠️  Failed to initialize Upstash:", error);
  }
}

// Create rate limiters
export const registrationRateLimit =
  redis && Ratelimit
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(3, "1 h"),
        analytics: true,
        prefix: "ratelimit:registration",
      })
    : {
        limit: async (id: string) => {
          const limiter = new InMemoryRateLimit();
          return limiter.limit(id, 3600000, 3); // 3 per hour
        },
      };

export const checkInRateLimit =
  redis && Ratelimit
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(100, "1 m"),
        analytics: true,
        prefix: "ratelimit:checkin",
      })
    : {
        limit: async (id: string) => {
          const limiter = new InMemoryRateLimit();
          return limiter.limit(id, 60000, 100); // 100 per minute
        },
      };

export const apiRateLimit =
  redis && Ratelimit
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(60, "1 m"),
        analytics: true,
        prefix: "ratelimit:api",
      })
    : {
        limit: async (id: string) => {
          const limiter = new InMemoryRateLimit();
          return limiter.limit(id, 60000, 60); // 60 per minute
        },
      };

// Log status
if (!hasUpstashConfig) {
  console.log("ℹ️  Using in-memory rate limiting (development mode)");
}
