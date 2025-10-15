import { useState, useCallback, useRef, useEffect } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import {
  updateProblemProgressInFirestore,
  setProblemStatus,
  toggleProblemBookmark
} from '../services/studyPlanFirestoreService';

interface PlanProgressState {
  completedProblems: Set<string>;
  bookmarkedProblems: Set<string>;
  inProgressProblems: Set<string>;
}

interface PendingUpdate {
  problemId: string;
  isBookmarked?: boolean;
  status?: 'not_started' | 'in_progress' | 'solved';
}

interface UsePlanProgressStateOptions {
  planId: string | null;
  debounceMs?: number;
  onError?: (error: Error) => void;
}

/**
 * Custom hook for managing study plan progress state with optimistic updates
 * and debounced Firestore sync. Similar to the code editor's hybrid strategy.
 *
 * Features:
 * - Optimistic updates: UI updates immediately
 * - Debounced sync: Batches changes to Firestore (default 3000ms)
 * - Force save: Immediate sync before navigation/critical actions
 * - Batch processing: Multiple rapid changes result in single API call
 */
export function usePlanProgressState({
  planId,
  debounceMs = 3000,
  onError
}: UsePlanProgressStateOptions) {
  // Local state (optimistic updates)
  const [state, setState] = useState<PlanProgressState>({
    completedProblems: new Set(),
    bookmarkedProblems: new Set(),
    inProgressProblems: new Set()
  });

  // Track pending updates to sync
  const pendingUpdates = useRef<Map<string, PendingUpdate>>(new Map());
  const isSyncingRef = useRef(false);

  // Debounced Firestore sync
  const debouncedSync = useDebouncedCallback(
    async () => {
      if (!planId || isSyncingRef.current || pendingUpdates.current.size === 0) {
        return;
      }

      try {
        isSyncingRef.current = true;
        const updates = Array.from(pendingUpdates.current.values());

        console.log(`☁️ [Plan Progress] Syncing ${updates.length} updates to Firestore`);

        // Process all pending updates
        await Promise.all(
          updates.map(async (update) => {
            const promises: Promise<void>[] = [];

            // Update bookmark status
            if (update.isBookmarked !== undefined) {
              promises.push(
                toggleProblemBookmark(planId, update.problemId, update.isBookmarked)
              );
            }

            // Update completion status
            if (update.status !== undefined) {
              promises.push(
                setProblemStatus(planId, update.problemId, update.status)
              );
            }

            await Promise.all(promises);
          })
        );

        // Clear pending updates after successful sync
        pendingUpdates.current.clear();
        console.log('☁️ [Plan Progress] Sync complete');
      } catch (error) {
        console.error('[Plan Progress] Sync failed:', error);
        if (onError && error instanceof Error) {
          onError(error);
        }
      } finally {
        isSyncingRef.current = false;
      }
    },
    debounceMs
  );

  // Initialize state from external source
  const initializeState = useCallback((
    completed: Set<string>,
    bookmarked: Set<string>,
    inProgress: Set<string>
  ) => {
    setState({
      completedProblems: completed,
      bookmarkedProblems: bookmarked,
      inProgressProblems: inProgress
    });
  }, []);

  // Toggle bookmark (optimistic)
  const toggleBookmark = useCallback((problemId: string) => {
    if (!planId) return;

    setState(prev => {
      const next = { ...prev };
      const isCurrentlyBookmarked = prev.bookmarkedProblems.has(problemId);

      if (isCurrentlyBookmarked) {
        next.bookmarkedProblems = new Set(prev.bookmarkedProblems);
        next.bookmarkedProblems.delete(problemId);
      } else {
        next.bookmarkedProblems = new Set(prev.bookmarkedProblems);
        next.bookmarkedProblems.add(problemId);
      }

      // Track pending update
      const existing = pendingUpdates.current.get(problemId);
      pendingUpdates.current.set(problemId, {
        ...existing,
        problemId,
        isBookmarked: !isCurrentlyBookmarked
      });

      console.log(`💾 [Plan Progress] Bookmark toggled locally for ${problemId}`);

      // Trigger debounced sync
      debouncedSync();

      return next;
    });
  }, [planId, debouncedSync]);

  // Toggle completion (optimistic)
  const toggleCompletion = useCallback((problemId: string) => {
    if (!planId) return;

    setState(prev => {
      const next = { ...prev };
      const isCurrentlyCompleted = prev.completedProblems.has(problemId);
      const newStatus = isCurrentlyCompleted ? 'in_progress' : 'solved';

      if (isCurrentlyCompleted) {
        // Move from completed to in-progress
        next.completedProblems = new Set(prev.completedProblems);
        next.completedProblems.delete(problemId);
        next.inProgressProblems = new Set(prev.inProgressProblems);
        next.inProgressProblems.add(problemId);
      } else {
        // Move from in-progress to completed
        next.inProgressProblems = new Set(prev.inProgressProblems);
        next.inProgressProblems.delete(problemId);
        next.completedProblems = new Set(prev.completedProblems);
        next.completedProblems.add(problemId);
      }

      // Track pending update
      const existing = pendingUpdates.current.get(problemId);
      pendingUpdates.current.set(problemId, {
        ...existing,
        problemId,
        status: newStatus
      });

      console.log(`💾 [Plan Progress] Completion toggled locally for ${problemId} -> ${newStatus}`);

      // Trigger debounced sync
      debouncedSync();

      return next;
    });
  }, [planId, debouncedSync]);

  // Set problem status (optimistic)
  const updateStatus = useCallback((problemId: string, status: 'not_started' | 'in_progress' | 'solved') => {
    if (!planId) return;

    setState(prev => {
      const next = { ...prev };

      // Remove from all sets
      next.completedProblems = new Set(prev.completedProblems);
      next.inProgressProblems = new Set(prev.inProgressProblems);
      next.completedProblems.delete(problemId);
      next.inProgressProblems.delete(problemId);

      // Add to appropriate set
      if (status === 'solved') {
        next.completedProblems.add(problemId);
      } else if (status === 'in_progress') {
        next.inProgressProblems.add(problemId);
      }

      // Track pending update
      const existing = pendingUpdates.current.get(problemId);
      pendingUpdates.current.set(problemId, {
        ...existing,
        problemId,
        status
      });

      console.log(`💾 [Plan Progress] Status updated locally for ${problemId} -> ${status}`);

      // Trigger debounced sync
      debouncedSync();

      return next;
    });
  }, [planId, debouncedSync]);

  // Force immediate sync (for navigation/critical actions)
  const forceSync = useCallback(async () => {
    if (!planId || pendingUpdates.current.size === 0) {
      return;
    }

    // Cancel pending debounced call
    debouncedSync.cancel();

    try {
      isSyncingRef.current = true;
      const updates = Array.from(pendingUpdates.current.values());

      console.log(`☁️ [Plan Progress - Force] Syncing ${updates.length} updates to Firestore`);

      // Process all pending updates
      await Promise.all(
        updates.map(async (update) => {
          const promises: Promise<void>[] = [];

          // Update bookmark status
          if (update.isBookmarked !== undefined) {
            promises.push(
              toggleProblemBookmark(planId, update.problemId, update.isBookmarked)
            );
          }

          // Update completion status
          if (update.status !== undefined) {
            promises.push(
              setProblemStatus(planId, update.problemId, update.status)
            );
          }

          await Promise.all(promises);
        })
      );

      // Clear pending updates after successful sync
      pendingUpdates.current.clear();
      console.log('☁️ [Plan Progress - Force] Sync complete');
    } catch (error) {
      console.error('[Plan Progress - Force] Sync failed:', error);
      if (onError && error instanceof Error) {
        onError(error);
      }
      throw error; // Re-throw so caller can handle
    } finally {
      isSyncingRef.current = false;
    }
  }, [planId, debouncedSync, onError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      debouncedSync.cancel();
    };
  }, [debouncedSync]);

  return {
    // State
    completedProblems: state.completedProblems,
    bookmarkedProblems: state.bookmarkedProblems,
    inProgressProblems: state.inProgressProblems,

    // Actions
    initializeState,
    toggleBookmark,
    toggleCompletion,
    updateStatus,
    forceSync,

    // Status
    isSyncing: isSyncingRef.current,
    hasPendingChanges: pendingUpdates.current.size > 0
  };
}
