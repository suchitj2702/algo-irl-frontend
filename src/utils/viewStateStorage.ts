/**
 * Session Storage Utilities for Study Plan View State
 *
 * Preserves UI state (scroll position, expanded days, filters) within a browser session.
 * Uses sessionStorage (not localStorage) because view state should be session-scoped.
 *
 * Why NOT Firebase/Firestore?
 * - View state is ephemeral UI state, not user data
 * - Changes 50+ times per session (every scroll, expand/collapse)
 * - Would cost ~$400/year in Firestore writes
 * - Adds 200-500ms latency vs instant sessionStorage
 */

import { StudyPlanViewState } from '../types/studyPlan';

const SESSION_KEY_PREFIX = 'studyPlanViewState';
const MAX_AGE_MS = 60 * 60 * 1000; // 1 hour

/**
 * Save view state to sessionStorage for a specific plan
 */
export function saveViewStateToSession(
  planId: string,
  state: StudyPlanViewState
): void {
  if (typeof window === 'undefined' || !sessionStorage) return;

  try {
    const key = `${SESSION_KEY_PREFIX}_${planId}`;
    const stateWithTimestamp = {
      ...state,
      lastUpdated: Date.now()
    };

    sessionStorage.setItem(key, JSON.stringify(stateWithTimestamp));
  } catch (error) {
    // sessionStorage might be full or disabled
    console.warn('[ViewState] Failed to save to sessionStorage:', error);
  }
}

/**
 * Load view state from sessionStorage for a specific plan
 * Returns null if not found or if stale (>1 hour old)
 */
export function loadViewStateFromSession(
  planId: string
): StudyPlanViewState | null {
  if (typeof window === 'undefined' || !sessionStorage) return null;

  try {
    const key = `${SESSION_KEY_PREFIX}_${planId}`;
    const stored = sessionStorage.getItem(key);

    if (!stored) return null;

    const state = JSON.parse(stored) as StudyPlanViewState;
    const age = Date.now() - state.lastUpdated;

    // Discard stale state (older than 1 hour)
    if (age > MAX_AGE_MS) {
      sessionStorage.removeItem(key);
      return null;
    }

    return state;
  } catch (error) {
    console.warn('[ViewState] Failed to load from sessionStorage:', error);
    return null;
  }
}

/**
 * Clear view state for a specific plan
 */
export function clearViewStateFromSession(planId: string): void {
  if (typeof window === 'undefined' || !sessionStorage) return;

  try {
    const key = `${SESSION_KEY_PREFIX}_${planId}`;
    sessionStorage.removeItem(key);
  } catch (error) {
    console.warn('[ViewState] Failed to clear from sessionStorage:', error);
  }
}

/**
 * Clear all view states (useful on logout or plan deletion)
 */
export function clearAllViewStates(): void {
  if (typeof window === 'undefined' || !sessionStorage) return;

  try {
    const keys = Object.keys(sessionStorage);
    keys.forEach(key => {
      if (key.startsWith(SESSION_KEY_PREFIX)) {
        sessionStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.warn('[ViewState] Failed to clear all view states:', error);
  }
}

/**
 * Create default/empty view state
 */
export function createDefaultViewState(): StudyPlanViewState {
  return {
    scrollY: 0,
    expandedDays: [],
    showTopics: false,
    showDifficulty: false,
    showSavedOnly: false,
    showGuidance: false,
    lastUpdated: Date.now()
  };
}
