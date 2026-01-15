import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { IssueDescriptionDialogProps } from '../types/issueReporting';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from './ui/dialog';
import { Button } from './ui/button';

const MIN_DESCRIPTION_LENGTH = 10;

export function IssueDescriptionDialog({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}: IssueDescriptionDialogProps) {
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setDescription('');
      setError(null);
      // Focus textarea when dialog opens
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value);
    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
  };

  const handleSubmit = () => {
    const trimmedDescription = description.trim();

    if (trimmedDescription.length < MIN_DESCRIPTION_LENGTH) {
      setError(`Please enter at least ${MIN_DESCRIPTION_LENGTH} characters`);
      return;
    }

    onSubmit(trimmedDescription);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Cmd/Ctrl + Enter to submit
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const charCount = description.length;
  const isValid = charCount >= MIN_DESCRIPTION_LENGTH;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <DialogContent className="sm:max-w-[500px]" hideCloseButton>
        <DialogHeader>
          <DialogTitle>Describe the issue</DialogTitle>
          <DialogDescription>
            Please provide details about what went wrong. This will help us investigate and fix the issue.
          </DialogDescription>
          <DialogClose asChild>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
          </DialogClose>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <textarea
              ref={textareaRef}
              value={description}
              onChange={handleDescriptionChange}
              onKeyDown={handleKeyDown}
              disabled={isSubmitting}
              placeholder="Please describe what went wrong..."
              className="w-full min-h-[120px] px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-panel-300 bg-white dark:bg-panel-100 text-content placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:opacity-50 disabled:cursor-not-allowed"
              rows={6}
            />

            {/* Character counter */}
            <div className="flex items-center justify-between text-xs">
              <span
                className={`${
                  isValid
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-content-muted'
                }`}
              >
                {charCount}/{MIN_DESCRIPTION_LENGTH} characters
              </span>

              {/* Keyboard shortcut hint */}
              <span className="text-content-muted">
                <kbd className="px-1.5 py-0.5 text-xs font-semibold text-content bg-gray-100 dark:bg-panel-200 border border-gray-300 dark:border-panel-300 rounded">
                  {navigator.userAgent.includes('Mac') ? '⌘' : 'Ctrl'}
                </kbd>
                {' + '}
                <kbd className="px-1.5 py-0.5 text-xs font-semibold text-content bg-gray-100 dark:bg-panel-200 border border-gray-300 dark:border-panel-300 rounded">
                  Enter
                </kbd>
                {' to submit'}
              </span>
            </div>

            {/* Error message */}
            {error && (
              <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
            )}
          </div>
        </div>

        <DialogFooter className="flex flex-row justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/55 border-l-transparent border-t-transparent mr-2" />
                Submitting...
              </>
            ) : (
              'Submit Report'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
