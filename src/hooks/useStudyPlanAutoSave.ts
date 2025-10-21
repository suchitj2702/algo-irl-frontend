import { useCallback, useRef, useEffect } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import {
  CachedPlanData,
  savePlanToCache,
  updatePlanProgressInCache,
  updateProblemInCache,
  markPlanAsSynced
} from '../services/studyPlanCacheService';
import {
  saveStudyPlanToFirestore,
  updateProblemProgressInFirestore,
  updateStudyPlanProgressInFirestore
} from '../services/studyPlanFirestoreService';
import { StudyPlanConfig, StudyPlanResponse } from '../types/studyPlan';
import { Problem, CodeDetails } from '../types';
import { deepEqual } from '../utils/stateComparison';

interface PendingPlanUpdate {
  planId: string;
  type: 'create' | 'progress' | 'problem';
  data: any;
  timestamp: number;
}

interface UseStudyPlanAutoSaveOptions {
  localDebounceMs?: number;
  cloudDebounceMs?: number;
  onError?: (error: Error) => void;
  onSyncComplete?: (planId: string) => void;
}

/**
 * Custom hook for study plan auto-save with hybrid strategy
 *
 * Features:
 * - Optimistic plan creation: Save to localStorage first, sync to Firestore async
 * - Batch progress updates: Multiple changes synced in one API call
 * - Problem details caching: Store problem data locally for instant resume
 * - Force sync: Immediate sync before navigation/logout
 */
export function useStudyPlanAutoSave({
  localDebounceMs = 500,
  cloudDebounceMs = 3000,
  onError,
  onSyncComplete
}: UseStudyPlanAutoSaveOptions = {}) {
  const pendingUpdates = useRef<Map<string, PendingPlanUpdate>>(new Map());
  const isSyncingRef = useRef(false);
  const pendingPlanCreations = useRef<Set<string>>(new Set());
  const lastSyncedUpdates = useRef<Map<string, PendingPlanUpdate>>(new Map());
  const saveSkipCount = useRef<number>(0);

  // Debounced localStorage save
  const debouncedLocalSave = useDebouncedCallback(
    (update: PendingPlanUpdate) => {
      try {
        if (update.type === 'progress') {
          updatePlanProgressInCache(update.planId, update.data);
          console.log(`💾 [Auto-Save] Progress saved to localStorage for plan ${update.planId}`);
        } else if (update.type === 'problem') {
          updateProblemInCache(update.planId, update.data.problemId, update.data);
          console.log(`💾 [Auto-Save] Problem saved to localStorage for plan ${update.planId}`);
        }
      } catch (error) {
        console.error('[Auto-Save] localStorage save failed:', error);
        if (onError && error instanceof Error) {
          onError(error);
        }
      }
    },
    localDebounceMs
  );

  // Debounced Firestore sync with state-aware comparison
  const debouncedCloudSync = useDebouncedCallback(
    async () => {
      if (isSyncingRef.current || pendingUpdates.current.size === 0) {
        return;
      }

      // State-aware: Filter out updates that haven't changed since last sync
      const updatesToSync: PendingPlanUpdate[] = [];
      for (const [key, update] of pendingUpdates.current.entries()) {
        const lastSynced = lastSyncedUpdates.current.get(key);

        // If no previous sync or update differs from last sync, include it
        if (!lastSynced || !deepEqual(update.data, lastSynced.data)) {
          updatesToSync.push(update);
        }
      }

      // If all updates are identical to last sync, skip
      if (updatesToSync.length === 0) {
        saveSkipCount.current++;
        console.log(`☁️ [Auto-Save] No changes detected, skipping Firebase write (${saveSkipCount.current} saves skipped)`);
        pendingUpdates.current.clear();
        return;
      }

      try {
        isSyncingRef.current = true;
        console.log(`☁️ [Auto-Save] Syncing ${updatesToSync.length} updates to Firestore (${pendingUpdates.current.size - updatesToSync.length} skipped)`);

        // Group updates by plan ID and type
        const grouped = new Map<string, { progress?: any[], problems?: any[] }>();

        for (const update of updatesToSync) {
          if (!grouped.has(update.planId)) {
            grouped.set(update.planId, {});
          }

          const planUpdates = grouped.get(update.planId)!;

          if (update.type === 'progress') {
            if (!planUpdates.progress) planUpdates.progress = [];
            planUpdates.progress.push(update.data);
          } else if (update.type === 'problem') {
            if (!planUpdates.problems) planUpdates.problems = [];
            planUpdates.problems.push(update.data);
          }
        }

        // Sync each plan
        for (const [planId, planUpdates] of grouped.entries()) {
          // Sync progress updates (merge into one)
          if (planUpdates.progress && planUpdates.progress.length > 0) {
            const mergedProgress = Object.assign({}, ...planUpdates.progress);
            await updateStudyPlanProgressInFirestore(planId, mergedProgress);
          }

          // Sync problem updates (can be batched)
          if (planUpdates.problems && planUpdates.problems.length > 0) {
            await Promise.all(
              planUpdates.problems.map(prob =>
                updateProblemProgressInFirestore(planId, prob.problemId, prob)
              )
            );
          }

          // Mark as synced
          markPlanAsSynced(planId);

          if (onSyncComplete) {
            onSyncComplete(planId);
          }
        }

        // Update last synced state for all successful updates
        for (const update of updatesToSync) {
          const key = `${update.planId}_${update.type}_${update.type === 'problem' ? update.data.problemId : 'progress'}`;
          lastSyncedUpdates.current.set(key, structuredClone(update));
        }

        // Clear pending updates after successful sync
        pendingUpdates.current.clear();
        console.log('☁️ [Auto-Save] Sync complete');
      } catch (error) {
        console.error('[Auto-Save] Cloud sync failed:', error);
        if (onError && error instanceof Error) {
          onError(error);
        }
      } finally {
        isSyncingRef.current = false;
      }
    },
    cloudDebounceMs
  );

  /**
   * Create a new study plan with optimistic saving
   * Returns a temporary planId immediately, replaces with real ID after sync
   */
  const createPlan = useCallback(async (
    config: StudyPlanConfig,
    response: StudyPlanResponse
  ): Promise<string> => {
    // Generate temporary ID
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Save to localStorage immediately
    const cachedPlan: CachedPlanData = {
      planId: tempId,
      config,
      response,
      progress: {
        completedProblems: [],
        bookmarkedProblems: [],
        inProgressProblems: [],
        currentDay: 1,
        lastUpdatedAt: Date.now()
      },
      problemDetails: {},
      cachedAt: Date.now(),
      version: 1,
      syncedToFirestore: false
    };

    savePlanToCache(cachedPlan);
    console.log(`💾 [Auto-Save] Plan created locally with temp ID: ${tempId}`);

    // Mark as pending creation
    pendingPlanCreations.current.add(tempId);

    // Sync to Firestore in background
    try {
      const realPlanId = await saveStudyPlanToFirestore(config, response);
      console.log(`☁️ [Auto-Save] Plan synced to Firestore with ID: ${realPlanId}`);

      // Update cache with real ID
      cachedPlan.planId = realPlanId;
      cachedPlan.syncedToFirestore = true;
      savePlanToCache(cachedPlan);

      // Remove temp ID entry
      pendingPlanCreations.current.delete(tempId);

      if (onSyncComplete) {
        onSyncComplete(realPlanId);
      }

      return realPlanId;
    } catch (error) {
      console.error('[Auto-Save] Failed to sync plan to Firestore:', error);
      if (onError && error instanceof Error) {
        onError(error);
      }
      // Return temp ID - plan is still usable locally
      return tempId;
    }
  }, [onError, onSyncComplete]);

  /**
   * Auto-save progress changes (bookmarks, completion, etc.)
   */
  const saveProgress = useCallback((
    planId: string,
    progress: {
      completedProblems?: string[];
      bookmarkedProblems?: string[];
      inProgressProblems?: string[];
      currentDay?: number;
    }
  ) => {
    const update: PendingPlanUpdate = {
      planId,
      type: 'progress',
      data: progress,
      timestamp: Date.now()
    };

    pendingUpdates.current.set(`${planId}_progress`, update);

    // Trigger debounced saves
    debouncedLocalSave(update);
    debouncedCloudSync();
  }, [debouncedLocalSave, debouncedCloudSync]);

  /**
   * Auto-save problem details (code, status, etc.)
   */
  const saveProblem = useCallback((
    planId: string,
    problemId: string,
    details: {
      problem?: Problem;
      codeDetails?: CodeDetails;
      userCode?: string;
      status?: 'not_started' | 'in_progress' | 'solved';
      isBookmarked?: boolean;
    }
  ) => {
    const update: PendingPlanUpdate = {
      planId,
      type: 'problem',
      data: { problemId, ...details },
      timestamp: Date.now()
    };

    pendingUpdates.current.set(`${planId}_${problemId}`, update);

    // Trigger debounced saves
    debouncedLocalSave(update);
    debouncedCloudSync();
  }, [debouncedLocalSave, debouncedCloudSync]);

  /**
   * Force immediate sync of all pending changes
   * Always syncs regardless of state comparison (for navigation edge case)
   */
  const forceSync = useCallback(async () => {
    if (pendingUpdates.current.size === 0 && pendingPlanCreations.current.size === 0) {
      return;
    }

    // Cancel pending debounced calls
    debouncedLocalSave.cancel();
    debouncedCloudSync.cancel();

    try {
      isSyncingRef.current = true;
      const updates = Array.from(pendingUpdates.current.values());
      console.log(`☁️ [Force-Save] Syncing ${updates.length} updates immediately`);

      // Group updates by plan ID and type
      const grouped = new Map<string, { progress?: any[], problems?: any[] }>();

      for (const update of updates) {
        if (!grouped.has(update.planId)) {
          grouped.set(update.planId, {});
        }

        const planUpdates = grouped.get(update.planId)!;

        if (update.type === 'progress') {
          if (!planUpdates.progress) planUpdates.progress = [];
          planUpdates.progress.push(update.data);
        } else if (update.type === 'problem') {
          if (!planUpdates.problems) planUpdates.problems = [];
          planUpdates.problems.push(update.data);
        }
      }

      // Sync each plan
      for (const [planId, planUpdates] of grouped.entries()) {
        // Skip temp IDs
        if (planId.startsWith('temp_')) continue;

        // Sync progress updates
        if (planUpdates.progress && planUpdates.progress.length > 0) {
          const mergedProgress = Object.assign({}, ...planUpdates.progress);
          await updateStudyPlanProgressInFirestore(planId, mergedProgress);
        }

        // Sync problem updates
        if (planUpdates.problems && planUpdates.problems.length > 0) {
          await Promise.all(
            planUpdates.problems.map(prob =>
              updateProblemProgressInFirestore(planId, prob.problemId, prob)
            )
          );
        }

        markPlanAsSynced(planId);

        if (onSyncComplete) {
          onSyncComplete(planId);
        }
      }

      // Update last synced state for all successful updates
      for (const update of updates) {
        const key = `${update.planId}_${update.type}_${update.type === 'problem' ? update.data.problemId : 'progress'}`;
        lastSyncedUpdates.current.set(key, structuredClone(update));
      }

      // Clear pending updates
      pendingUpdates.current.clear();
      console.log('☁️ [Force-Save] Sync complete');
    } catch (error) {
      console.error('[Force-Save] Failed:', error);
      if (onError && error instanceof Error) {
        onError(error);
      }
      throw error;
    } finally {
      isSyncingRef.current = false;
    }
  }, [debouncedLocalSave, debouncedCloudSync, onError, onSyncComplete]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      debouncedLocalSave.cancel();
      debouncedCloudSync.cancel();
    };
  }, [debouncedLocalSave, debouncedCloudSync]);

  return {
    createPlan,
    saveProgress,
    saveProblem,
    forceSync,
    isSyncing: isSyncingRef.current,
    hasPendingChanges: pendingUpdates.current.size > 0 || pendingPlanCreations.current.size > 0
  };
}
