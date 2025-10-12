// Companies cache utility for localStorage
import { Company } from '../types';

const COMPANIES_CACHE_KEY = 'algo_irl_companies_cache';
const CACHE_EXPIRY_KEY = 'algo_irl_companies_cache_expiry';
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CompaniesCache {
  companies: Company[];
  timestamp: number;
}

/**
 * Get cached companies from localStorage
 * Returns null if cache is expired or doesn't exist
 */
export const getCachedCompanies = (): Company[] | null => {
  try {
    const cached = localStorage.getItem(COMPANIES_CACHE_KEY);
    const expiry = localStorage.getItem(CACHE_EXPIRY_KEY);

    if (!cached || !expiry) {
      return null;
    }

    const expiryTime = parseInt(expiry, 10);
    const now = Date.now();

    // Check if cache is expired
    if (now > expiryTime) {
      clearCompaniesCache();
      return null;
    }

    const parsedCache: CompaniesCache = JSON.parse(cached);
    return parsedCache.companies;
  } catch (error) {
    console.error('Error reading companies from cache:', error);
    return null;
  }
};

/**
 * Save companies to localStorage with expiry
 */
export const cacheCompanies = (companies: Company[]): void => {
  try {
    const cache: CompaniesCache = {
      companies,
      timestamp: Date.now()
    };

    const expiryTime = Date.now() + CACHE_DURATION_MS;

    localStorage.setItem(COMPANIES_CACHE_KEY, JSON.stringify(cache));
    localStorage.setItem(CACHE_EXPIRY_KEY, expiryTime.toString());
  } catch (error) {
    console.error('Error caching companies:', error);
  }
};

/**
 * Clear companies cache
 */
export const clearCompaniesCache = (): void => {
  try {
    localStorage.removeItem(COMPANIES_CACHE_KEY);
    localStorage.removeItem(CACHE_EXPIRY_KEY);
  } catch (error) {
    console.error('Error clearing companies cache:', error);
  }
};

/**
 * Check if cache is valid
 */
export const isCompaniesCacheValid = (): boolean => {
  try {
    const expiry = localStorage.getItem(CACHE_EXPIRY_KEY);
    if (!expiry) {
      return false;
    }

    const expiryTime = parseInt(expiry, 10);
    return Date.now() < expiryTime;
  } catch (error) {
    return false;
  }
};
