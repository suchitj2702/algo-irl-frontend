import { SecureApiClient } from './security';
import { buildApiUrl, API_CONFIG } from '../config/api';
import { TestCase, ExecutionResults, ExecutionTestResult } from './codeExecution';

const secureApi = new SecureApiClient();

interface PollArgs {
  submissionId: string;
  onResults: (results: ExecutionResults) => void;
  onError: (errorMsg: string, submissionId?: string) => void;
  onLoadingChange: (isLoading: boolean) => void;
  testCasesTotal: number;
}

interface ApiResponse {
  status: string;
  results?: {
    passed?: boolean;
    testCasesPassed?: number;
    testCasesTotal?: number;
    executionTime?: number;
    memoryUsage?: number;
    testResults?: ExecutionTestResult[];
  };
  error?: string;
}

interface SubmissionResponse {
  submissionId: string;
}

// Secure function to poll for execution results
const securePollingForResults = async ({
  submissionId,
  onResults,
  onError,
  onLoadingChange,
  testCasesTotal,
}: PollArgs) => {
  try {
    const data = await secureApi.get<ApiResponse>(buildApiUrl(API_CONFIG.ENDPOINTS.EXECUTE_CODE_STATUS, submissionId));
    
    if (data.status === 'pending' || data.status === 'processing') {
      setTimeout(() => securePollingForResults({ submissionId, onResults, onError, onLoadingChange, testCasesTotal }), 1000);
      return;
    }
    
    if (data.status === 'completed') {
      const results: ExecutionResults = {
        passed: data.results?.passed || false,
        testCasesPassed: data.results?.testCasesPassed || 0,
        testCasesTotal: data.results?.testCasesTotal || 0,
        executionTime: data.results?.executionTime || null,
        memoryUsage: data.results?.memoryUsage || null,
        testCaseResults: data.results?.testResults || [],
        submissionId,
      };
      onResults(results);
      onLoadingChange(false);
      return;
    }
    
    if (data.status === 'error') {
      const errorResult: ExecutionResults = {
        passed: false,
        testCasesPassed: 0,
        testCasesTotal: data.results?.testCasesTotal || testCasesTotal,
        executionTime: null,
        memoryUsage: null,
        error: data.error || 'Execution failed',
        testCaseResults: data.results?.testResults || [],
        submissionId,
      };
      onResults(errorResult);
      onLoadingChange(false);
    }
  } catch (error) {
    console.error('Secure status polling error:', error);
    const errorMsg = error instanceof Error ? error.message : 'An unknown error occurred during polling';
    onError(errorMsg, submissionId);
    onLoadingChange(false);
  }
};

interface SecureExecuteCodeParams {
  code: string;
  language: string;
  boilerplateCode: string;
  testCases: TestCase[];
  onResults: (results: ExecutionResults) => void;
  onError: (errorMsg: string, submissionId?: string) => void;
  onLoadingChange: (isLoading: boolean) => void;
}

export const secureExecuteCodeAndPoll = async ({
  code,
  language,
  boilerplateCode,
  testCases,
  onResults,
  onError,
  onLoadingChange,
}: SecureExecuteCodeParams): Promise<void> => {
  onLoadingChange(true);
  try {
    // Use secure API client with signature for code execution
    const data = await secureApi.post<SubmissionResponse>(
      buildApiUrl(API_CONFIG.ENDPOINTS.EXECUTE_CODE),
      {
        code,
        language,
        boilerplateCode,
        testCases,
      },
      { signed: true } // Sign this request as it's a sensitive operation
    );
    
    if (!data.submissionId) {
      throw new Error('No submission ID received from secure execute-code API.');
    }
    
    // Start secure polling for results
    securePollingForResults({
      submissionId: data.submissionId,
      onResults,
      onError,
      onLoadingChange,
      testCasesTotal: testCases.length,
    });
  } catch (error) {
    console.error('Secure submission error:', error);
    let errorMsg = 'An unknown error occurred during submission';
    
    if (error instanceof Error) {
      errorMsg = error.message;
      
      // Handle rate limit errors with user-friendly messages
      if (error.message.includes('Rate limit')) {
        errorMsg = 'You\'re submitting too quickly. Please wait a moment and try again.';
      } else if (error.message.includes('API error')) {
        errorMsg = 'Failed to execute code. Please try again.';
      }
    }
    
    onError(errorMsg);
    onLoadingChange(false);
  }
}; 