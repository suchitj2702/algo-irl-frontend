/**
 * Cache utility for managing user data in localStorage
 *
 * ⚠️ IMPORTANT: This file should ONLY be used for Blind75 (non-study-plan) problems.
 *
 * For study plan problems, use Firestore functions from:
 * - src/services/studyPlanFirestoreService.ts
 *
 * Study plan problems are stored in Firestore with full details, code, and progress tracking.
 * This ensures cross-device sync and eliminates localStorage limitations.
 */
import { Problem, CodeDetails } from '../types';
import { secureLog } from './secureLogger';

const KEY_SEPARATOR = '::';
const PLAN_PREFIX = 'plan::';

export interface CachedProblem {
  problemId: string;
  status: 'solved' | 'in_progress';
  solution: string;
  timestamp: number;
  companyId: string; // Store company ID for API calls
  companyName: string; // Store company name for display
  difficulty: string;
  title?: string;
  planId?: string;
}

export interface UserCache {
  problems: CachedProblem[];
}

const CACHE_KEY = 'algo_irl_user_cache';
const PROBLEM_DATA_KEY = 'algo_irl_problem_data';

export interface CachedProblemData {
  problem: Problem;
  codeDetails: CodeDetails;
  updatedAt: number;
}

export interface ParsedProblemCacheKey {
  baseProblemId: string;
  companyId: string;
  planId?: string;
}

export const buildProblemCacheKey = (
  problemId: string,
  companyId: string,
  planId?: string
): string => {
  if (planId) {
    return `${PLAN_PREFIX}${planId}${KEY_SEPARATOR}${problemId}${KEY_SEPARATOR}${companyId}`;
  }

  return `${problemId}${KEY_SEPARATOR}${companyId}`;
};

export const parseProblemCacheKey = (key: string): ParsedProblemCacheKey => {
  if (key.startsWith(PLAN_PREFIX)) {
    const trimmed = key.slice(PLAN_PREFIX.length);
    const parts = trimmed.split(KEY_SEPARATOR);
    const [planId, baseProblemId = '', companyId = ''] = parts;
    return {
      planId: planId || undefined,
      baseProblemId,
      companyId
    };
  }

  const separatorParts = key.split(KEY_SEPARATOR);
  if (separatorParts.length >= 2) {
    const [baseProblemId, companyId] = separatorParts;
    return {
      baseProblemId,
      companyId
    };
  }

  const underscoreIndex = key.lastIndexOf('_');
  if (underscoreIndex !== -1) {
    return {
      baseProblemId: key.substring(0, underscoreIndex),
      companyId: key.substring(underscoreIndex + 1)
    };
  }

  return {
    baseProblemId: key,
    companyId: ''
  };
};

// Get cache from localStorage
export const getCache = (): UserCache => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsedCache = JSON.parse(cached);

      // Migration: handle old format where company was just a string
      if (parsedCache.problems) {
        parsedCache.problems = parsedCache.problems.map((problem: any) => {
          let normalizedProblem = problem;

          if (typeof normalizedProblem.company === 'string') {
            normalizedProblem = {
              ...normalizedProblem,
              companyId: normalizedProblem.company,
              companyName: normalizedProblem.company,
              company: undefined
            };
          }

          if (typeof normalizedProblem.problemId === 'string') {
            const parsedKey = parseProblemCacheKey(normalizedProblem.problemId);

            if (!normalizedProblem.companyId && parsedKey.companyId) {
              normalizedProblem = {
                ...normalizedProblem,
                companyId: parsedKey.companyId
              };
            }

            if (!normalizedProblem.planId && parsedKey.planId) {
              normalizedProblem = {
                ...normalizedProblem,
                planId: parsedKey.planId
              };
            }
          }

          return normalizedProblem;
        });
      }

      return {
        problems: parsedCache.problems || []
      };
    }
  } catch (error) {
    secureLog.error('Cache', error as Error, { operation: 'read-cache' });
  }

  return {
    problems: []
  };
};

// Save cache to localStorage
export const saveCache = (cache: UserCache): void => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error('Error saving to cache:', error);
  }
};

const getProblemDataMap = (): Record<string, CachedProblemData> => {
  try {
    const data = localStorage.getItem(PROBLEM_DATA_KEY);
    if (!data) return {};

    const parsed = JSON.parse(data);
    if (parsed && typeof parsed === 'object') {
      return parsed as Record<string, CachedProblemData>;
    }
  } catch (error) {
    console.error('Error reading problem data cache:', error);
  }
  return {};
};

const saveProblemDataMap = (map: Record<string, CachedProblemData>): void => {
  try {
    localStorage.setItem(PROBLEM_DATA_KEY, JSON.stringify(map));
  } catch (error) {
    console.error('Error saving problem data cache:', error);
  }
};

export const setCachedProblemData = (
  problemId: string,
  problem: Problem,
  codeDetails: CodeDetails
): void => {
  const map = getProblemDataMap();
  map[problemId] = {
    problem,
    codeDetails,
    updatedAt: Date.now()
  };
  saveProblemDataMap(map);
};

export const getCachedProblemData = (problemId: string): CachedProblemData | null => {
  const map = getProblemDataMap();
  return map[problemId] || null;
};

export const removeCachedProblemData = (problemId: string): void => {
  const map = getProblemDataMap();
  if (map[problemId]) {
    delete map[problemId];
    saveProblemDataMap(map);
  }
};

// Add or update a problem in cache
export const addProblemToCache = (
  problemId: string,
  status: 'solved' | 'in_progress',
  solution: string,
  companyId: string,
  companyName: string,
  difficulty: string,
  title?: string,
  planId?: string
): void => {
  const cache = getCache();
  const uniqueProblemId = buildProblemCacheKey(problemId, companyId, planId);

  const filteredProblems = cache.problems.filter(existing => {
    if (existing.problemId === uniqueProblemId) {
      return false;
    }

    if (planId) {
      const parsed = parseProblemCacheKey(existing.problemId);
      return !(parsed.planId === planId && parsed.baseProblemId === problemId);
    }

    return true;
  });

  const nextEntry: CachedProblem = {
    problemId: uniqueProblemId,
    status,
    solution,
    companyId,
    companyName,
    difficulty,
    title,
    timestamp: Date.now(),
    ...(planId ? { planId } : {})
  };

  filteredProblems.push(nextEntry);

  saveCache({ problems: filteredProblems });
};

// Get cached problem
export const getCachedProblem = (problemId: string): CachedProblem | null => {
  const cache = getCache();
  return cache.problems.find(p => p.problemId === problemId) || null;
};

// Get all cached problems
export interface GetAllCachedProblemsOptions {
  includePlanScoped?: boolean;
}

export const getAllCachedProblems = (
  options?: GetAllCachedProblemsOptions
): CachedProblem[] => {
  const cache = getCache();
  const includePlanScoped = options?.includePlanScoped ?? false;

  const list = includePlanScoped
    ? cache.problems
    : cache.problems.filter(problem => !problem.planId);

  return [...list].sort((a, b) => b.timestamp - a.timestamp);
};

// Update problem status to solved
export const markProblemAsSolved = (problemId: string, solution: string): void => {
  const cache = getCache();
  const problemIndex = cache.problems.findIndex(p => p.problemId === problemId);
  
  if (problemIndex !== -1) {
    cache.problems[problemIndex].status = 'solved';
    cache.problems[problemIndex].solution = solution;
    cache.problems[problemIndex].timestamp = Date.now();
    saveCache(cache);
  }
};

// Update problem solution (for in-progress problems)
export const updateProblemSolution = (problemId: string, solution: string): void => {
  const cache = getCache();
  const problemIndex = cache.problems.findIndex(p => p.problemId === problemId);
  
  if (problemIndex !== -1) {
    cache.problems[problemIndex].solution = solution;
    cache.problems[problemIndex].timestamp = Date.now();
    saveCache(cache);
  }
};

export const clearProblemsForPlan = (planId: string): void => {
  if (!planId) return;

  const cache = getCache();
  const nextProblems = cache.problems.filter(problem => {
    const parsed = parseProblemCacheKey(problem.problemId);
    const detectedPlanId = problem.planId ?? parsed.planId;
    return detectedPlanId !== planId;
  });

  if (nextProblems.length !== cache.problems.length) {
    saveCache({ problems: nextProblems });
  }

  const map = getProblemDataMap();
  let changed = false;

  for (const key of Object.keys(map)) {
    const parsed = parseProblemCacheKey(key);
    if (parsed.planId === planId) {
      delete map[key];
      changed = true;
    }
  }

  if (changed) {
    saveProblemDataMap(map);
  }
};

// Clear all cached data
export const clearCache = (): void => {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
};

// Interface for tracking problem show timestamps
export interface ProblemShowTimestamp {
  slug: string;
  lastShown: number;
}

// Get problem show timestamps from cache
export const getProblemShowTimestamps = (): ProblemShowTimestamp[] => {
  try {
    const cached = localStorage.getItem('algo_irl_problem_timestamps');
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (error) {
    console.error('Error reading problem timestamps:', error);
  }
  return [];
};

// Save problem show timestamps to cache
export const saveProblemShowTimestamps = (timestamps: ProblemShowTimestamp[]): void => {
  try {
    localStorage.setItem('algo_irl_problem_timestamps', JSON.stringify(timestamps));
  } catch (error) {
    console.error('Error saving problem timestamps:', error);
  }
};

// Update timestamp for a shown problem
export const updateProblemShowTimestamp = (slug: string): void => {
  const timestamps = getProblemShowTimestamps();
  const existingIndex = timestamps.findIndex(t => t.slug === slug);
  
  if (existingIndex !== -1) {
    timestamps[existingIndex].lastShown = Date.now();
  } else {
    timestamps.push({ slug, lastShown: Date.now() });
  }
  
  saveProblemShowTimestamps(timestamps);
}; 
