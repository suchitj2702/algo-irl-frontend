import { API_CONFIG, buildApiUrl } from '../config/api';
import { TestCase } from '../types';

// Define interface for individual test results from execution
export interface ExecutionTestResult {
  testCase: TestCase; // The original test case
  passed: boolean;
  actualOutput: any;
  stdout?: string | null;
  stderr?: string | null;
  compileOutput?: string | null;
  status: string; // e.g., "Accepted", "Wrong Answer", "Time Limit Exceeded"
  judge0StatusId?: number; // if using Judge0 status IDs
  time?: number | null; // execution time in seconds or ms
  memory?: number | null; // memory usage in KB or MB
  error?: string | null; // Specific error for this test case
}

// Interface for overall execution results
export interface ExecutionResults {
  passed: boolean; // Overall pass status (e.g., all test cases passed)
  testCasesPassed: number;
  testCasesTotal: number;
  executionTime: number | null; // Overall execution time for the batch
  memoryUsage: number | null; // Peak memory usage
  error?: string | null; // General error message for the submission (e.g., compilation error)
  testCaseResults: ExecutionTestResult[];
  submissionId?: string; // To store the submission ID
}

interface PollArgs {
  submissionId: string;
  onResults: (results: ExecutionResults) => void;
  onError: (errorMsg: string, submissionId?: string) => void;
  onLoadingChange: (isLoading: boolean) => void;
  testCasesTotal: number; // Needed to construct error result if polling fails catastrophically
}

// Function to poll for execution results
const pollForResults = async ({
  submissionId,
  onResults,
  onError,
  onLoadingChange,
  testCasesTotal,
}: PollArgs) => {
  try {
    const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.EXECUTE_CODE_STATUS, submissionId));
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to fetch submission status and parse error JSON.' }));
      throw new Error(errorData.error || 'Failed to fetch submission status');
    }
    
    const data = await response.json();
    
    if (data.status === 'pending' || data.status === 'processing') {
      setTimeout(() => pollForResults({ submissionId, onResults, onError, onLoadingChange, testCasesTotal }), 1000);
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
      onResults(errorResult); // Still use onResults to display partial data if available
      onLoadingChange(false);
    }
  } catch (error) {
    // Only log errors in development to avoid exposing sensitive information
    if (import.meta.env.DEV) {
      console.error('Status polling error:', error);
    }
    const errorMsg = error instanceof Error ? error.message : 'An unknown error occurred during polling';
    onError(errorMsg, submissionId);
    onLoadingChange(false);
  }
};

interface ExecuteCodeParams {
  code: string;
  language: string;
  boilerplateCode: string;
  testCases: TestCase[];
  onResults: (results: ExecutionResults) => void;
  onError: (errorMsg: string, submissionId?: string) => void;
  onLoadingChange: (isLoading: boolean) => void;
}

export const executeCodeAndPoll = async ({
  code,
  language,
  boilerplateCode,
  testCases,
  onResults,
  onError,
  onLoadingChange,
}: ExecuteCodeParams): Promise<void> => {
  onLoadingChange(true);
  try {
    const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.EXECUTE_CODE), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        language,
        boilerplateCode,
        testCases,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to execute code and parse error JSON.' }));
      throw new Error(errorData.error || 'Failed to execute code');
    }
    
    const data = await response.json();
    if (!data.submissionId) {
      throw new Error('No submission ID received from execute-code API.');
    }
    
    // Start polling for results
    pollForResults({
      submissionId: data.submissionId,
      onResults,
      onError,
      onLoadingChange,
      testCasesTotal: testCases.length,
    });
  } catch (error) {
    console.error('Submission error:', error);
    const errorMsg = error instanceof Error ? error.message : 'An unknown error occurred during submission';
    onError(errorMsg);
    onLoadingChange(false);
  }
}; 