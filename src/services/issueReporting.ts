/**
 * Issue Reporting Service
 *
 * Handles API communication for reporting issues to the backend.
 */

import { API_CONFIG, buildApiUrl } from '../config/api';
import { consoleTracker } from '../utils/consoleTracker';
import {
  IssueNotificationType,
  IssueReportPayload,
  IssueReportResponse,
  IssueReportErrorResponse,
} from '../types/issueReporting';
import { secureLog } from '../utils/secureLogger';

/**
 * Custom error class for issue reporting failures
 */
export class IssueReportError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'IssueReportError';
  }
}

/**
 * Report an issue to the backend
 *
 * @param payload - Issue report data
 * @param authToken - User authentication token
 * @returns Promise resolving to the issue ID
 * @throws IssueReportError on failure
 */
export async function reportIssue(
  payload: IssueReportPayload,
  authToken: string
): Promise<string> {
  const url = buildApiUrl(API_CONFIG.ENDPOINTS.ISSUE_REPORT);

  try {
    // Validate payload before sending
    validatePayload(payload);

    secureLog.dev('IssueReporting', 'Submitting issue report', {
      notificationType: payload.notificationType,
      problemId: payload.problemId,
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(payload),
    });

    // Handle non-200 responses
    if (!response.ok) {
      await handleErrorResponse(response);
    }

    // Parse success response
    const data: IssueReportResponse = await response.json();

    if (!data.success || !data.issueId) {
      throw new IssueReportError(
        'Invalid response from server',
        'INVALID_RESPONSE',
        { response: data }
      );
    }

    secureLog.dev('IssueReporting', 'Issue reported successfully', {
      issueId: data.issueId,
    });

    return data.issueId;
  } catch (error) {
    // Re-throw IssueReportError as-is
    if (error instanceof IssueReportError) {
      secureLog.error('IssueReporting', error.message, {
        code: error.code,
        details: error.details,
      });
      throw error;
    }

    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      const networkError = new IssueReportError(
        'Network error. Please check your connection and try again.',
        'NETWORK_ERROR'
      );
      secureLog.error('IssueReporting', networkError.message);
      throw networkError;
    }

    // Handle unknown errors
    const unknownError = new IssueReportError(
      'Failed to report issue. Please try again.',
      'UNKNOWN_ERROR',
      { originalError: error instanceof Error ? error.message : String(error) }
    );
    secureLog.error('IssueReporting', unknownError.message, {
      originalError: error,
    });
    throw unknownError;
  }
}

/**
 * Handle HTTP error responses from the API
 */
async function handleErrorResponse(response: Response): Promise<never> {
  let errorData: IssueReportErrorResponse | null = null;

  try {
    errorData = await response.json();
  } catch {
    // If we can't parse the error response, use status text
    throw new IssueReportError(
      response.statusText || 'Request failed',
      `HTTP_${response.status}`,
      { status: response.status }
    );
  }

  // Extract error message and code
  const message = errorData?.message || 'Request failed';
  const code = errorData?.error || `HTTP_${response.status}`;
  const details = errorData?.details;

  // Create specific error based on status code
  if (response.status === 401) {
    throw new IssueReportError(
      'Please sign in to report issues.',
      'UNAUTHORIZED',
      details
    );
  }

  if (response.status === 429) {
    throw new IssueReportError(
      'Too many reports. Please wait before reporting again.',
      'RATE_LIMIT_EXCEEDED',
      details
    );
  }

  if (response.status === 400) {
    throw new IssueReportError(
      message || 'Invalid request. Please check your input.',
      'VALIDATION_ERROR',
      details
    );
  }

  if (response.status >= 500) {
    throw new IssueReportError(
      'Server error. Please try again later.',
      'SERVER_ERROR',
      { status: response.status, ...details }
    );
  }

  // Generic error for other status codes
  throw new IssueReportError(message, code, { status: response.status, ...details });
}

/**
 * Validate the payload before sending
 */
function validatePayload(payload: IssueReportPayload): void {
  // Validate notification type
  if (!Object.values(IssueNotificationType).includes(payload.notificationType)) {
    throw new IssueReportError(
      'Invalid notification type',
      'INVALID_NOTIFICATION_TYPE',
      { notificationType: payload.notificationType }
    );
  }

  // Validate problem ID
  if (!payload.problemId || typeof payload.problemId !== 'string') {
    throw new IssueReportError(
      'Problem ID is required',
      'MISSING_PROBLEM_ID'
    );
  }

  // Validate description for OTHER_UI_ISSUE
  if (payload.notificationType === IssueNotificationType.OTHER_UI_ISSUE) {
    if (!payload.description || typeof payload.description !== 'string') {
      throw new IssueReportError(
        'Description is required for other issues',
        'MISSING_DESCRIPTION'
      );
    }

    if (payload.description.trim().length < 10) {
      throw new IssueReportError(
        'Description must be at least 10 characters',
        'DESCRIPTION_TOO_SHORT'
      );
    }
  } else {
    // For non-OTHER_UI_ISSUE types, description must be null
    if (payload.description !== null) {
      throw new IssueReportError(
        'Description must be null for this issue type',
        'INVALID_DESCRIPTION'
      );
    }
  }

  // Validate user code
  if (typeof payload.userCode !== 'string') {
    throw new IssueReportError(
      'User code must be a string',
      'INVALID_USER_CODE'
    );
  }

  // Validate console logs
  if (!Array.isArray(payload.consoleLogs)) {
    throw new IssueReportError(
      'Console logs must be an array',
      'INVALID_CONSOLE_LOGS'
    );
  }
}

/**
 * Helper function to create an issue report payload with current console logs
 */
export function createIssuePayload(
  notificationType: IssueNotificationType,
  problemId: string,
  rawPrepareResponse: unknown,
  companyId: string | null,
  roleId: string | null,
  userCode: string,
  description: string | null = null
): IssueReportPayload {
  return {
    notificationType,
    problemId,
    rawPrepareResponse,
    companyId,
    roleId,
    userCode,
    description,
    consoleLogs: consoleTracker.getLogs(),
  };
}
