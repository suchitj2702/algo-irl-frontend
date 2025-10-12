// Environment-based API Configuration
const getBaseUrl = (): string => {
  // In development mode, use relative URLs to leverage Vite's proxy
  if (import.meta.env.DEV) {
    return import.meta.env.VITE_API_URL || '';
  }
  
  // Production URL - use environment variable with fallback
  return import.meta.env.VITE_PRODUCTION_API_URL;
};

export const API_CONFIG = {
  BASE_URL: getBaseUrl(),
  ENDPOINTS: {
    COMPANIES_LIST: '/api/companies',
    PROBLEM_PREPARE: '/api/problem/prepare',
    EXECUTE_CODE: '/api/execute-code',
    EXECUTE_CODE_STATUS: '/api/execute-code/status',
    STUDY_PLAN_GENERATE: '/api/study-plan/generate',
  }
};

// Helper function to build full API URLs
export const buildApiUrl = (endpoint: string, params?: string): string => {
  const baseUrl = API_CONFIG.BASE_URL;
  const fullEndpoint = params ? `${endpoint}/${params}` : endpoint;
  return `${baseUrl}${fullEndpoint}`;
}; 