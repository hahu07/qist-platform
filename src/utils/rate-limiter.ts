/**
 * Rate Limiting Utility
 * Prevents abuse by limiting the frequency of operations
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  private readonly cleanupInterval: number = 60000; // 1 minute

  constructor() {
    // Periodically clean up expired entries
    if (typeof window !== "undefined") {
      setInterval(() => this.cleanup(), this.cleanupInterval);
    }
  }

  /**
   * Check if an operation is allowed for a given key
   * @param key - Unique identifier (e.g., userId, IP address)
   * @param maxAttempts - Maximum number of attempts allowed
   * @param windowMs - Time window in milliseconds
   * @returns true if allowed, false if rate limited
   */
  checkLimit(key: string, maxAttempts: number, windowMs: number): boolean {
    const now = Date.now();
    const entry = this.limits.get(key);

    if (!entry || now >= entry.resetTime) {
      // No existing entry or window expired - allow and create new entry
      this.limits.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      return true;
    }

    if (entry.count >= maxAttempts) {
      // Rate limit exceeded
      return false;
    }

    // Increment counter and allow
    entry.count++;
    return true;
  }

  /**
   * Get remaining attempts for a key
   */
  getRemainingAttempts(key: string, maxAttempts: number): number {
    const entry = this.limits.get(key);
    if (!entry || Date.now() >= entry.resetTime) {
      return maxAttempts;
    }
    return Math.max(0, maxAttempts - entry.count);
  }

  /**
   * Get time until reset (in seconds)
   */
  getTimeUntilReset(key: string): number {
    const entry = this.limits.get(key);
    if (!entry) return 0;
    
    const remaining = entry.resetTime - Date.now();
    return Math.max(0, Math.ceil(remaining / 1000));
  }

  /**
   * Reset the limit for a key
   */
  reset(key: string): void {
    this.limits.delete(key);
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.limits.entries()) {
      if (now >= entry.resetTime) {
        this.limits.delete(key);
      }
    }
  }
}

// Singleton instance
const rateLimiter = new RateLimiter();

/**
 * File Upload Rate Limiter
 * Prevents excessive file uploads from a single user
 */
export const fileUploadLimiter = {
  /**
   * Check if user can upload a file
   * @param userId - User identifier
   * @param maxUploads - Maximum uploads allowed (default: 10)
   * @param windowMinutes - Time window in minutes (default: 10)
   */
  canUpload(userId: string, maxUploads = 10, windowMinutes = 10): boolean {
    const key = `upload:${userId}`;
    const windowMs = windowMinutes * 60 * 1000;
    return rateLimiter.checkLimit(key, maxUploads, windowMs);
  },

  /**
   * Get remaining uploads for user
   */
  getRemainingUploads(userId: string, maxUploads = 10): number {
    const key = `upload:${userId}`;
    return rateLimiter.getRemainingAttempts(key, maxUploads);
  },

  /**
   * Get time until upload limit resets (in seconds)
   */
  getTimeUntilReset(userId: string): number {
    const key = `upload:${userId}`;
    return rateLimiter.getTimeUntilReset(key);
  },

  /**
   * Reset upload limit for user (admin function)
   */
  resetUser(userId: string): void {
    const key = `upload:${userId}`;
    rateLimiter.reset(key);
  },
};

/**
 * API Request Rate Limiter
 * Prevents excessive API calls
 */
export const apiRateLimiter = {
  /**
   * Check if user can make an API request
   * @param userId - User identifier
   * @param endpoint - API endpoint name
   * @param maxRequests - Maximum requests allowed (default: 60)
   * @param windowMinutes - Time window in minutes (default: 1)
   */
  canRequest(userId: string, endpoint: string, maxRequests = 60, windowMinutes = 1): boolean {
    const key = `api:${endpoint}:${userId}`;
    const windowMs = windowMinutes * 60 * 1000;
    return rateLimiter.checkLimit(key, maxRequests, windowMs);
  },

  /**
   * Get remaining requests for user/endpoint
   */
  getRemainingRequests(userId: string, endpoint: string, maxRequests = 60): number {
    const key = `api:${endpoint}:${userId}`;
    return rateLimiter.getRemainingAttempts(key, maxRequests);
  },

  /**
   * Get time until rate limit resets (in seconds)
   */
  getTimeUntilReset(userId: string, endpoint: string): number {
    const key = `api:${endpoint}:${userId}`;
    return rateLimiter.getTimeUntilReset(key);
  },
};

/**
 * Auth Attempt Rate Limiter
 * Prevents brute force attacks
 */
export const authRateLimiter = {
  /**
   * Check if auth attempt is allowed
   * @param identifier - Email or username
   * @param maxAttempts - Maximum attempts (default: 5)
   * @param windowMinutes - Time window in minutes (default: 15)
   */
  canAttempt(identifier: string, maxAttempts = 5, windowMinutes = 15): boolean {
    const key = `auth:${identifier}`;
    const windowMs = windowMinutes * 60 * 1000;
    return rateLimiter.checkLimit(key, maxAttempts, windowMs);
  },

  /**
   * Get remaining auth attempts
   */
  getRemainingAttempts(identifier: string, maxAttempts = 5): number {
    const key = `auth:${identifier}`;
    return rateLimiter.getRemainingAttempts(key, maxAttempts);
  },

  /**
   * Get time until auth limit resets (in seconds)
   */
  getTimeUntilReset(identifier: string): number {
    const key = `auth:${identifier}`;
    return rateLimiter.getTimeUntilReset(key);
  },

  /**
   * Reset auth limit (after successful login)
   */
  reset(identifier: string): void {
    const key = `auth:${identifier}`;
    rateLimiter.reset(key);
  },
};

/**
 * Format remaining time for display
 */
export function formatRateLimitTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} second${seconds !== 1 ? "s" : ""}`;
  }
  const minutes = Math.ceil(seconds / 60);
  return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
}
