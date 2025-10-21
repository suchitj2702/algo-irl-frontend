import { useCallback, useRef, useEffect } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { deepEqual } from '../utils/stateComparison';

interface AutoSaveOptions {
  localDebounceMs?: number;
  cloudDebounceMs?: number;
  onLocalSave?: (data: any) => void;
  onCloudSave?: (data: any) => Promise<void>;
  onError?: (error: Error) => void;
}

/**
 * Custom hook for hybrid auto-save strategy
 * - Saves to localStorage with short debounce (data safety)
 * - Saves to cloud with longer debounce (cost efficiency)
 * - Provides method to force immediate save (for navigation)
 */
export function useDebounceAutoSave({
  localDebounceMs = 500,
  cloudDebounceMs = 3000,
  onLocalSave,
  onCloudSave,
  onError
}: AutoSaveOptions) {
  const lastCloudSaveTime = useRef<number>(Date.now());
  const isSavingRef = useRef(false);
  const lastSyncedState = useRef<any>(null);
  const saveSkipCount = useRef<number>(0);

  // Debounced local save
  const debouncedLocalSave = useDebouncedCallback(
    (data: any) => {
      try {
        if (onLocalSave) {
          onLocalSave(data);
          console.log('💾 [Auto-Save] Saved to localStorage');
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

  // Debounced cloud save with state-aware comparison
  const debouncedCloudSave = useDebouncedCallback(
    async (data: any) => {
      if (isSavingRef.current) {
        console.log('☁️ [Auto-Save] Cloud save already in progress, skipping');
        return;
      }

      // State-aware: Check if data has actually changed since last sync
      if (lastSyncedState.current !== null && deepEqual(data, lastSyncedState.current)) {
        saveSkipCount.current++;
        console.log(`☁️ [Auto-Save] No changes detected, skipping Firebase write (${saveSkipCount.current} saves skipped)`);
        return;
      }

      try {
        isSavingRef.current = true;
        if (onCloudSave) {
          await onCloudSave(data);
          lastCloudSaveTime.current = Date.now();
          lastSyncedState.current = structuredClone(data); // Deep clone to prevent reference issues
          console.log('☁️ [Auto-Save] Saved to Firestore');
        }
      } catch (error) {
        console.error('[Auto-Save] Cloud save failed:', error);
        if (onError && error instanceof Error) {
          onError(error);
        }
      } finally {
        isSavingRef.current = false;
      }
    },
    cloudDebounceMs
  );

  // Trigger auto-save
  const autoSave = useCallback((data: any) => {
    debouncedLocalSave(data);
    debouncedCloudSave(data);
  }, [debouncedLocalSave, debouncedCloudSave]);

  // Force immediate save (cancel debounce, save now)
  // Always saves regardless of state comparison (for navigation edge case)
  const forceSave = useCallback(async (data: any) => {
    // Cancel pending debounced calls
    debouncedLocalSave.cancel();
    debouncedCloudSave.cancel();

    // Save immediately (skip state comparison for force save)
    try {
      if (onLocalSave) {
        onLocalSave(data);
        console.log('💾 [Force-Save] Saved to localStorage');
      }
      if (onCloudSave) {
        isSavingRef.current = true;
        await onCloudSave(data);
        lastCloudSaveTime.current = Date.now();
        lastSyncedState.current = structuredClone(data); // Update synced state
        console.log('☁️ [Force-Save] Saved to Firestore');
      }
    } catch (error) {
      console.error('[Force-Save] Failed:', error);
      if (onError && error instanceof Error) {
        onError(error);
      }
      throw error; // Re-throw so caller can handle
    } finally {
      isSavingRef.current = false;
    }
  }, [debouncedLocalSave, debouncedCloudSave, onLocalSave, onCloudSave, onError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      debouncedLocalSave.cancel();
      debouncedCloudSave.cancel();
    };
  }, [debouncedLocalSave, debouncedCloudSave]);

  return {
    autoSave,
    forceSave,
    isSaving: isSavingRef.current,
    lastCloudSaveTime: lastCloudSaveTime.current
  };
}
