import { useRef, useCallback } from 'react';

interface RateLimitOptions {
  maxCalls: number;
  windowMs: number;
}

/**
 * Hook to rate limit function calls
 * @param maxCalls - Maximum number of calls allowed
 * @param windowMs - Time window in milliseconds
 * @returns Object with execute function and isRateLimited flag
 */
export function useRateLimit({ maxCalls, windowMs }: RateLimitOptions) {
  const callTimestamps = useRef<number[]>([]);

  const execute = useCallback(
    <T extends (...args: any[]) => any>(fn: T): ReturnType<T> | null => {
      const now = Date.now();
      
      // Remove timestamps outside the window
      callTimestamps.current = callTimestamps.current.filter(
        (timestamp) => now - timestamp < windowMs
      );

      // Check if rate limit is exceeded
      if (callTimestamps.current.length >= maxCalls) {
        const oldestCall = callTimestamps.current[0];
        const timeUntilReset = windowMs - (now - oldestCall);
        const secondsUntilReset = Math.ceil(timeUntilReset / 1000);
        
        console.warn(`Rate limit exceeded. Try again in ${secondsUntilReset} seconds.`);
        return null;
      }

      // Record this call
      callTimestamps.current.push(now);

      // Execute the function
      return fn();
    },
    [maxCalls, windowMs]
  );

  const isRateLimited = useCallback(() => {
    const now = Date.now();
    callTimestamps.current = callTimestamps.current.filter(
      (timestamp) => now - timestamp < windowMs
    );
    return callTimestamps.current.length >= maxCalls;
  }, [maxCalls, windowMs]);

  return { execute, isRateLimited };
}
