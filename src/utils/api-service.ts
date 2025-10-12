import { signedFetch, createSignedHeaders, handleAPIResponse } from './api-signing';
import { buildApiUrl, API_CONFIG } from '../config/api';
import { TestCase } from '../types';
import { StudyPlanConfig, StudyPlanResponse } from '../types/studyPlan';

/**
 * Execute code with signed request
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
  
  const response = await signedFetch(buildApiUrl(API_CONFIG.ENDPOINTS.EXECUTE_CODE), {
    method: 'POST',
    body: payload
  });
  
  return handleAPIResponse(response);
}

/**
 * Check submission status with signed request
 */
export async function checkSubmissionStatus(submissionId: string) {
  // For GET requests, use empty payload since no body
  const headers = await createSignedHeaders({});
  
  const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.EXECUTE_CODE_STATUS, submissionId), {
    method: 'GET',
    headers
  });
  
  return handleAPIResponse(response);
}

/**
 * Fetch all companies with signed request
 */
export async function fetchCompanies() {
  // For GET requests, use empty payload
  const headers = await createSignedHeaders({});

  const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.COMPANIES_LIST), {
    method: 'GET',
    headers
  });

  return handleAPIResponse(response);
}

/**
 * Prepare problem with signed request
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
  
  const response = await signedFetch(buildApiUrl(API_CONFIG.ENDPOINTS.PROBLEM_PREPARE), {
    method: 'POST',
    body: payload
  });
  
  return handleAPIResponse(response);
}

/**
 * Generate study plan with signed request
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

  const response = await signedFetch(buildApiUrl(API_CONFIG.ENDPOINTS.STUDY_PLAN_GENERATE), {
    method: 'POST',
    body: payload
  });

  return handleAPIResponse(response);
}
