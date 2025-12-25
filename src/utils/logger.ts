/**
 * Development-only logging utility
 * Prevents console statements from appearing in production
 */

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  /**
   * Log informational messages (only in development)
   */
  log: (...args: unknown[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  /**
   * Log error messages (only in development)
   * In production, you might want to send these to a monitoring service
   */
  error: (...args: unknown[]) => {
    if (isDevelopment) {
      console.error(...args);
    }
    // TODO: In production, integrate with error monitoring service (Sentry, LogRocket, etc.)
  },

  /**
   * Log warning messages (only in development)
   */
  warn: (...args: unknown[]) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },

  /**
   * Log debug messages (only in development)
   */
  debug: (...args: unknown[]) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },
};
