import { useCallback, useRef, useEffect } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { deepEqual } from '../utils/stateComparison';
import { secureLog } from '../utils/secureLogger';

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
          if (import.meta.env.DEV) {
            console.log('💾 [Auto-Save] Saved to localStorage');
          }
          secureLog.dev('AutoSave', 'Saved to localStorage', {
            hasData: !!data
          });
        }
      } catch (error) {
        secureLog.error('AutoSave', error as Error, {
          operation: 'localStorage save'
        });
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
        if (import.meta.env.DEV) {
          console.log('☁️ [Auto-Save] Cloud save already in progress, skipping');
        }
        secureLog.dev('AutoSaveCloud', 'Cloud save already in progress, skipping', {});
        return;
      }

      // State-aware: Check if data has actually changed since last sync
      if (lastSyncedState.current !== null && deepEqual(data, lastSyncedState.current)) {
        saveSkipCount.current++;
        if (import.meta.env.DEV) {
          console.log(`☁️ [Auto-Save] No changes detected, skipping Firebase write (${saveSkipCount.current} saves skipped)`);
        }
        secureLog.dev('AutoSaveCloud', 'No changes detected, skipping Firebase write', {
          savesSkipped: saveSkipCount.current
        });
        return;
      }

      try {
        isSavingRef.current = true;
        if (onCloudSave) {
          await onCloudSave(data);
          lastCloudSaveTime.current = Date.now();
          lastSyncedState.current = structuredClone(data); // Deep clone to prevent reference issues
          if (import.meta.env.DEV) {
            console.log('☁️ [Auto-Save] Saved to Firestore');
          }
          secureLog.dev('AutoSaveCloud', 'Saved to Firestore', {
            timestamp: lastCloudSaveTime.current
          });
        }
      } catch (error) {
        secureLog.error('AutoSaveCloud', error as Error, {
          operation: 'cloud save'
        });
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
        if (import.meta.env.DEV) {
          console.log('💾 [Force-Save] Saved to localStorage');
        }
        secureLog.dev('ForceSave', 'Saved to localStorage', {
          hasData: !!data
        });
      }
      if (onCloudSave) {
        isSavingRef.current = true;
        await onCloudSave(data);
        lastCloudSaveTime.current = Date.now();
        lastSyncedState.current = structuredClone(data); // Update synced state
        if (import.meta.env.DEV) {
          console.log('☁️ [Force-Save] Saved to Firestore');
        }
        secureLog.dev('ForceSaveCloud', 'Saved to Firestore', {
          timestamp: lastCloudSaveTime.current
        });
      }
    } catch (error) {
      secureLog.error('ForceSaveCloud', error as Error, {
        operation: 'force save'
      });
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
