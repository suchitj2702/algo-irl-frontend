/**
 * Tests for State Comparison Utilities
 * These tests demonstrate the state-aware debouncing behavior
 */

import { deepEqual, normalizeState, hashState, hasStateChanged } from '../stateComparison';

describe('deepEqual', () => {
  test('compares primitives correctly', () => {
    expect(deepEqual(1, 1)).toBe(true);
    expect(deepEqual('test', 'test')).toBe(true);
    expect(deepEqual(true, true)).toBe(true);
    expect(deepEqual(null, null)).toBe(true);
    expect(deepEqual(undefined, undefined)).toBe(true);

    expect(deepEqual(1, 2)).toBe(false);
    expect(deepEqual('test', 'other')).toBe(false);
    expect(deepEqual(true, false)).toBe(false);
  });

  test('compares objects correctly', () => {
    expect(deepEqual({ a: 1 }, { a: 1 })).toBe(true);
    expect(deepEqual({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true);

    expect(deepEqual({ a: 1 }, { a: 2 })).toBe(false);
    expect(deepEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
  });

  test('compares arrays correctly', () => {
    expect(deepEqual([1, 2, 3], [1, 2, 3])).toBe(true);
    expect(deepEqual([], [])).toBe(true);

    expect(deepEqual([1, 2, 3], [1, 2])).toBe(false);
    expect(deepEqual([1, 2, 3], [3, 2, 1])).toBe(false);
  });

  test('compares Sets correctly', () => {
    expect(deepEqual(new Set([1, 2, 3]), new Set([1, 2, 3]))).toBe(true);
    expect(deepEqual(new Set([1, 2, 3]), new Set([3, 2, 1]))).toBe(true);

    expect(deepEqual(new Set([1, 2, 3]), new Set([1, 2]))).toBe(false);
    expect(deepEqual(new Set([1, 2]), new Set([1, 2, 3]))).toBe(false);
  });

  test('compares nested structures correctly', () => {
    const obj1 = {
      completedProblems: new Set(['p1', 'p2']),
      bookmarkedProblems: new Set(['p3']),
      data: { count: 5 }
    };

    const obj2 = {
      completedProblems: new Set(['p1', 'p2']),
      bookmarkedProblems: new Set(['p3']),
      data: { count: 5 }
    };

    const obj3 = {
      completedProblems: new Set(['p1', 'p2']),
      bookmarkedProblems: new Set(['p3']),
      data: { count: 6 } // Different count
    };

    expect(deepEqual(obj1, obj2)).toBe(true);
    expect(deepEqual(obj1, obj3)).toBe(false);
  });
});

describe('normalizeState', () => {
  test('converts Sets to sorted arrays', () => {
    const state = {
      items: new Set(['c', 'a', 'b'])
    };

    const normalized = normalizeState(state);
    expect(normalized.items).toEqual(['a', 'b', 'c']);
  });

  test('sorts object keys', () => {
    const state = {
      z: 1,
      a: 2,
      m: 3
    };

    const normalized = normalizeState(state);
    const keys = Object.keys(normalized);
    expect(keys).toEqual(['a', 'm', 'z']);
  });
});

describe('hasStateChanged', () => {
  test('detects no change when objects are identical', () => {
    const prev = { code: 'function test() {}', status: 'in_progress' };
    const curr = { code: 'function test() {}', status: 'in_progress' };

    expect(hasStateChanged(curr, prev)).toBe(false);
  });

  test('detects change when code differs', () => {
    const prev = { code: 'function test() {}', status: 'in_progress' };
    const curr = { code: 'function test2() {}', status: 'in_progress' };

    expect(hasStateChanged(curr, prev)).toBe(true);
  });

  test('detects change when bookmark status differs', () => {
    const prev = { problemId: 'p1', isBookmarked: false };
    const curr = { problemId: 'p1', isBookmarked: true };

    expect(hasStateChanged(curr, prev)).toBe(true);
  });

  test('detects no change after revert', () => {
    const initial = { isBookmarked: false };
    const toggled = { isBookmarked: true };
    const reverted = { isBookmarked: false };

    expect(hasStateChanged(toggled, initial)).toBe(true);
    expect(hasStateChanged(reverted, initial)).toBe(false);
  });
});

describe('hashState', () => {
  test('produces same hash for identical states', () => {
    const state1 = { a: 1, b: new Set([1, 2, 3]) };
    const state2 = { a: 1, b: new Set([3, 2, 1]) };

    expect(hashState(state1)).toBe(hashState(state2));
  });

  test('produces different hash for different states', () => {
    const state1 = { a: 1 };
    const state2 = { a: 2 };

    expect(hashState(state1)).not.toBe(hashState(state2));
  });
});
