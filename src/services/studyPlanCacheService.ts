/**
 * Study Plan Cache Service
 * Manages localStorage caching for study plans with hybrid auto-save strategy
 */

import { Problem, CodeDetails } from '../types';
import { StudyPlanConfig, StudyPlanResponse, CachedStudyPlan } from '../types/studyPlan';

const CACHE_KEY_PREFIX = 'algoirl_study_plan_';
const PLANS_INDEX_KEY = 'algoirl_study_plans_index';
const CACHE_VERSION = 1;

export interface CachedPlanData {
  planId: string;
  config: StudyPlanConfig;
  response: StudyPlanResponse;
  progress: {
    completedProblems: string[];
    bookmarkedProblems: string[];
    inProgressProblems: string[];
    currentDay: number;
    lastUpdatedAt: number;
  };
  problemDetails: Record<string, {
    problem: Problem;
    codeDetails: CodeDetails;
    userCode: string;
    lastWorkedAt: number;
  }>;
  cachedAt: number;
  version: number;
  syncedToFirestore: boolean;
}

export interface PlansIndex {
  planIds: string[];
  lastUpdated: number;
}

/**
 * Get the cache key for a specific plan
 */
function getPlanCacheKey(planId: string): string {
  return `${CACHE_KEY_PREFIX}${planId}`;
}

/**
 * Get the index of all cached plans
 */
export function getPlansIndex(): PlansIndex {
  try {
    const data = localStorage.getItem(PLANS_INDEX_KEY);
    if (!data) {
      return { planIds: [], lastUpdated: Date.now() };
    }
    return JSON.parse(data);
  } catch (error) {
    console.error('[Cache] Failed to read plans index:', error);
    return { planIds: [], lastUpdated: Date.now() };
  }
}

/**
 * Update the plans index
 */
function updatePlansIndex(planIds: string[]): void {
  try {
    const index: PlansIndex = {
      planIds: Array.from(new Set(planIds)), // Remove duplicates
      lastUpdated: Date.now()
    };
    localStorage.setItem(PLANS_INDEX_KEY, JSON.stringify(index));
  } catch (error) {
    console.error('[Cache] Failed to update plans index:', error);
  }
}

/**
 * Add a plan to the index
 */
function addToIndex(planId: string): void {
  const index = getPlansIndex();
  if (!index.planIds.includes(planId)) {
    index.planIds.push(planId);
    updatePlansIndex(index.planIds);
  }
}

/**
 * Remove a plan from the index
 */
function removeFromIndex(planId: string): void {
  const index = getPlansIndex();
  const filtered = index.planIds.filter(id => id !== planId);
  updatePlansIndex(filtered);
}

/**
 * Save a complete study plan to localStorage
 */
export function savePlanToCache(data: CachedPlanData): void {
  try {
    const key = getPlanCacheKey(data.planId);
    localStorage.setItem(key, JSON.stringify(data));
    addToIndex(data.planId);
    console.log(`💾 [Cache] Saved plan ${data.planId} to localStorage`);
  } catch (error) {
    console.error('[Cache] Failed to save plan:', error);
    // Handle quota exceeded error
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.warn('[Cache] Storage quota exceeded, cleaning old data...');
      cleanOldCacheEntries();
      // Retry once after cleanup
      try {
        const key = getPlanCacheKey(data.planId);
        localStorage.setItem(key, JSON.stringify(data));
        addToIndex(data.planId);
      } catch (retryError) {
        console.error('[Cache] Failed to save plan after cleanup:', retryError);
      }
    }
  }
}

/**
 * Load a study plan from localStorage
 */
export function getPlanFromCache(planId: string): CachedPlanData | null {
  try {
    const key = getPlanCacheKey(planId);
    const data = localStorage.getItem(key);
    if (!data) {
      return null;
    }
    const parsed: CachedPlanData = JSON.parse(data);

    // Version check
    if (parsed.version !== CACHE_VERSION) {
      console.warn(`[Cache] Version mismatch for plan ${planId}, invalidating cache`);
      removePlanFromCache(planId);
      return null;
    }

    console.log(`💾 [Cache] Loaded plan ${planId} from localStorage`);
    return parsed;
  } catch (error) {
    console.error('[Cache] Failed to load plan:', error);
    return null;
  }
}

/**
 * Load all cached study plans
 */
export function getAllCachedPlans(): CachedPlanData[] {
  const index = getPlansIndex();
  const plans: CachedPlanData[] = [];

  for (const planId of index.planIds) {
    const plan = getPlanFromCache(planId);
    if (plan) {
      plans.push(plan);
    }
  }

  // Sort by cachedAt descending (most recent first)
  return plans.sort((a, b) => b.cachedAt - a.cachedAt);
}

/**
 * Update plan progress in cache
 */
export function updatePlanProgressInCache(
  planId: string,
  progress: Partial<CachedPlanData['progress']>
): void {
  const plan = getPlanFromCache(planId);
  if (!plan) {
    console.warn(`[Cache] Plan ${planId} not found in cache`);
    return;
  }

  plan.progress = {
    ...plan.progress,
    ...progress,
    lastUpdatedAt: Date.now()
  };
  plan.syncedToFirestore = false; // Mark as needing sync

  savePlanToCache(plan);
}

/**
 * Update problem details in cache
 */
export function updateProblemInCache(
  planId: string,
  problemId: string,
  details: {
    problem?: Problem;
    codeDetails?: CodeDetails;
    userCode?: string;
  }
): void {
  const plan = getPlanFromCache(planId);
  if (!plan) {
    console.warn(`[Cache] Plan ${planId} not found in cache`);
    return;
  }

  if (!plan.problemDetails[problemId]) {
    plan.problemDetails[problemId] = {
      problem: details.problem!,
      codeDetails: details.codeDetails!,
      userCode: details.userCode || '',
      lastWorkedAt: Date.now()
    };
  } else {
    if (details.problem) plan.problemDetails[problemId].problem = details.problem;
    if (details.codeDetails) plan.problemDetails[problemId].codeDetails = details.codeDetails;
    if (details.userCode !== undefined) plan.problemDetails[problemId].userCode = details.userCode;
    plan.problemDetails[problemId].lastWorkedAt = Date.now();
  }

  plan.syncedToFirestore = false; // Mark as needing sync
  savePlanToCache(plan);
}

/**
 * Get problem details from cache
 */
export function getProblemFromCache(
  planId: string,
  problemId: string
): { problem: Problem; codeDetails: CodeDetails; userCode: string } | null {
  const plan = getPlanFromCache(planId);
  if (!plan || !plan.problemDetails[problemId]) {
    return null;
  }

  return plan.problemDetails[problemId];
}

/**
 * Remove a study plan from cache
 */
export function removePlanFromCache(planId: string): void {
  try {
    const key = getPlanCacheKey(planId);
    localStorage.removeItem(key);
    removeFromIndex(planId);
    console.log(`💾 [Cache] Removed plan ${planId} from localStorage`);
  } catch (error) {
    console.error('[Cache] Failed to remove plan:', error);
  }
}

/**
 * Mark a plan as synced to Firestore
 */
export function markPlanAsSynced(planId: string): void {
  const plan = getPlanFromCache(planId);
  if (plan) {
    plan.syncedToFirestore = true;
    savePlanToCache(plan);
  }
}

/**
 * Clean old cache entries (older than 30 days)
 */
function cleanOldCacheEntries(): void {
  const index = getPlansIndex();
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
  const plansToKeep: string[] = [];

  for (const planId of index.planIds) {
    const plan = getPlanFromCache(planId);
    if (plan && plan.cachedAt > thirtyDaysAgo) {
      plansToKeep.push(planId);
    } else {
      removePlanFromCache(planId);
    }
  }

  updatePlansIndex(plansToKeep);
  console.log(`💾 [Cache] Cleaned ${index.planIds.length - plansToKeep.length} old cache entries`);
}

/**
 * Clear all cached plans (use with caution)
 */
export function clearAllCachedPlans(): void {
  const index = getPlansIndex();
  for (const planId of index.planIds) {
    removePlanFromCache(planId);
  }
  localStorage.removeItem(PLANS_INDEX_KEY);
  console.log('💾 [Cache] Cleared all cached plans');
}

/**
 * Convert CachedStudyPlan (old format) to CachedPlanData (new format)
 * Also accepts optional problemProgress from Firestore to populate problemDetails
 */
export function migrateToCachedPlanData(
  plan: CachedStudyPlan,
  problemProgress?: Record<string, any>
): CachedPlanData {
  // Initialize problemDetails - this will be populated if we have problemProgress data
  const problemDetails: Record<string, {
    problem: Problem;
    codeDetails: CodeDetails;
    userCode: string;
    lastWorkedAt: number;
  }> = {};

  // If problemProgress is provided (from Firestore), populate problemDetails
  if (problemProgress) {
    Object.entries(problemProgress).forEach(([problemId, progress]) => {
      // Check if this problem has been accessed (has problemDetails and codeDetails)
      if (progress.problemDetails && progress.codeDetails) {
        problemDetails[problemId] = {
          problem: {
            title: progress.problemDetails.title,
            background: progress.problemDetails.background,
            problemStatement: progress.problemDetails.problemStatement,
            testCases: progress.problemDetails.testCases,
            constraints: progress.problemDetails.constraints,
            requirements: progress.problemDetails.requirements,
            leetcodeUrl: progress.problemDetails.leetcodeUrl,
            problemId: problemId
          },
          codeDetails: {
            boilerplateCode: progress.codeDetails.boilerplateCode,
            defaultUserCode: progress.codeDetails.defaultUserCode,
            functionName: progress.codeDetails.functionName,
            solutionStructureHint: progress.codeDetails.solutionStructureHint,
            language: progress.codeDetails.language
          },
          userCode: progress.code || progress.codeDetails?.defaultUserCode || '',
          lastWorkedAt: progress.lastWorkedAt ? new Date(progress.lastWorkedAt).getTime() : Date.now()
        };
      }
    });

    console.log(`💾 [Migration] Populated ${Object.keys(problemDetails).length} problem details from Firestore`);
  }

  return {
    planId: plan.id,
    config: plan.config,
    response: plan.response,
    progress: {
      completedProblems: plan.progress.completedProblems || [],
      bookmarkedProblems: plan.progress.bookmarkedProblems || [],
      inProgressProblems: plan.progress.inProgressProblems || [],
      currentDay: plan.progress.currentDay || 1,
      lastUpdatedAt: plan.progress.lastUpdated || Date.now()
    },
    problemDetails, // Now properly populated from Firestore data if available
    cachedAt: plan.createdAt || Date.now(),
    version: CACHE_VERSION,
    syncedToFirestore: true // Assume old plans are synced
  };
}

/**
 * Load problem details from Firestore into cache
 * This is called when loading a study plan to pre-populate problem details
 */
export async function loadProblemDetailsIntoCache(
  planId: string,
  problemProgress: Record<string, any>
): Promise<void> {
  const plan = getPlanFromCache(planId);
  if (!plan) {
    console.warn(`[Cache] Cannot load problem details - plan ${planId} not in cache`);
    return;
  }

  let loadedCount = 0;
  Object.entries(problemProgress).forEach(([problemId, progress]) => {
    // Only load if we have both problem and code details
    if (progress.problemDetails && progress.codeDetails) {
      // Check if already in cache to avoid overwriting recent changes
      if (!plan.problemDetails[problemId]) {
        plan.problemDetails[problemId] = {
          problem: {
            title: progress.problemDetails.title,
            background: progress.problemDetails.background,
            problemStatement: progress.problemDetails.problemStatement,
            testCases: progress.problemDetails.testCases,
            constraints: progress.problemDetails.constraints,
            requirements: progress.problemDetails.requirements,
            leetcodeUrl: progress.problemDetails.leetcodeUrl,
            problemId: problemId
          },
          codeDetails: {
            boilerplateCode: progress.codeDetails.boilerplateCode,
            defaultUserCode: progress.codeDetails.defaultUserCode,
            functionName: progress.codeDetails.functionName,
            solutionStructureHint: progress.codeDetails.solutionStructureHint,
            language: progress.codeDetails.language
          },
          userCode: progress.code || progress.codeDetails?.defaultUserCode || '',
          lastWorkedAt: progress.lastWorkedAt ? new Date(progress.lastWorkedAt).getTime() : Date.now()
        };
        loadedCount++;
      }
    }
  });

  if (loadedCount > 0) {
    savePlanToCache(plan);
    console.log(`💾 [Cache] Loaded ${loadedCount} problem details into cache for plan ${planId}`);
  }
}

/**
 * Warm up cache with problem details for likely navigation
 * This pre-fetches problem details for in-progress and recently worked problems
 */
export async function warmUpCacheForPlan(planId: string): Promise<void> {
  const plan = getPlanFromCache(planId);
  if (!plan) return;

  // Get list of problems to warm up (in-progress and recent)
  const problemsToWarmUp = new Set<string>();

  // Add in-progress problems
  plan.progress.inProgressProblems.forEach(id => problemsToWarmUp.add(id));

  // Add recently worked problems (last 5)
  const recentProblems = Object.entries(plan.problemDetails)
    .sort((a, b) => b[1].lastWorkedAt - a[1].lastWorkedAt)
    .slice(0, 5)
    .map(([id]) => id);
  recentProblems.forEach(id => problemsToWarmUp.add(id));

  console.log(`🔥 [Cache] Warming up cache for ${problemsToWarmUp.size} problems`);

  // Note: Actual fetching would require async operations
  // This is a placeholder for the warm-up logic
  // In practice, you'd fetch from Firestore here if needed
}

/**
 * Get cache statistics for debugging
 */
export function getCacheStats(): {
  totalPlans: number;
  totalSize: number;
  oldestCache: number;
  newestCache: number;
  problemsCached: number;
} {
  const plans = getAllCachedPlans();
  const totalSize = plans.reduce((sum, plan) => {
    return sum + JSON.stringify(plan).length;
  }, 0);

  const problemsCached = plans.reduce((sum, plan) => {
    return sum + Object.keys(plan.problemDetails || {}).length;
  }, 0);

  return {
    totalPlans: plans.length,
    totalSize,
    oldestCache: Math.min(...plans.map(p => p.cachedAt)),
    newestCache: Math.max(...plans.map(p => p.cachedAt)),
    problemsCached
  };
}
