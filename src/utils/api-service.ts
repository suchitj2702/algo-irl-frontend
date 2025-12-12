/**
 * API Service Layer
 * Handles all API requests to the backend
 */

import { buildApiUrl, API_CONFIG } from '../config/api';
import { TestCase } from '../types';
import { StudyPlanConfig, StudyPlanResponse } from '../types/studyPlan';
import { APIAuthenticationError, APIRateLimitError } from './api-errors';

/**
 * Handle API response errors
 */
async function handleAPIResponse(response: Response) {
  if (response.status === 401) {
    throw new APIAuthenticationError('API request authentication failed. Please refresh the page.');
  }

  if (response.status === 429) {
    throw new APIRateLimitError('Rate limit exceeded. Please try again in a few moments.');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `API Error: ${response.status}`);
  }

  return response.json();
}

/**
 * Execute code
 */
export async function executeCode(
  code: string,
  language: string,
  boilerplateCode: string,
  testCases: TestCase[]
) {
  const payload = {
    code,
    language,
    boilerplateCode,
    testCases,
  };

  const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.EXECUTE_CODE), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload)
  });

  return handleAPIResponse(response);
}

/**
 * Check submission status
 */
export async function checkSubmissionStatus(submissionId: string) {
  const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.EXECUTE_CODE_STATUS, submissionId), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    }
  });

  return handleAPIResponse(response);
}

/**
 * Fetch all companies
 */
export async function fetchCompanies() {
  const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.COMPANIES_LIST), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    }
  });

  return handleAPIResponse(response);
}

/**
 * Fetch all problems (basic info)
 */
export async function fetchAllProblems() {
  const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.PROBLEMS_LIST), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    }
  });

  return handleAPIResponse(response);
}

/**
 * Fetch problem by ID with full details
 */
export async function fetchProblemById(problemId: string, language: string = 'python') {
  const response = await fetch(
    buildApiUrl(API_CONFIG.ENDPOINTS.PROBLEM_BY_ID, `${problemId}?language=${language}`),
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    }
  );

  return handleAPIResponse(response);
}

/**
 * Prepare problem
 */
export async function prepareProblem(
  problemId?: string,
  companyId?: string,
  difficulty?: string,
  isBlind75?: boolean,
  roleFamily?: string
) {
  const payload = {
    ...(problemId && { problemId }),
    ...(companyId && { companyId }),
    ...(difficulty && { difficulty }),
    ...(isBlind75 !== undefined && { isBlind75 }),
    ...(roleFamily && { roleFamily })
  };

  const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.PROBLEM_PREPARE), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload)
  });

  return handleAPIResponse(response);
}

/**
 * Generate study plan
 */
export async function generateStudyPlan(config: StudyPlanConfig): Promise<StudyPlanResponse> {
  const payload = {
    companyId: config.companyId,
    roleFamily: config.roleFamily,
    timeline: config.timeline,
    hoursPerDay: config.hoursPerDay,
    ...(config.difficultyPreference && { difficultyPreference: config.difficultyPreference }),
    ...(config.topicFocus && config.topicFocus.length > 0 && { topicFocus: config.topicFocus })
  };

  // Select endpoint based on dataset type
  const endpoint = config.datasetType === 'blind75'
    ? API_CONFIG.ENDPOINTS.STUDY_PLAN_GENERATE_BLIND75
    : API_CONFIG.ENDPOINTS.STUDY_PLAN_GENERATE;

  const response = await fetch(buildApiUrl(endpoint), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload)
  });

  return handleAPIResponse(response);
}
