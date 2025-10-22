/**
 * Session Storage Utilities for Blind75 View State
 *
 * Preserves UI state (scroll position, last viewed problem) within a browser session.
 * Uses sessionStorage (not localStorage) because view state should be session-scoped.
 *
 * Why NOT Firebase/Firestore?
 * - View state is ephemeral UI state, not user data
 * - Changes frequently during a session
 * - Would add unnecessary costs and latency
 * - sessionStorage provides instant access
 */

export interface Blind75ViewState {
  scrollY: number;
  lastViewedProblemSlug: string | null;
  lastUpdated: number;
}

const SESSION_KEY = 'blind75ViewState';
const MAX_AGE_MS = 60 * 60 * 1000; // 1 hour

/**
 * Save Blind75 view state to sessionStorage
 */
export function saveBlind75ViewState(state: Blind75ViewState): void {
  if (typeof window === 'undefined' || !sessionStorage) return;

  try {
    const stateWithTimestamp = {
      ...state,
      lastUpdated: Date.now()
    };

    sessionStorage.setItem(SESSION_KEY, JSON.stringify(stateWithTimestamp));
  } catch (error) {
    // sessionStorage might be full or disabled
    console.warn('[Blind75ViewState] Failed to save to sessionStorage:', error);
  }
}

/**
 * Load Blind75 view state from sessionStorage
 * Returns null if not found or if stale (>1 hour old)
 */
export function loadBlind75ViewState(): Blind75ViewState | null {
  if (typeof window === 'undefined' || !sessionStorage) return null;

  try {
    const stored = sessionStorage.getItem(SESSION_KEY);

    if (!stored) return null;

    const state = JSON.parse(stored) as Blind75ViewState;
    const age = Date.now() - state.lastUpdated;

    // Discard stale state (older than 1 hour)
    if (age > MAX_AGE_MS) {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }

    return state;
  } catch (error) {
    console.warn('[Blind75ViewState] Failed to load from sessionStorage:', error);
    return null;
  }
}

/**
 * Clear Blind75 view state
 */
export function clearBlind75ViewState(): void {
  if (typeof window === 'undefined' || !sessionStorage) return;

  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch (error) {
    console.warn('[Blind75ViewState] Failed to clear from sessionStorage:', error);
  }
}

/**
 * Create default/empty view state
 */
export function createDefaultBlind75ViewState(): Blind75ViewState {
  return {
    scrollY: 0,
    lastViewedProblemSlug: null,
    lastUpdated: Date.now()
  };
}
