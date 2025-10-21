/**
 * State Comparison Utilities
 * Fast deep-equality checking for state-aware debouncing
 */

/**
 * Deep equality check for comparing state objects
 * Handles nested objects, arrays, Sets, Maps, and primitives
 *
 * @param a - First value to compare
 * @param b - Second value to compare
 * @returns true if values are deeply equal, false otherwise
 */
export function deepEqual(a: any, b: any): boolean {
  // Identical references or primitives
  if (a === b) return true;

  // Null/undefined checks
  if (a == null || b == null) return a === b;

  // Type mismatch
  if (typeof a !== typeof b) return false;

  // Date comparison
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }

  // Set comparison
  if (a instanceof Set && b instanceof Set) {
    if (a.size !== b.size) return false;
    for (const item of a) {
      if (!b.has(item)) return false;
    }
    return true;
  }

  // Map comparison
  if (a instanceof Map && b instanceof Map) {
    if (a.size !== b.size) return false;
    for (const [key, value] of a) {
      if (!b.has(key) || !deepEqual(value, b.get(key))) {
        return false;
      }
    }
    return true;
  }

  // Array comparison
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  // Object comparison
  if (typeof a === 'object' && typeof b === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) return false;

    for (const key of keysA) {
      if (!keysB.includes(key)) return false;
      if (!deepEqual(a[key], b[key])) return false;
    }

    return true;
  }

  // Primitives that aren't equal
  return false;
}

/**
 * Create a serializable snapshot of state for comparison
 * Converts Sets to arrays, sorts object keys for consistent comparison
 *
 * @param state - State object to serialize
 * @returns Normalized state object
 */
export function normalizeState(state: any): any {
  if (state == null) return state;

  // Handle Sets - convert to sorted array
  if (state instanceof Set) {
    return Array.from(state).sort();
  }

  // Handle Maps - convert to sorted object
  if (state instanceof Map) {
    const obj: any = {};
    const sortedKeys = Array.from(state.keys()).sort();
    for (const key of sortedKeys) {
      obj[key] = normalizeState(state.get(key));
    }
    return obj;
  }

  // Handle Arrays
  if (Array.isArray(state)) {
    return state.map(normalizeState);
  }

  // Handle Objects
  if (typeof state === 'object') {
    const normalized: any = {};
    const sortedKeys = Object.keys(state).sort();
    for (const key of sortedKeys) {
      normalized[key] = normalizeState(state[key]);
    }
    return normalized;
  }

  // Primitives
  return state;
}

/**
 * Fast hash function for state comparison
 * Uses JSON.stringify on normalized state
 * Useful for large objects where deep comparison is expensive
 *
 * @param state - State to hash
 * @returns Hash string
 */
export function hashState(state: any): string {
  try {
    const normalized = normalizeState(state);
    return JSON.stringify(normalized);
  } catch (error) {
    console.warn('[State Hash] Failed to hash state:', error);
    return '';
  }
}

/**
 * Compare two states and return true if they differ
 *
 * @param current - Current state
 * @param previous - Previous state
 * @returns true if states are different, false if identical
 */
export function hasStateChanged(current: any, previous: any): boolean {
  return !deepEqual(current, previous);
}

/**
 * Compare two states using hash-based comparison (faster for large objects)
 *
 * @param current - Current state
 * @param previous - Previous state
 * @returns true if states are different, false if identical
 */
export function hasStateChangedHash(current: any, previous: any): boolean {
  return hashState(current) !== hashState(previous);
}
