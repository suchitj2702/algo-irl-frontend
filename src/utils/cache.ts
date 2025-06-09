// Cache utility for managing user data in localStorage
export interface CachedCompany {
  id: string;
  name: string;
  timestamp: number;
}

export interface CachedProblem {
  problemId: string;
  status: 'solved' | 'in_progress';
  solution: string;
  timestamp: number;
  companyId: string; // Store company ID for API calls
  companyName: string; // Store company name for display
  difficulty: string;
  title?: string;
}

export interface UserCache {
  companies: CachedCompany[];
  problems: CachedProblem[];
}

const CACHE_KEY = 'algo_irl_user_cache';

// Get cache from localStorage
export const getCache = (): UserCache => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsedCache = JSON.parse(cached);
      
      // Migration: handle old format where company was just a string
      if (parsedCache.problems) {
        parsedCache.problems = parsedCache.problems.map((problem: any) => {
          if (typeof problem.company === 'string') {
            // Migrate old format to new format
            return {
              ...problem,
              companyId: problem.company, // Use company string as ID for old entries
              companyName: problem.company,
              company: undefined // Remove old field
            };
          }
          return problem;
        });
      }
      
      return parsedCache;
    }
  } catch (error) {
    console.error('Error reading from cache:', error);
  }
  
  return {
    companies: [],
    problems: []
  };
};

// Save cache to localStorage
export const saveCache = (cache: UserCache): void => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error('Error saving to cache:', error);
  }
};

// Default company IDs that should not be cached as recently used
const DEFAULT_COMPANY_IDS = ['meta', 'apple', 'amazon', 'netflix', 'google', 'microsoft'];

// Utility function to properly capitalize company names
const capitalizeCompanyName = (name: string): string => {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

// Add or update a company in cache (keep last 4)
export const addCompanyToCache = (companyId: string, companyName: string): void => {
  // Don't cache default companies - they're always available
  if (DEFAULT_COMPANY_IDS.includes(companyId)) {
    return;
  }
  
  const cache = getCache();
  
  // Remove existing entry if present
  cache.companies = cache.companies.filter(c => c.id !== companyId);
  
  // Add new entry at the beginning with properly capitalized name
  cache.companies.unshift({
    id: companyId,
    name: capitalizeCompanyName(companyName),
    timestamp: Date.now()
  });
  
  // Keep only last 4
  cache.companies = cache.companies.slice(0, 4);
  
  saveCache(cache);
};

// Get recent companies (last 4)
export const getRecentCompanies = (): CachedCompany[] => {
  const cache = getCache();
  return cache.companies.slice(0, 4);
};

// Add or update a problem in cache
export const addProblemToCache = (
  problemId: string, 
  status: 'solved' | 'in_progress',
  solution: string,
  companyId: string,
  companyName: string,
  difficulty: string,
  title?: string
): void => {
  const cache = getCache();
  
  // Create a unique identifier that includes both problem and company
  // This allows multiple company attempts for the same problem to be stored
  const uniqueProblemId = `${problemId}_${companyId}`;
  
  // Remove existing entry if present (same problem + same company)
  cache.problems = cache.problems.filter(p => p.problemId !== uniqueProblemId);
  
  // Add new entry with unique problem ID
  cache.problems.push({
    problemId: uniqueProblemId,
    status,
    solution,
    companyId,
    companyName,
    difficulty,
    title,
    timestamp: Date.now()
  });
  
  saveCache(cache);
};

// Get cached problem
export const getCachedProblem = (problemId: string): CachedProblem | null => {
  const cache = getCache();
  return cache.problems.find(p => p.problemId === problemId) || null;
};

// Get all cached problems
export const getAllCachedProblems = (): CachedProblem[] => {
  const cache = getCache();
  return cache.problems.sort((a, b) => b.timestamp - a.timestamp);
};

// Update problem status to solved
export const markProblemAsSolved = (problemId: string, solution: string): void => {
  const cache = getCache();
  const problemIndex = cache.problems.findIndex(p => p.problemId === problemId);
  
  if (problemIndex !== -1) {
    cache.problems[problemIndex].status = 'solved';
    cache.problems[problemIndex].solution = solution;
    cache.problems[problemIndex].timestamp = Date.now();
    saveCache(cache);
  }
};

// Update problem solution (for in-progress problems)
export const updateProblemSolution = (problemId: string, solution: string): void => {
  const cache = getCache();
  const problemIndex = cache.problems.findIndex(p => p.problemId === problemId);
  
  if (problemIndex !== -1) {
    cache.problems[problemIndex].solution = solution;
    cache.problems[problemIndex].timestamp = Date.now();
    saveCache(cache);
  }
};

// Clear all cached data
export const clearCache = (): void => {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
};

// Interface for tracking problem show timestamps
export interface ProblemShowTimestamp {
  slug: string;
  lastShown: number;
}

// Get problem show timestamps from cache
export const getProblemShowTimestamps = (): ProblemShowTimestamp[] => {
  try {
    const cached = localStorage.getItem('algo_irl_problem_timestamps');
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (error) {
    console.error('Error reading problem timestamps:', error);
  }
  return [];
};

// Save problem show timestamps to cache
export const saveProblemShowTimestamps = (timestamps: ProblemShowTimestamp[]): void => {
  try {
    localStorage.setItem('algo_irl_problem_timestamps', JSON.stringify(timestamps));
  } catch (error) {
    console.error('Error saving problem timestamps:', error);
  }
};

// Update timestamp for a shown problem
export const updateProblemShowTimestamp = (slug: string): void => {
  const timestamps = getProblemShowTimestamps();
  const existingIndex = timestamps.findIndex(t => t.slug === slug);
  
  if (existingIndex !== -1) {
    timestamps[existingIndex].lastShown = Date.now();
  } else {
    timestamps.push({ slug, lastShown: Date.now() });
  }
  
  saveProblemShowTimestamps(timestamps);
}; 