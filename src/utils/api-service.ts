import { signedFetch, createSignedHeaders, handleAPIResponse } from './api-signing';
import { buildApiUrl, API_CONFIG } from '../config/api';
import { TestCase } from '../types';

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
 * Initialize companies with signed request
 */
export async function initializeCompanies() {
  // For GET requests, use empty payload
  const headers = await createSignedHeaders({});
  
  const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.COMPANIES_INITIALIZE), {
    method: 'GET',
    headers
  });
  
  return handleAPIResponse(response);
}

/**
 * Create custom company with signed request
 */
export async function createCustomCompany(companyName: string) {
  const payload = { companyName };
  
  const response = await signedFetch(buildApiUrl(API_CONFIG.ENDPOINTS.COMPANIES_INITIALIZE), {
    method: 'POST',
    body: payload
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
  isBlind75?: boolean
) {
  const payload = {
    ...(problemId && { problemId }),
    ...(companyId && { companyId }),
    ...(difficulty && { difficulty }),
    ...(isBlind75 !== undefined && { isBlind75 })
  };
  
  const response = await signedFetch(buildApiUrl(API_CONFIG.ENDPOINTS.PROBLEM_PREPARE), {
    method: 'POST',
    body: payload
  });
  
  return handleAPIResponse(response);
} 