/**
 * Analytics utility for tracking user actions
 * Integrates with analytics providers in production
 */

export interface AnalyticsEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
  metadata?: Record<string, any>;
}

/**
 * Track an analytics event
 */
export const trackEvent = (event: AnalyticsEvent): void => {
  // Only track in production or when explicitly enabled
  if (process.env.NODE_ENV === 'development' && !process.env.NEXT_PUBLIC_ENABLE_DEV_ANALYTICS) {
    console.log('[Analytics (Dev)]', event);
    return;
  }

  try {
    // Google Analytics 4
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', event.action, {
        event_category: event.category,
        event_label: event.label,
        value: event.value,
        ...event.metadata,
      });
    }

    // Custom analytics endpoint (if you have one)
    if (process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT) {
      fetch(process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...event,
          timestamp: new Date().toISOString(),
          url: window.location.href,
        }),
      }).catch(err => {
        // Fail silently - don't interrupt user experience
        if (process.env.NODE_ENV === 'development') {
          console.warn('Analytics tracking failed:', err);
        }
      });
    }
  } catch (error) {
    // Fail silently - analytics should never break the app
    if (process.env.NODE_ENV === 'development') {
      console.warn('Analytics error:', error);
    }
  }
};

/**
 * Track page view
 */
export const trackPageView = (pageName: string, metadata?: Record<string, any>): void => {
  trackEvent({
    action: 'page_view',
    category: 'Navigation',
    label: pageName,
    metadata,
  });
};

/**
 * Track user interaction
 */
export const trackInteraction = (
  element: string,
  action: string,
  metadata?: Record<string, any>
): void => {
  trackEvent({
    action: `${element}_${action}`,
    category: 'User Interaction',
    label: element,
    metadata,
  });
};

/**
 * Track investment action
 */
export const trackInvestment = (
  action: 'view' | 'invest' | 'export' | 'download_certificate',
  metadata?: Record<string, any>
): void => {
  trackEvent({
    action: `investment_${action}`,
    category: 'Investment',
    metadata,
  });
};

/**
 * Track performance metrics
 */
export const trackPerformance = (metric: string, value: number, metadata?: Record<string, any>): void => {
  trackEvent({
    action: 'performance_metric',
    category: 'Performance',
    label: metric,
    value,
    metadata,
  });
};
