/**
 * Study Plan Firestore Service
 * Handles all Firestore operations for study plans using backend API
 */

import { auth } from '../config/firebase';
import { buildApiUrl } from '../config/api';
import { Problem, CodeDetails } from '../types';
import {
  StudyPlanConfig,
  StudyPlanResponse,
  CachedStudyPlan,
  StudyPlanRecord,
  adaptStudyPlanFromBackend
} from '../types/studyPlan';

/**
 * Get Firebase ID token for authenticated requests
 */
async function getFirebaseToken(): Promise<string> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Not authenticated. Please sign in first.');
  }

  return await user.getIdToken();
}

/**
 * Make authenticated API call with Firebase token
 */
async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const firebaseToken = await getFirebaseToken();

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${firebaseToken}`,
    ...(options.headers || {})
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Authentication required');
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `API Error: ${response.status}`);
  }

  return response;
}

/**
 * Save generated study plan to Firestore via backend API
 * POST /api/user/study-plans
 */
export async function saveStudyPlanToFirestore(
  config: StudyPlanConfig,
  response: StudyPlanResponse
): Promise<string> {
  const payload = { config, response };

  const res = await authenticatedFetch(buildApiUrl('/api/user/study-plans'), {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  return data.id; // Return the plan ID from backend
}

/**
 * Get all study plans for the current user
 * GET /api/user/study-plans
 */
export async function getStudyPlansFromFirestore(): Promise<CachedStudyPlan[]> {
  const res = await authenticatedFetch(buildApiUrl('/api/user/study-plans'), {
    method: 'GET'
  });

  const result = await res.json();
  // Convert backend records to frontend format
  return result.data.map((record: StudyPlanRecord) => adaptStudyPlanFromBackend(record));
}

/**
 * Get a single study plan by ID
 * Uses the direct backend GET endpoint
 */
export async function getStudyPlanFromFirestore(planId: string): Promise<CachedStudyPlan | null> {
  return getStudyPlanByIdFromFirestore(planId);
}

/**
 * Update study plan progress
 * PATCH /api/user/study-plans/{planId}
 */
export async function updateStudyPlanProgressInFirestore(
  planId: string,
  progress: {
    status?: 'not_started' | 'in_progress' | 'completed' | 'paused';
    completedProblems?: number;
    totalProblems?: number;
    currentDay?: number;
    note?: string;
    lastUpdatedAt?: string;
  }
): Promise<void> {
  await authenticatedFetch(buildApiUrl(`/api/user/study-plans/${planId}`), {
    method: 'PATCH',
    body: JSON.stringify(progress)
  });
}

/**
 * Delete a study plan
 * DELETE /api/user/study-plans/{planId}
 */
export async function deleteStudyPlanFromFirestore(planId: string): Promise<void> {
  await authenticatedFetch(buildApiUrl(`/api/user/study-plans/${planId}`), {
    method: 'DELETE'
  });
}

/**
 * Migration helper: Save existing localStorage plans to Firestore
 * Call this once on first load to migrate user data
 */
export async function migrateLocalStorageToFirestore(localPlans: CachedStudyPlan[]): Promise<{
  migrated: number;
  failed: number;
  errors: Array<{ planId: string; error: string }>;
}> {
  const results = {
    migrated: 0,
    failed: 0,
    errors: [] as Array<{ planId: string; error: string }>
  };

  for (const plan of localPlans) {
    try {
      await saveStudyPlanToFirestore(plan.config, plan.response);
      results.migrated++;
    } catch (error) {
      results.failed++;
      results.errors.push({
        planId: plan.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      console.error(`Migration failed for plan ${plan.id}:`, error);
    }
  }

  return results;
}

/**
 * Get a single study plan by ID (using direct backend endpoint)
 * GET /api/user/study-plans/{planId}
 */
export async function getStudyPlanByIdFromFirestore(planId: string): Promise<CachedStudyPlan | null> {
  try {
    const res = await authenticatedFetch(buildApiUrl(`/api/user/study-plans/${planId}`), {
      method: 'GET'
    });

    if (res.status === 404) {
      return null;
    }

    const record: StudyPlanRecord = await res.json();
    return adaptStudyPlanFromBackend(record);
  } catch (error) {
    console.error(`Failed to fetch study plan ${planId}:`, error);
    return null;
  }
}

/**
 * Update problem progress (code, status, bookmark)
 * PATCH /api/user/study-plans/{planId}
 */
export async function updateProblemProgressInFirestore(
  planId: string,
  problemId: string,
  updates: {
    status?: 'not_started' | 'in_progress' | 'solved';
    code?: string;
    isBookmarked?: boolean;
    attempts?: number;
  }
): Promise<void> {
  // Build the problemProgress update object
  const problemProgress: Record<string, any> = {};
  problemProgress[problemId] = {
    ...updates,
    lastWorkedAt: new Date().toISOString()
  };

  await authenticatedFetch(buildApiUrl(`/api/user/study-plans/${planId}`), {
    method: 'PATCH',
    body: JSON.stringify({ problemProgress })
  });
}

/**
 * Save problem code only
 */
export async function saveProblemCode(
  planId: string,
  problemId: string,
  code: string
): Promise<void> {
  await updateProblemProgressInFirestore(planId, problemId, { code });
}

/**
 * Set problem status (in_progress, solved, not_started)
 */
export async function setProblemStatus(
  planId: string,
  problemId: string,
  status: 'not_started' | 'in_progress' | 'solved'
): Promise<void> {
  await updateProblemProgressInFirestore(planId, problemId, { status });
}

/**
 * Toggle problem bookmark
 */
export async function toggleProblemBookmark(
  planId: string,
  problemId: string,
  isBookmarked: boolean
): Promise<void> {
  await updateProblemProgressInFirestore(planId, problemId, { isBookmarked });
}

/**
 * Update current day
 */
export async function updateCurrentDay(
  planId: string,
  day: number
): Promise<void> {
  await updateStudyPlanProgressInFirestore(planId, { currentDay: day });
}

/**
 * Find duplicate study plan based on config match
 */
export async function findDuplicateStudyPlanInFirestore(
  config: StudyPlanConfig
): Promise<CachedStudyPlan | null> {
  const plans = await getStudyPlansFromFirestore();

  return plans.find(plan => {
    const c = plan.config;

    if (c.companyId !== config.companyId) return false;
    if (c.roleFamily !== config.roleFamily) return false;
    if (c.timeline !== config.timeline) return false;
    if (c.hoursPerDay !== config.hoursPerDay) return false;

    const configDiff = config.difficultyPreference;
    const planDiff = c.difficultyPreference;

    if (configDiff && planDiff) {
      if (configDiff.easy !== planDiff.easy) return false;
      if (configDiff.medium !== planDiff.medium) return false;
      if (configDiff.hard !== planDiff.hard) return false;
    } else if (configDiff || planDiff) {
      return false;
    }

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
 * Calculate completion percentage from plan
 */
export function getCompletionPercentageFromPlan(plan: CachedStudyPlan): number {
  const totalProblems = plan.response.studyPlan.totalProblems;
  const completedCount = plan.progress.completedProblems.length;

  if (totalProblems === 0) return 0;

  return Math.round((completedCount / totalProblems) * 100);
}

/**
 * Save complete problem data (details + code) to Firestore
 * This stores the full problem details within the study plan's problemProgress
 */
export async function saveProblemWithDetails(
  planId: string,
  problemId: string,
  problemDetails: Problem,
  codeDetails: CodeDetails,
  status: 'not_started' | 'in_progress' | 'solved' = 'in_progress'
): Promise<void> {
  const problemProgress: Record<string, any> = {};
  problemProgress[problemId] = {
    status,
    code: codeDetails.defaultUserCode || codeDetails.boilerplateCode || '',
    isBookmarked: false,
    lastWorkedAt: new Date().toISOString(),
    attempts: 0,
    // Store complete problem details
    problemDetails: {
      title: problemDetails.title,
      background: problemDetails.background,
      problemStatement: problemDetails.problemStatement,
      testCases: problemDetails.testCases,
      constraints: problemDetails.constraints,
      requirements: problemDetails.requirements,
      leetcodeUrl: problemDetails.leetcodeUrl
    },
    // Store complete code details
    codeDetails: {
      boilerplateCode: codeDetails.boilerplateCode,
      defaultUserCode: codeDetails.defaultUserCode,
      functionName: codeDetails.functionName,
      solutionStructureHint: codeDetails.solutionStructureHint,
      language: codeDetails.language
    }
  };

  await authenticatedFetch(buildApiUrl(`/api/user/study-plans/${planId}`), {
    method: 'PATCH',
    body: JSON.stringify({ problemProgress })
  });
}

/**
 * Get problem details from Firestore
 * Returns the full problem and code details stored in problemProgress
 */
export async function getProblemDetailsFromFirestore(
  planId: string,
  problemId: string
): Promise<{ problem: Problem; codeDetails: CodeDetails; code: string } | null> {
  try {
    const plan = await getStudyPlanByIdFromFirestore(planId);
    if (!plan) return null;

    // Get the backend record to access problemProgress
    const res = await authenticatedFetch(buildApiUrl(`/api/user/study-plans/${planId}`), {
      method: 'GET'
    });

    if (res.status === 404) {
      return null;
    }

    const record: StudyPlanRecord = await res.json();
    const problemProgress = record.progress?.problemProgress?.[problemId];

    if (!problemProgress || !problemProgress.problemDetails || !problemProgress.codeDetails) {
      return null;
    }

    // Reconstruct Problem object
    const problem: Problem = {
      title: problemProgress.problemDetails.title,
      background: problemProgress.problemDetails.background,
      problemStatement: problemProgress.problemDetails.problemStatement,
      testCases: problemProgress.problemDetails.testCases,
      constraints: problemProgress.problemDetails.constraints,
      requirements: problemProgress.problemDetails.requirements,
      leetcodeUrl: problemProgress.problemDetails.leetcodeUrl,
      problemId: problemId
    };

    // Reconstruct CodeDetails object
    const codeDetails: CodeDetails = {
      boilerplateCode: problemProgress.codeDetails.boilerplateCode,
      defaultUserCode: problemProgress.codeDetails.defaultUserCode,
      functionName: problemProgress.codeDetails.functionName,
      solutionStructureHint: problemProgress.codeDetails.solutionStructureHint,
      language: problemProgress.codeDetails.language
    };

    // Get the user's saved code (or fall back to default)
    const code = problemProgress.code || codeDetails.defaultUserCode;

    return { problem, codeDetails, code };
  } catch (error) {
    console.error(`Failed to fetch problem details for ${problemId}:`, error);
    return null;
  }
}
