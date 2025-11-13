/**
 * Issue Reporting Type Definitions
 *
 * Defines all types and interfaces for the issue reporting feature.
 */

import { ConsoleLogEntry } from '../utils/consoleTracker';

/**
 * Types of issues that can be reported
 */
export enum IssueNotificationType {
  TRANSFORMATION_QUALITY = 'TRANSFORMATION_QUALITY',
  TEST_CASE_FAILURE = 'TEST_CASE_FAILURE',
  FORMATTING_ISSUE = 'FORMATTING_ISSUE',
  EXECUTION_FAILURE = 'EXECUTION_FAILURE',
  OTHER_UI_ISSUE = 'OTHER_UI_ISSUE',
}

/**
 * Human-readable labels for each issue type
 */
export const IssueTypeLabels: Record<IssueNotificationType, string> = {
  [IssueNotificationType.TRANSFORMATION_QUALITY]: "Transformation doesn't match context",
  [IssueNotificationType.TEST_CASE_FAILURE]: "Tests fail but pass on LeetCode",
  [IssueNotificationType.FORMATTING_ISSUE]: "Formatting looks off",
  [IssueNotificationType.EXECUTION_FAILURE]: "Code doesn't submit/run at all",
  [IssueNotificationType.OTHER_UI_ISSUE]: "Other issue",
};

/**
 * Payload sent to the backend API for issue reporting
 */
export interface IssueReportPayload {
  notificationType: IssueNotificationType;
  problemId: string; // LeetCode slug
  rawPrepareResponse: unknown | null; // Full prepare API response (null if loaded from cache)
  companyId: string | null;
  roleId: string | null;
  userCode: string; // Current code from editor
  description: string | null; // Required for OTHER_UI_ISSUE, null otherwise
  consoleLogs: ConsoleLogEntry[]; // Last 10 console logs
}

/**
 * Response from the backend API after submitting an issue
 */
export interface IssueReportResponse {
  success: boolean;
  issueId: string;
}

/**
 * Error response from the backend API
 */
export interface IssueReportErrorResponse {
  success: false;
  error: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Props for the IssueReportMenu component
 */
export interface IssueReportMenuProps {
  isOpen: boolean;
  onClose: () => void;
  problemId: string;
  rawPrepareResponse: unknown | null;
  companyId: string | null;
  roleId: string | null;
  userCode: string;
  isStudyPlanPage: boolean; // true if on study plan page, false if on Blind75
  onRegenerate?: () => void; // Only available on study plan page
}

/**
 * Props for the IssueDescriptionDialog component
 */
export interface IssueDescriptionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (description: string) => void;
  isSubmitting: boolean;
}
