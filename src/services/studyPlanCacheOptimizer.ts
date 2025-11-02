/**
 * Study Plan Cache Optimizer
 * Advanced caching optimizations for study plan performance
 */

import { CachedPlanData, getPlanFromCache, updateProblemInCache } from './studyPlanCacheService';
import { EnrichedProblem } from '../types/studyPlan';
import { Problem, CodeDetails } from '../types';
import { getProblemDetailsFromFirestore } from './studyPlanFirestoreService';
import { secureLog } from '../utils/secureLogger';

// In-memory cache for frequently accessed data
class MemoryCache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly TTL = 5 * 60 * 1000; // 5 minutes TTL
  private readonly MAX_SIZE = 50; // Max items in cache

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }

    // Move to end (LRU)
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.data;
  }

  set(key: string, data: any): void {
    // Remove oldest if at capacity
    if (this.cache.size >= this.MAX_SIZE && !this.cache.has(key)) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, { data, timestamp: Date.now() });
  }

  clear(): void {
    this.cache.clear();
  }

  invalidate(pattern?: string): void {
    if (!pattern) {
      this.clear();
      return;
    }

    // Invalidate keys matching pattern
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}

// Singleton memory cache instance
const memoryCache = new MemoryCache();

/**
 * Batch write operations to reduce localStorage writes
 */
class BatchWriter {
  private pendingWrites = new Map<string, any>();
  private writeTimer: NodeJS.Timeout | null = null;
  private readonly BATCH_DELAY = 100; // 100ms delay

  schedule(key: string, data: any): void {
    this.pendingWrites.set(key, data);

    if (this.writeTimer) {
      clearTimeout(this.writeTimer);
    }

    this.writeTimer = setTimeout(() => {
      this.flush();
    }, this.BATCH_DELAY);
  }

  flush(): void {
    if (this.pendingWrites.size === 0) return;

    try {
      // Batch write all pending items
      for (const [key, data] of this.pendingWrites.entries()) {
        localStorage.setItem(key, JSON.stringify(data));
      }

      secureLog.dev('BatchWriter', `Flushed ${this.pendingWrites.size} writes to localStorage`);
      this.pendingWrites.clear();
    } catch (error) {
      secureLog.error('BatchWriter', error as Error, { operation: 'flush' });
    }

    if (this.writeTimer) {
      clearTimeout(this.writeTimer);
      this.writeTimer = null;
    }
  }
}

const batchWriter = new BatchWriter();

/**
 * Preload cache for adjacent problems (next/prev)
 */
export async function preloadAdjacentProblems(
  planId: string,
  currentProblemId: string,
  problems: EnrichedProblem[]
): Promise<void> {
  const currentIndex = problems.findIndex(p => p.problemId === currentProblemId);
  if (currentIndex === -1) return;

  const preloadIndices = [
    currentIndex - 1, // Previous problem
    currentIndex + 1, // Next problem
    currentIndex + 2  // Next-next problem (for quick navigation)
  ].filter(i => i >= 0 && i < problems.length);

  for (const index of preloadIndices) {
    const problem = problems[index];
    const cacheKey = `problem_${planId}_${problem.problemId}`;

    // Check if already in memory cache
    if (!memoryCache.get(cacheKey)) {
      // Preload into memory cache (don't block)
      setTimeout(() => {
        const cached = getCachedProblemOptimized(planId, problem.problemId);
        if (cached) {
          memoryCache.set(cacheKey, cached);
          secureLog.dev('Preloader', `Cached adjacent problem ${index - currentIndex > 0 ? '+' : ''}${index - currentIndex}: ${problem.problemId}`);
        }
      }, 0);
    }
  }
}

/**
 * Optimized cache read with memory cache layer
 */
export function getCachedProblemOptimized(
  planId: string,
  problemId: string
): any | null {
  const cacheKey = `problem_${planId}_${problemId}`;

  // Check memory cache first (fastest)
  const memCached = memoryCache.get(cacheKey);
  if (memCached) {
    secureLog.dev('Cache', `Memory hit for problem ${problemId}`);
    return memCached;
  }

  // Check localStorage (slower)
  try {
    const planKey = `algoirl_study_plan_${planId}`;
    const stored = localStorage.getItem(planKey);
    if (!stored) return null;

    const plan: CachedPlanData = JSON.parse(stored);
    const problem = plan.problemDetails?.[problemId];

    if (problem) {
      // Store in memory cache for next access
      memoryCache.set(cacheKey, problem);
      secureLog.dev('Cache', `localStorage hit for problem ${problemId}`);
      return problem;
    }
  } catch (error) {
    secureLog.error('Cache', error as Error, { operation: 'read', problemId });
  }

  return null;
}

/**
 * Optimized cache write with batching
 */
export function updateCacheOptimized(
  planId: string,
  updates: Partial<CachedPlanData>
): void {
  const planKey = `algoirl_study_plan_${planId}`;

  try {
    // Get existing data
    const stored = localStorage.getItem(planKey);
    if (!stored) return;

    const plan: CachedPlanData = JSON.parse(stored);

    // Merge updates
    const updated = {
      ...plan,
      ...updates,
      cachedAt: Date.now()
    };

    // Invalidate memory cache for this plan
    memoryCache.invalidate(planId);

    // Schedule batched write
    batchWriter.schedule(planKey, updated);

    secureLog.dev('Cache', `Scheduled batched update for plan ${planId}`);
  } catch (error) {
    secureLog.error('Cache', error as Error, { operation: 'update', planId });
  }
}

/**
 * Validate cache integrity
 */
export function validateCache(planId: string): boolean {
  try {
    const planKey = `algoirl_study_plan_${planId}`;
    const stored = localStorage.getItem(planKey);
    if (!stored) return false;

    const plan: CachedPlanData = JSON.parse(stored);

    // Basic integrity checks
    if (!plan.planId || !plan.config || !plan.response) {
      secureLog.warn('Cache', `Invalid structure for plan ${planId}`);
      return false;
    }

    // Check for corruption in problem details
    if (plan.problemDetails) {
      for (const [problemId, details] of Object.entries(plan.problemDetails)) {
        if (!details.problem || !details.codeDetails) {
          secureLog.warn('Cache', `Corrupted problem details for ${problemId}`);
          return false;
        }
      }
    }

    return true;
  } catch (error) {
    secureLog.error('Cache', error as Error, { operation: 'validation', planId });
    return false;
  }
}

/**
 * Compress cache data for storage efficiency
 */
export function compressCache(data: any): string {
  // Remove redundant fields and compress
  const compressed = {
    ...data,
    // Remove large redundant fields that can be reconstructed
    response: {
      ...data.response,
      schedule: data.response?.schedule?.map((day: any) => ({
        ...day,
        problems: day.problems?.map((p: any) => ({
          // Keep only essential fields
          problemId: p.problemId,
          difficulty: p.difficulty,
          estimatedTimeMinutes: p.estimatedTimeMinutes,
          roleRelevance: p.roleRelevance,
          hotnessScore: p.hotnessScore
        }))
      }))
    }
  };

  return JSON.stringify(compressed);
}

/**
 * Decompress cache data
 */
export function decompressCache(compressed: string, fullData: CachedPlanData): CachedPlanData {
  try {
    const parsed = JSON.parse(compressed);

    // Reconstruct full data by merging with original
    return {
      ...fullData,
      ...parsed,
      response: {
        ...fullData.response,
        ...parsed.response,
        schedule: fullData.response.schedule.map((day, i) => ({
          ...day,
          problems: day.problems.map((p, j) => ({
            ...p,
            ...(parsed.response?.schedule?.[i]?.problems?.[j] || {})
          }))
        }))
      }
    };
  } catch (error) {
    secureLog.error('Cache', error as Error, { operation: 'decompression' });
    return fullData;
  }
}

/**
 * Clear memory cache (useful on navigation)
 */
export function clearMemoryCache(): void {
  memoryCache.clear();
  secureLog.dev('Cache', 'Cleared memory cache');
}

/**
 * Force flush any pending batch writes
 */
export function flushBatchWrites(): void {
  batchWriter.flush();
}

/**
 * Get cache statistics for monitoring
 */
export function getCacheMetrics(): {
  memoryCacheSize: number;
  localStorageSize: number;
  totalCachedPlans: number;
  hitRate?: number;
  missRate?: number;
  firestoreRate?: number;
  apiRate?: number;
} {
  // Calculate localStorage usage
  let localStorageSize = 0;
  let totalCachedPlans = 0;

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('algoirl_study_plan_')) {
      totalCachedPlans++;
      const value = localStorage.getItem(key);
      if (value) {
        localStorageSize += key.length + value.length;
      }
    }
  }

  // Include telemetry if available
  const total = telemetry.totalRequests || 1;
  const result: any = {
    memoryCacheSize: memoryCache['cache'].size,
    localStorageSize,
    totalCachedPlans
  };

  if (telemetry.totalRequests > 0) {
    result.hitRate = (telemetry.cacheHits / total) * 100;
    result.missRate = (telemetry.cacheMisses / total) * 100;
    result.firestoreRate = (telemetry.firestoreHits / total) * 100;
    result.apiRate = (telemetry.apiCalls / total) * 100;
  }

  return result;
}

// Cache hit/miss telemetry
interface CacheTelemetry {
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  firestoreHits: number;
  apiCalls: number;
  lastReset: number;
}

const telemetry: CacheTelemetry = {
  totalRequests: 0,
  cacheHits: 0,
  cacheMisses: 0,
  firestoreHits: 0,
  apiCalls: 0,
  lastReset: Date.now()
};

// Reset telemetry every hour
setInterval(() => {
  if (telemetry.totalRequests > 0) {
    const hitRate = (telemetry.cacheHits / telemetry.totalRequests * 100).toFixed(1);
    secureLog.dev('CacheTelemetry', `Hour summary - Hit rate: ${hitRate}%`, {
      hits: telemetry.cacheHits,
      misses: telemetry.cacheMisses,
      firestore: telemetry.firestoreHits,
      api: telemetry.apiCalls
    });
  }

  // Reset counters
  telemetry.totalRequests = 0;
  telemetry.cacheHits = 0;
  telemetry.cacheMisses = 0;
  telemetry.firestoreHits = 0;
  telemetry.apiCalls = 0;
  telemetry.lastReset = Date.now();
}, 3600000); // 1 hour

/**
 * Multi-tier cache check with fallbacks
 * 1. Check memory cache (fastest)
 * 2. Check unified cache
 * 3. Check Firestore cache (if available)
 * 4. Check localStorage legacy format (backward compat)
 * 5. API call (last resort)
 */
export async function getProblemWithFallbacks(
  planId: string,
  problemId: string,
  onApiCall?: () => Promise<{ problem: Problem; codeDetails: CodeDetails; userCode: string }>
): Promise<{ problem: Problem; codeDetails: CodeDetails; userCode: string } | null> {
  telemetry.totalRequests++;

  // Tier 0: Check memory cache (fastest)
  const memCacheKey = `problem_${planId}_${problemId}`;
  const memCached = memoryCache.get(memCacheKey);
  if (memCached?.problem && memCached?.codeDetails) {
    telemetry.cacheHits++;
    secureLog.dev('Cache', `Tier 0 HIT: Found in memory cache`);
    return memCached;
  }

  // Tier 1: Check unified cache
  secureLog.dev('Cache', `Tier 1: Checking unified cache for ${problemId}`);
  const cachedPlan = getPlanFromCache(planId);
  if (cachedPlan?.problemDetails?.[problemId]) {
    const cached = cachedPlan.problemDetails[problemId];
    if (cached.problem && cached.codeDetails) {
      telemetry.cacheHits++;
      secureLog.dev('Cache', `Tier 1 HIT: Found in unified cache`);

      // Store in memory cache for next access
      memoryCache.set(memCacheKey, {
        problem: cached.problem,
        codeDetails: cached.codeDetails,
        userCode: cached.userCode
      });

      return {
        problem: cached.problem,
        codeDetails: cached.codeDetails,
        userCode: cached.userCode
      };
    }
  }

  // Tier 2: Check Firestore (network call, but cheaper than API)
  secureLog.dev('Cache', `Tier 2: Checking Firestore for ${problemId}`);
  try {
    const firestoreData = await getProblemDetailsFromFirestore(planId, problemId);
    if (firestoreData) {
      telemetry.firestoreHits++;
      secureLog.dev('Cache', `Tier 2 HIT: Found in Firestore`);

      // Save to unified cache and memory cache
      updateProblemInCache(
        planId,
        problemId,
        firestoreData.problem,
        firestoreData.codeDetails,
        firestoreData.code
      );

      memoryCache.set(memCacheKey, {
        problem: firestoreData.problem,
        codeDetails: firestoreData.codeDetails,
        userCode: firestoreData.code
      });

      return {
        problem: firestoreData.problem,
        codeDetails: firestoreData.codeDetails,
        userCode: firestoreData.code
      };
    }
  } catch (error) {
    secureLog.warn('Cache', `Tier 2 Firestore check failed: ${error instanceof Error ? error.message : String(error)}`);
  }

  // Tier 3: Check localStorage legacy format (backward compatibility)
  secureLog.dev('Cache', `Tier 3: Checking localStorage legacy format`);
  try {
    const legacyKey = `problem_${planId}_${problemId}`;
    const legacyData = localStorage.getItem(legacyKey);
    if (legacyData) {
      const parsed = JSON.parse(legacyData);
      if (parsed.problem && parsed.codeDetails) {
        telemetry.cacheHits++;
        secureLog.dev('Cache', `Tier 3 HIT: Found in legacy localStorage`);

        // Migrate to unified cache and memory cache
        updateProblemInCache(
          planId,
          problemId,
          parsed.problem,
          parsed.codeDetails,
          parsed.userCode || ''
        );

        memoryCache.set(memCacheKey, parsed);

        return {
          problem: parsed.problem,
          codeDetails: parsed.codeDetails,
          userCode: parsed.userCode || ''
        };
      }
    }
  } catch (error) {
    secureLog.warn('Cache', `Tier 3 legacy check failed: ${error instanceof Error ? error.message : String(error)}`);
  }

  // Tier 4: API call (last resort)
  telemetry.cacheMisses++;
  telemetry.apiCalls++;

  if (onApiCall) {
    secureLog.dev('Cache', `Tier 4: All caches missed, calling API`);
    secureLog.warn('Cache', `API call required for ${problemId} - this should be rare!`);

    // Log cache miss for investigation
    logCacheMiss(planId, problemId);

    try {
      const apiData = await onApiCall();

      // Save to all cache layers
      updateProblemInCache(
        planId,
        problemId,
        apiData.problem,
        apiData.codeDetails,
        apiData.userCode
      );

      memoryCache.set(memCacheKey, apiData);

      return apiData;
    } catch (error) {
      secureLog.error('Cache', error as Error, { operation: 'api-call', problemId });
      return null;
    }
  }

  secureLog.error('Cache', new Error(`All tiers failed for ${problemId}`));
  return null;
}

/**
 * Log cache miss for investigation
 */
function logCacheMiss(planId: string, problemId: string): void {
  const missKey = `cache_miss_${Date.now()}`;
  const missData = {
    planId,
    problemId,
    timestamp: new Date().toISOString(),
    metrics: getCacheMetrics()
  };

  // Store miss data for debugging (limited to last 10)
  try {
    const misses = JSON.parse(localStorage.getItem('cache_misses') || '[]');
    misses.push(missData);
    if (misses.length > 10) misses.shift();
    localStorage.setItem('cache_misses', JSON.stringify(misses));
  } catch (error) {
    secureLog.error('Cache', error as Error, { operation: 'log-cache-miss' });
  }
}

/**
 * Check cache health and log warnings
 */
export function checkCacheHealth(): void {
  const metrics = getCacheMetrics();

  if (telemetry.totalRequests > 10) {
    const hitRate = metrics.hitRate || 0;
    const apiRate = metrics.apiRate || 0;

    if (hitRate < 50) {
      secureLog.warn('CacheHealth', `Low cache hit rate: ${hitRate.toFixed(1)}% - Consider warming up cache or checking migration logic`);
    }

    if (apiRate > 20) {
      secureLog.error('CacheHealth', new Error(`High API call rate: ${apiRate.toFixed(1)}% - Cache system may not be working correctly`));

      // Log recent cache misses for debugging
      try {
        const misses = JSON.parse(localStorage.getItem('cache_misses') || '[]');
        if (misses.length > 0) {
          secureLog.error('CacheHealth', new Error('Recent cache misses detected'), { misses });
        }
      } catch (error) {
        // Ignore
      }
    }
  }
}

// Check cache health every 5 minutes
setInterval(checkCacheHealth, 300000);