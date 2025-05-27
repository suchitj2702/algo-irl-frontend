// API Configuration
export const API_CONFIG = {
  BASE_URL: 'https://algo-irl.vercel.app',
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