/**
 * Production Metrics - Custom analytics tracking via Vercel Analytics
 *
 * Tracks:
 * - Feature usage patterns
 * - User journey completion
 * - Performance metrics
 * - Error rates (aggregated, no sensitive data)
 */

import { track } from '@vercel/analytics';
import { secureLog } from './secureLogger';

/**
 * Track custom event via Vercel Analytics
 */
function trackEvent(eventName: string, properties?: Record<string, any>): void {
  // Only track in production
  if (!import.meta.env.PROD) {
    secureLog.dev('Analytics', `Would track: ${eventName}`, properties);
    return;
  }

  try {
    // Send to Vercel Analytics
    track(eventName, properties);

    // Also log for debugging
    secureLog.info('Analytics', `Tracked: ${eventName}`, properties);
  } catch (error) {
    // Don't let analytics errors break the app
    secureLog.warn('Analytics', 'Failed to track event', { eventName, error });
  }
}

/**
 * Track study plan generation
 */
export function trackStudyPlanGenerated(data: {
  difficulty?: string;
  problemCount?: number;
  timeframe?: string;
  isBlind75?: boolean;
}): void {
  trackEvent('study_plan_generated', {
    difficulty: data.difficulty || 'unknown',
    problem_count: data.problemCount || 0,
    timeframe: data.timeframe || 'unknown',
    is_blind75: data.isBlind75 || false,
  });
}

/**
 * Track code execution
 */
export function trackCodeExecuted(data: {
  language: string;
  executionTime?: number;
  success: boolean;
  problemDifficulty?: string;
}): void {
  trackEvent('code_executed', {
    language: data.language,
    execution_time_ms: data.executionTime,
    success: data.success,
    problem_difficulty: data.problemDifficulty || 'unknown',
  });
}

/**
 * Track problem completion
 */
export function trackProblemCompleted(data: {
  problemId: string;
  difficulty: string;
  timeSpent?: number;
  attempts?: number;
}): void {
  trackEvent('problem_completed', {
    problem_difficulty: data.difficulty,
    time_spent_seconds: data.timeSpent,
    attempts: data.attempts || 1,
  });
}

/**
 * Track user signup
 */
export function trackSignupCompleted(data: {
  provider: 'email' | 'google';
  referralSource?: string;
}): void {
  trackEvent('signup_completed', {
    auth_provider: data.provider,
    referral_source: data.referralSource || 'direct',
  });
}

/**
 * Track first problem attempt (important milestone)
 */
export function trackFirstProblemAttempt(data: {
  problemDifficulty: string;
  timeSinceSignup?: number;
}): void {
  trackEvent('first_problem_attempt', {
    problem_difficulty: data.problemDifficulty,
    time_since_signup_hours: data.timeSinceSignup,
  });
}

/**
 * Track subscription intent (when user clicks upgrade - FUTURE)
 */
export function trackSubscriptionIntent(data: {
  planId?: string;
  source: string;
}): void {
  trackEvent('subscription_intent', {
    plan_id: data.planId || 'unknown',
    source: data.source, // e.g., 'premium_gate', 'pricing_page'
  });
}

/**
 * Track payment completion (FUTURE - when payments enabled)
 */
export function trackPaymentCompleted(data: {
  planId: string;
  success: boolean;
}): void {
  trackEvent('payment_completed', {
    plan_id: data.planId,
    success: data.success,
  });
}

/**
 * Track error occurrence (aggregated, no sensitive data)
 */
export function trackError(data: {
  errorType: string;
  component: string;
  isFatal?: boolean;
}): void {
  trackEvent('error_occurred', {
    error_type: data.errorType,
    component: data.component,
    is_fatal: data.isFatal || false,
  });
}

/**
 * Track slow API call (performance issue)
 */
export function trackSlowApiCall(data: {
  endpoint: string;
  duration: number;
  threshold?: number;
}): void {
  trackEvent('slow_api_call', {
    endpoint: data.endpoint,
    duration_ms: data.duration,
    threshold_ms: data.threshold || 1000,
  });
}

/**
 * Track cache performance
 */
export function trackCachePerformance(data: {
  cacheType: string;
  hit: boolean;
  operation: string;
}): void {
  trackEvent('cache_operation', {
    cache_type: data.cacheType,
    cache_hit: data.hit,
    operation: data.operation,
  });
}

/**
 * Track feature flag changes (for A/B testing)
 */
export function trackFeatureFlagEvaluated(data: {
  flagName: string;
  value: boolean | string;
}): void {
  // Only track in production to understand feature adoption
  if (import.meta.env.PROD) {
    trackEvent('feature_flag_evaluated', {
      flag_name: data.flagName,
      flag_value: String(data.value),
    });
  }
}

/**
 * Track user journey step completion
 */
export function trackJourneyStep(step: string, metadata?: Record<string, any>): void {
  trackEvent('user_journey_step', {
    step,
    ...metadata,
  });
}

/**
 * Track page view with custom properties
 */
export function trackPageView(pageName: string, properties?: Record<string, any>): void {
  trackEvent('page_view', {
    page_name: pageName,
    ...properties,
  });
}
