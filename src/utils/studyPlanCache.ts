/**
 * @deprecated This file uses localStorage and has been replaced with Firestore.
 *
 * ⚠️ DEPRECATED - DO NOT USE FOR NEW CODE
 *
 * This utility manages study plans in localStorage and is being phased out.
 * All new code should use `src/services/studyPlanFirestoreService.ts` instead.
 *
 * Migration path:
 * - saveStudyPlan() → saveStudyPlanToFirestore()
 * - getAllStudyPlans() → getStudyPlansFromFirestore()
 * - getStudyPlan() → getStudyPlanFromFirestore()
 * - updateStudyPlanProgress() → updateStudyPlanProgressInFirestore()
 * - deleteStudyPlan() → deleteStudyPlanFromFirestore()
 *
 * This file is kept for backwards compatibility and potential migration needs.
 */

console.warn(
  '[DEPRECATED] studyPlanCache.ts is deprecated. Use studyPlanFirestoreService.ts instead.'
);

// Study Plan Cache Utility
// Manages localStorage caching of study plans and progress tracking

import { CachedStudyPlan, StudyPlanConfig, StudyPlanResponse } from '../types/studyPlan';
import { clearProblemsForPlan, buildProblemCacheKey, parseProblemCacheKey } from './cache';

const STORAGE_KEY = 'algoirl_study_plans';

const normalizeProgress = (plan: CachedStudyPlan): CachedStudyPlan => {
  if (!plan.progress) {
    plan.progress = {
      completedProblems: [],
      bookmarkedProblems: [],
      inProgressProblems: [],
      currentDay: 1,
      lastUpdated: Date.now()
    };
    return plan;
  }

  plan.progress.completedProblems = plan.progress.completedProblems || [];
  plan.progress.bookmarkedProblems = plan.progress.bookmarkedProblems || [];
  plan.progress.inProgressProblems = plan.progress.inProgressProblems || [];
  plan.progress.currentDay = plan.progress.currentDay || 1;
  plan.progress.lastUpdated = plan.progress.lastUpdated || Date.now();
  return plan;
};

/**
 * Generate a unique ID for a study plan based on config
 */
export function generateStudyPlanId(config: StudyPlanConfig): string {
  const timestamp = Date.now();
  const configHash = `${config.companyId}_${config.roleFamily}_${config.timeline}d`;
  return `${configHash}_${timestamp}`;
}

export function buildPlanProblemCacheKey(
  planId: string,
  problemId: string,
  companyId: string
): string {
  return buildProblemCacheKey(problemId, companyId, planId);
}

export function parsePlanProblemCacheKey(key: string) {
  const parsed = parseProblemCacheKey(key);
  return {
    planId: parsed.planId,
    problemId: parsed.baseProblemId,
    companyId: parsed.companyId
  };
}

/**
 * Get all cached study plans from localStorage
 */
export function getAllStudyPlans(): CachedStudyPlan[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];

    const plans = JSON.parse(data) as CachedStudyPlan[];
    if (!Array.isArray(plans)) return [];

    return plans.map(plan => normalizeProgress(plan));
  } catch (error) {
    console.error('Error reading study plans from cache:', error);
    return [];
  }
}

/**
 * Get a specific study plan by ID
 */
export function getStudyPlan(id: string): CachedStudyPlan | null {
  const plans = getAllStudyPlans();
  return plans.find(plan => plan.id === id) || null;
}

/**
 * Save a new study plan to cache
 */
export function saveStudyPlan(
  id: string,
  config: StudyPlanConfig,
  response: StudyPlanResponse
): void {
  try {
    const plans = getAllStudyPlans();

    const newPlan: CachedStudyPlan = {
      id,
      config,
      response,
      progress: {
        completedProblems: [],
        bookmarkedProblems: [],
        inProgressProblems: [],
        currentDay: 1,
        lastUpdated: Date.now()
      },
      createdAt: Date.now()
    };

    // Add new plan to the beginning of the array
    plans.unshift(newPlan);

    // Keep only the last 10 study plans to avoid localStorage bloat
    const trimmedPlans = plans.slice(0, 10);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedPlans));
  } catch (error) {
    console.error('Error saving study plan to cache:', error);
  }
}

/**
 * Update progress for a study plan
 */
export function updateStudyPlanProgress(
  planId: string,
  problemId: string,
  completed: boolean
): CachedStudyPlan['progress'] | null {
  try {
    const plans = getAllStudyPlans();
    const planIndex = plans.findIndex(p => p.id === planId);

    if (planIndex === -1) {
      console.warn(`Study plan ${planId} not found`);
      return null;
    }

    const plan = normalizeProgress(plans[planIndex]);

    if (completed) {
      // Add to completed problems if not already there
      if (!plan.progress.completedProblems.includes(problemId)) {
        plan.progress.completedProblems.push(problemId);
      }
      plan.progress.inProgressProblems = plan.progress.inProgressProblems.filter(id => id !== problemId);
    } else {
      // Remove from completed problems
      plan.progress.completedProblems = plan.progress.completedProblems.filter(
        id => id !== problemId
      );
    }

    plan.progress.lastUpdated = Date.now();
    plans[planIndex] = plan;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
    return plan.progress;
  } catch (error) {
    console.error('Error updating study plan progress:', error);
    return null;
  }
}

/**
 * Toggle bookmark status for a study plan problem. Returns the new bookmark state.
 */
export function toggleStudyPlanBookmark(
  planId: string,
  problemId: string,
  shouldBookmark?: boolean
): boolean {
  try {
    const plans = getAllStudyPlans();
    const planIndex = plans.findIndex(p => p.id === planId);

    if (planIndex === -1) {
      console.warn(`Study plan ${planId} not found`);
      return false;
    }

    const plan = normalizeProgress(plans[planIndex]);
    const isCurrentlyBookmarked = plan.progress.bookmarkedProblems.includes(problemId);
    const nextState = typeof shouldBookmark === 'boolean' ? shouldBookmark : !isCurrentlyBookmarked;

    if (nextState && !isCurrentlyBookmarked) {
      plan.progress.bookmarkedProblems.push(problemId);
    } else if (!nextState && isCurrentlyBookmarked) {
      plan.progress.bookmarkedProblems = plan.progress.bookmarkedProblems.filter(id => id !== problemId);
    }

    plan.progress.lastUpdated = Date.now();
    plans[planIndex] = plan;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));

    return nextState;
  } catch (error) {
    console.error('Error toggling study plan bookmark:', error);
    return false;
  }
}

export function getBookmarkedProblems(planId: string): string[] {
  const plan = getStudyPlan(planId);
  if (!plan) return [];
  return plan.progress.bookmarkedProblems;
}

export function isProblemBookmarked(planId: string, problemId: string): boolean {
  const plan = getStudyPlan(planId);
  if (!plan) return false;
  return plan.progress.bookmarkedProblems.includes(problemId);
}

export function setStudyPlanProblemInProgress(
  planId: string,
  problemId: string,
  inProgress: boolean
): CachedStudyPlan['progress'] | null {
  try {
    const plans = getAllStudyPlans();
    const planIndex = plans.findIndex(p => p.id === planId);

    if (planIndex === -1) {
      console.warn(`Study plan ${planId} not found for in-progress tracking`);
      return null;
    }

    const plan = normalizeProgress(plans[planIndex]);
    const alreadyInProgress = plan.progress.inProgressProblems.includes(problemId);

    if (inProgress && !alreadyInProgress) {
      plan.progress.inProgressProblems.push(problemId);
      // Remove from completed if we're re-opening the problem
      if (plan.progress.completedProblems.includes(problemId)) {
        plan.progress.completedProblems = plan.progress.completedProblems.filter(id => id !== problemId);
      }
    } else if (!inProgress && alreadyInProgress) {
      plan.progress.inProgressProblems = plan.progress.inProgressProblems.filter(id => id !== problemId);
    }

    plan.progress.lastUpdated = Date.now();
    plans[planIndex] = plan;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
    return plan.progress;
  } catch (error) {
    console.error('Error updating in-progress status for study plan:', error);
    return null;
  }
}

/**
 * Update current day for a study plan
 */
export function updateCurrentDay(planId: string, day: number): void {
  try {
    const plans = getAllStudyPlans();
    const planIndex = plans.findIndex(p => p.id === planId);

    if (planIndex === -1) {
      console.warn(`Study plan ${planId} not found`);
      return;
    }

    const plan = normalizeProgress(plans[planIndex]);
    plan.progress.currentDay = day;
    plan.progress.lastUpdated = Date.now();
    plans[planIndex] = plan;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
  } catch (error) {
    console.error('Error updating current day:', error);
  }
}

/**
 * Delete a study plan from cache
 */
export function deleteStudyPlan(planId: string): void {
  try {
    const plans = getAllStudyPlans();
    const filteredPlans = plans.filter(p => p.id !== planId);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredPlans));
    clearProblemsForPlan(planId);
  } catch (error) {
    console.error('Error deleting study plan:', error);
  }
}

/**
 * Check if a problem is completed in a study plan
 */
export function isProblemCompleted(planId: string, problemId: string): boolean {
  const plan = getStudyPlan(planId);
  if (!plan) return false;

  return plan.progress.completedProblems.includes(problemId);
}

/**
 * Get completion percentage for a study plan
 */
export function getCompletionPercentage(planId: string): number {
  const plan = getStudyPlan(planId);
  if (!plan) return 0;

  const totalProblems = plan.response.studyPlan.totalProblems;
  const completedCount = plan.progress.completedProblems.length;

  if (totalProblems === 0) return 0;

  return Math.round((completedCount / totalProblems) * 100);
}

/**
 * Find a duplicate study plan based on exact config match
 * Returns the duplicate plan if found, null otherwise
 */
export function findDuplicateStudyPlan(config: StudyPlanConfig): CachedStudyPlan | null {
  const plans = getAllStudyPlans();

  return plans.find(plan => {
    const c = plan.config;

    // Check basic config parameters
    if (c.companyId !== config.companyId) return false;
    if (c.roleFamily !== config.roleFamily) return false;
    if (c.timeline !== config.timeline) return false;
    if (c.hoursPerDay !== config.hoursPerDay) return false;

    // Check difficulty preferences
    const configDiff = config.difficultyPreference;
    const planDiff = c.difficultyPreference;

    if (configDiff && planDiff) {
      if (configDiff.easy !== planDiff.easy) return false;
      if (configDiff.medium !== planDiff.medium) return false;
      if (configDiff.hard !== planDiff.hard) return false;
    } else if (configDiff || planDiff) {
      return false; // One has difficulty preference, the other doesn't
    }

    // Check topic focus (order doesn't matter)
    const configTopics = config.topicFocus || [];
    const planTopics = c.topicFocus || [];

    if (configTopics.length !== planTopics.length) return false;

    const sortedConfigTopics = [...configTopics].sort();
    const sortedPlanTopics = [...planTopics].sort();

    for (let i = 0; i < sortedConfigTopics.length; i++) {
      if (sortedConfigTopics[i] !== sortedPlanTopics[i]) return false;
    }

    return true;
  }) || null;
}

/**
 * Update an existing study plan (replaces response, preserves or resets progress based on preference)
 */
export function updateStudyPlan(
  planId: string,
  response: StudyPlanResponse,
  preserveProgress: boolean = false
): void {
  try {
    const plans = getAllStudyPlans();
    const planIndex = plans.findIndex(p => p.id === planId);

    if (planIndex === -1) {
      console.warn(`Study plan ${planId} not found`);
      return;
    }

    // Update the response
    plans[planIndex].response = response;

    // Reset or preserve progress
  if (!preserveProgress) {
    plans[planIndex].progress = {
      completedProblems: [],
      bookmarkedProblems: [],
      inProgressProblems: [],
      currentDay: 1,
      lastUpdated: Date.now()
    };
    clearProblemsForPlan(planId);
  } else {
      const normalized = normalizeProgress(plans[planIndex]);
      normalized.progress.lastUpdated = Date.now();
      plans[planIndex] = normalized;
    }

    if (!plans[planIndex].progress.bookmarkedProblems) {
      plans[planIndex].progress.bookmarkedProblems = [];
    }

    // Update createdAt to reflect regeneration
    plans[planIndex].createdAt = Date.now();

    localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
  } catch (error) {
    console.error('Error updating study plan:', error);
  }
}

/**
 * Clear all study plans (for debugging/testing)
 */
export function clearAllStudyPlans(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing study plans:', error);
  }
}
