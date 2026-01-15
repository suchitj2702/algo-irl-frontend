import React, { useState } from 'react';
import {
  AlertCircle,
  FileX,
  LayoutDashboard,
  Code2,
  Bug,
  X,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  IssueNotificationType,
  IssueTypeLabels,
  IssueReportMenuProps,
} from '../types/issueReporting';
import { IssueDescriptionDialog } from './IssueDescriptionDialog';
import { reportIssue, createIssuePayload, IssueReportError } from '../services/issueReporting';
import { useAuth } from '../contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from './ui/dialog';

// Icons for each issue type
const IssueTypeIcons: Record<IssueNotificationType, React.ComponentType<{ className?: string }>> = {
  [IssueNotificationType.TRANSFORMATION_QUALITY]: AlertCircle,
  [IssueNotificationType.TEST_CASE_FAILURE]: Bug,
  [IssueNotificationType.FORMATTING_ISSUE]: LayoutDashboard,
  [IssueNotificationType.EXECUTION_FAILURE]: Code2,
  [IssueNotificationType.OTHER_UI_ISSUE]: FileX,
};

export function IssueReportMenu({
  isOpen,
  onClose,
  problemId,
  rawPrepareResponse,
  companyId,
  roleId,
  userCode,
  isStudyPlanPage,
  onRegenerate,
}: IssueReportMenuProps) {
  const { getIdToken } = useAuth();
  const [loadingType, setLoadingType] = useState<IssueNotificationType | null>(null);
  const [showDescriptionDialog, setShowDescriptionDialog] = useState(false);
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);

  // Handle reporting an issue (direct API call)
  const handleReportIssue = async (
    notificationType: IssueNotificationType,
    description: string | null = null
  ) => {
    try {
      setLoadingType(notificationType);

      // Get auth token
      const token = await getIdToken();
      if (!token) {
        toast.error('Please sign in to report issues.');
        return;
      }

      // Create payload
      const payload = createIssuePayload(
        notificationType,
        problemId,
        rawPrepareResponse,
        companyId,
        roleId,
        userCode,
        description
      );

      // Submit to backend
      await reportIssue(payload, token);

      // Success!
      toast.success("Issue reported successfully. Thanks for the feedback. We'll look into it!");
      onClose();
    } catch (error) {
      // Handle specific error types
      if (error instanceof IssueReportError) {
        switch (error.code) {
          case 'UNAUTHORIZED':
            toast.error('Please sign in to report issues.');
            break;
          case 'RATE_LIMIT_EXCEEDED':
            toast.error('Too many reports. Please wait before reporting again.');
            break;
          case 'VALIDATION_ERROR':
            toast.error(error.message);
            break;
          case 'NETWORK_ERROR':
            toast.error('Network error. Please check your connection and try again.');
            break;
          default:
            toast.error('Failed to report issue. Please try again.');
        }
      } else {
        toast.error('Failed to report issue. Please try again.');
      }
    } finally {
      setLoadingType(null);
    }
  };

  // Handle transformation quality issue (special flow for study plan)
  const handleTransformationQuality = () => {
    if (isStudyPlanPage && onRegenerate) {
      // Show regenerate dialog on study plan page
      setShowRegenerateDialog(true);
    } else {
      // Direct API call on Blind75 page
      handleReportIssue(IssueNotificationType.TRANSFORMATION_QUALITY);
    }
  };

  // Handle "Other issue" type (show description dialog)
  const handleOtherIssue = () => {
    setShowDescriptionDialog(true);
  };

  // Handle description submission
  const handleDescriptionSubmit = (description: string) => {
    handleReportIssue(IssueNotificationType.OTHER_UI_ISSUE, description);
    setShowDescriptionDialog(false);
  };

  // Handle regenerate dialog actions
  const handleRegenerateDialogAction = (action: 'regenerate' | 'report') => {
    setShowRegenerateDialog(false);
    if (action === 'regenerate' && onRegenerate) {
      onRegenerate();
      onClose();
    } else {
      handleReportIssue(IssueNotificationType.TRANSFORMATION_QUALITY);
    }
  };

  // Issue type configurations
  const issueTypes: Array<{
    type: IssueNotificationType;
    onClick: () => void;
  }> = [
    {
      type: IssueNotificationType.TRANSFORMATION_QUALITY,
      onClick: handleTransformationQuality,
    },
    {
      type: IssueNotificationType.TEST_CASE_FAILURE,
      onClick: () => handleReportIssue(IssueNotificationType.TEST_CASE_FAILURE),
    },
    {
      type: IssueNotificationType.FORMATTING_ISSUE,
      onClick: () => handleReportIssue(IssueNotificationType.FORMATTING_ISSUE),
    },
    {
      type: IssueNotificationType.EXECUTION_FAILURE,
      onClick: () => handleReportIssue(IssueNotificationType.EXECUTION_FAILURE),
    },
    {
      type: IssueNotificationType.OTHER_UI_ISSUE,
      onClick: handleOtherIssue,
    },
  ];

  return (
    <>
      {/* Main Issue Report Menu */}
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-[450px]" hideCloseButton>
          <DialogHeader>
            <DialogTitle>Report an Issue</DialogTitle>
            <DialogDescription>
              Please select what went wrong
            </DialogDescription>
            <DialogClose asChild>
              <button
                onClick={onClose}
                className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </button>
            </DialogClose>
          </DialogHeader>

          <div className="py-4">
            <p className="text-sm text-content-muted mb-4">
              Please select what went wrong:
            </p>

            <div className="space-y-2">
              {issueTypes.map(({ type, onClick }) => {
                const Icon = IssueTypeIcons[type];
                const isLoading = loadingType === type;

                return (
                  <button
                    key={type}
                    onClick={onClick}
                    disabled={isLoading || loadingType !== null}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg border border-gray-200 dark:border-panel-200 bg-white dark:bg-panel-100 hover:bg-gray-50 dark:hover:bg-panel-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-l-transparent border-t-transparent flex-shrink-0" />
                    ) : (
                      <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-content">
                        {IssueTypeLabels[type]}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Regenerate Dialog (for Transformation Quality on Study Plan) */}
      <Dialog open={showRegenerateDialog} onOpenChange={setShowRegenerateDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Try Regenerating First?</DialogTitle>
            <DialogDescription>
              You can regenerate the transformation before reporting an issue
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <p className="text-sm text-content mb-6">
              In study mode, you can regenerate the transformation to get a different context. Would you like to try that first?
            </p>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => handleRegenerateDialogAction('regenerate')}
                className="w-full px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-[#3B82F6] to-[#6366F1] hover:from-[#2563EB] hover:to-[#4F46E5] rounded-lg transition-all"
              >
                Regenerate Transformation
              </button>
              <button
                onClick={() => handleRegenerateDialogAction('report')}
                className="w-full px-4 py-2.5 text-sm font-medium text-content bg-white dark:bg-panel-100 border border-gray-200 dark:border-panel-200 hover:bg-gray-50 dark:hover:bg-panel-200 rounded-lg transition-colors"
              >
                Report Issue Anyway
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Description Dialog (for Other UI Issues) */}
      <IssueDescriptionDialog
        isOpen={showDescriptionDialog}
        onClose={() => setShowDescriptionDialog(false)}
        onSubmit={handleDescriptionSubmit}
        isSubmitting={loadingType === IssueNotificationType.OTHER_UI_ISSUE}
      />
    </>
  );
}
