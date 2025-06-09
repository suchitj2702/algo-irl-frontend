// Environment-based API Configuration
const getBaseUrl = (): string => {
  // In development mode, use relative URLs to leverage Vite's proxy
  if (import.meta.env.DEV) {
    return '';
  }
  
  // Production URL
  return 'https://algo-irl.vercel.app';
};

export const API_CONFIG = {
  BASE_URL: getBaseUrl(),
  ENDPOINTS: {
    COMPANIES_INITIALIZE: '/api/companies/initialize',
    PROBLEM_PREPARE: '/api/problem/prepare',
    EXECUTE_CODE: '/api/execute-code',
    EXECUTE_CODE_STATUS: '/api/execute-code/status',
  }
};

// Helper function to build full API URLs
export const buildApiUrl = (endpoint: string, params?: string): string => {
  const baseUrl = API_CONFIG.BASE_URL;
  const fullEndpoint = params ? `${endpoint}/${params}` : endpoint;
  return `${baseUrl}${fullEndpoint}`;
}; 