import { useState, useEffect } from 'react';
import { XCircleIcon, ChevronDownIcon } from 'lucide-react';
import { getProblemShowTimestamps, updateProblemShowTimestamp } from '../../../utils/cache';
import { blind75Data, TopicName, getTopicNames, getAllProblems, getProblemsByTopic } from '../../../constants/blind75';
import { FormData, Company } from '../../../types';
import { fetchCompanies as fetchCompaniesAPI } from '../../../utils/api-service';
import { getCachedCompanies, cacheCompanies } from '../../../utils/companiesCache';

// Six fixed company IDs
const FIXED_COMPANY_IDS = ['meta', 'apple', 'amazon', 'netflix', 'google', 'microsoft'];

interface ProblemFormProps {
 initialData: Omit<FormData, 'dataset'> & { dataset?: string };
 onSubmit: (data: FormData) => void;
 isLoading?: boolean;
 error?: string | null;
 onClearError?: () => void;
}

export function ProblemForm({
 initialData,
 onSubmit,
 isLoading = false,
 error: externalError = null,
 onClearError
}: ProblemFormProps) {
 const [formData, setFormData] = useState<FormData>({
  dataset: 'blind75',
  company: 'meta',
  topic: 'random',
  difficulty: 'Medium',
  specificProblemSlug: undefined
 });
 const [companies, setCompanies] = useState<Company[]>([]);
 const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);
 const [localError, setLocalError] = useState<string | null>(null);

 // Fetch companies from cache or API on mount
 useEffect(() => {
  const loadCompanies = async () => {
   console.log('[ProblemForm] Component mounted, loading companies...');

   // Try to get from cache first
   const cachedCompanies = getCachedCompanies();

   if (cachedCompanies) {
    // Use cached companies immediately
    console.log('[ProblemForm] Loaded companies from cache:', cachedCompanies.length, 'companies');
    setCompanies(cachedCompanies);
    setIsLoadingCompanies(false);
    return;
   }

   // Cache miss or expired - fetch from API
   try {
    setIsLoadingCompanies(true);
    console.log('[ProblemForm] Fetching companies from API...');
    const response = await fetchCompaniesAPI();
    console.log('[ProblemForm] API Response:', response);

    if (response.data && Array.isArray(response.data)) {
     console.log('[ProblemForm] Fetched companies:', response.data.length, 'companies');
     console.log('[ProblemForm] First few companies:', response.data.slice(0, 3));
     setCompanies(response.data);
     // Cache the companies for 24 hours
     cacheCompanies(response.data);
    } else if (response.companies && Array.isArray(response.companies)) {
     // Fallback: try response.companies format
     console.log('[ProblemForm] Fetched companies (companies field):', response.companies.length, 'companies');
     console.log('[ProblemForm] First few companies:', response.companies.slice(0, 3));
     setCompanies(response.companies);
     cacheCompanies(response.companies);
    } else if (response && Array.isArray(response)) {
     // Maybe the response IS the array directly?
     console.log('[ProblemForm] Response is direct array:', response.length, 'companies');
     console.log('[ProblemForm] First few companies:', response.slice(0, 3));
     setCompanies(response);
     cacheCompanies(response);
    } else {
     console.warn('[ProblemForm] Invalid response format. Expected response.companies to be an array');
     console.log('[ProblemForm] Actual response:', response);

     // TEMPORARY: Use test data if API fails
     const testCompanies: Company[] = [
      { id: 'uber', name: 'Uber' },
      { id: 'airbnb', name: 'Airbnb' },
      { id: 'stripe', name: 'Stripe' },
      { id: 'doordash', name: 'DoorDash' },
      { id: 'instacart', name: 'Instacart' }
     ];
     console.log('[ProblemForm] Using test data:', testCompanies.length, 'companies');
     setCompanies(testCompanies);
    }
   } catch (err) {
    console.error('[ProblemForm] Error fetching companies:', err);

    // TEMPORARY: Use test data on error
    const testCompanies: Company[] = [
     { id: 'uber', name: 'Uber' },
     { id: 'airbnb', name: 'Airbnb' },
     { id: 'stripe', name: 'Stripe' },
     { id: 'doordash', name: 'DoorDash' },
     { id: 'instacart', name: 'Instacart' }
    ];
    console.log('[ProblemForm] Using test data after error:', testCompanies.length, 'companies');
    setCompanies(testCompanies);
   } finally {
    setIsLoadingCompanies(false);
   }
  };

  loadCompanies();
 }, []);

 // Clear local error when external error changes
 useEffect(() => {
  if (externalError) {
   setLocalError(null);
  }
 }, [externalError]);

 const clearAllErrors = () => {
  setLocalError(null);
  if (onClearError) {
   onClearError();
  }
 };

 // Fixed companies for button display
 const fixedCompanies = [
  { id: 'meta', name: 'Meta' },
  { id: 'apple', name: 'Apple' },
  { id: 'amazon', name: 'Amazon' },
  { id: 'netflix', name: 'Netflix' },
  { id: 'google', name: 'Google' },
  { id: 'microsoft', name: 'Microsoft' }
 ];

 // Other companies (excluding the fixed ones)
 const otherCompanies = companies.filter(c => !FIXED_COMPANY_IDS.includes(c.id));

 const difficulties = [{
  id: 'Easy',
  name: 'Easy'
 }, {
  id: 'Medium',
  name: 'Medium'
 }, {
  id: 'Hard',
  name: 'Hard'
 }];

 const topics = [
  { id: 'random', name: 'Random' },
  ...getTopicNames().map(topic => ({ id: topic, name: topic }))
 ];

 // Function to get least recently shown problem
 const getLeastRecentlyShownProblem = () => {
  let problemPool: Array<{ slug: string; difficulty: string }> = [];

  if (formData.topic === 'random') {
   problemPool = getAllProblems();
  } else {
   problemPool = getProblemsByTopic(formData.topic as TopicName);
  }

  // Filter by difficulty if specified
  if (formData.difficulty) {
   problemPool = problemPool.filter(p => p.difficulty === formData.difficulty);
  }

  if (problemPool.length === 0) return null;

  const timestamps = getProblemShowTimestamps();

  // Find problems that have never been shown
  const neverShownProblems = problemPool.filter(p =>
   !timestamps.find(t => t.slug === p.slug)
  );

  if (neverShownProblems.length > 0) {
   // If there are problems that have never been shown, pick one randomly
   const randomIndex = Math.floor(Math.random() * neverShownProblems.length);
   return neverShownProblems[randomIndex];
  }

  // All problems have been shown, find the least recently shown ones
  const problemsWithTimestamps = problemPool.map(p => {
   const timestamp = timestamps.find(t => t.slug === p.slug);
   return {
    ...p,
    timestamp: timestamp ? timestamp.lastShown : 0
   };
  }).sort((a, b) => a.timestamp - b.timestamp);

  // Find all problems with the minimum timestamp (least recently shown)
  const minTimestamp = problemsWithTimestamps[0].timestamp;
  const leastRecentlyShown = problemsWithTimestamps.filter(p => p.timestamp === minTimestamp);

  // If multiple problems have the same minimum timestamp, pick one randomly
  const randomIndex = Math.floor(Math.random() * leastRecentlyShown.length);
  return leastRecentlyShown[randomIndex];
 };

 const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();

  // Clear any existing errors
  clearAllErrors();

  // Get the least recently shown problem
  const selectedProblem = getLeastRecentlyShownProblem();

  if (!selectedProblem) {
   const topicDisplay = formData.topic === 'random' ? 'any topic' : formData.topic;
   setLocalError(
    `No ${formData.difficulty.toLowerCase()} problems found for ${topicDisplay}. Try selecting a different difficulty or topic.`
   );
   return;
  }

  // Update the timestamp for the selected problem
  updateProblemShowTimestamp(selectedProblem.slug);

  const finalFormData = {
   ...formData,
   specificProblemSlug: selectedProblem.slug
  };

  onSubmit(finalFormData);
 };

 const selectCompany = (companyId: string) => {
  clearAllErrors();
  setFormData({
   ...formData,
   company: companyId
  });
 };

 const currentError = externalError || localError;

 // Get selected company name for display
 const selectedCompanyName = formData.company
  ? (fixedCompanies.find(c => c.id === formData.company)?.name ||
    companies.find(c => c.id === formData.company)?.name ||
    formData.company)
  : '';

 return <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)] p-4 bg-surface dark:bg-surface">
  <div className="w-full max-w-md bg-panel-100 dark:bg-panel-300 rounded-xl shadow-lg border border-panel-200 dark:border-panel-300 p-6">
   <div className="text-center mb-6">
    <h2 className="text-xl font-bold text-content mb-1 font-playfair">
     Configure Your Problem
    </h2>
    <p className="text-content-muted dark:text-content-subtle text-sm">
     Customize your coding challenge experience
    </p>
   </div>

   {/* Error Message */}
   {currentError && (
    <div className="mb-6 p-4 bg-cream-light dark:bg-red-900/20 border border-red-400 dark:border-red-800/30 rounded-lg">
     <div className="flex items-start gap-3">
      <XCircleIcon className="h-5 w-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
       <h3 className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
        {externalError ? 'Generation Failed' : 'Configuration Error'}
       </h3>
       <p className="text-sm text-red-700 dark:text-red-300">
        {currentError}
       </p>
       {externalError && (
        <p className="text-xs text-red-600 dark:text-red-400 mt-2">
         This might be due to high server load. Please try again in a moment.
        </p>
       )}
      </div>
      <button
       onClick={clearAllErrors}
       className="p-1 text-content bg-cream dark:bg-accent/10 hover:bg-cream-light /15 backdrop-blur-xl border border-slate/20 rounded-[12px] shadow-[0_1px_2px_rgba(0,0,0,0.05),0_1px_20px_rgba(255,255,255,0.3)_inset] dark:shadow-[0_1px_2px_rgba(0,0,0,0.3),0_1px_20px_rgba(200,216,255,0.1)_inset] active:scale-[0.95] transition-all duration-200"
      >
       <XCircleIcon className="h-4 w-4" />
      </button>
     </div>
    </div>
   )}

   <form onSubmit={handleSubmit} className="space-y-5">
    <div className="space-y-2">
     <label className="block text-sm font-semibold text-content mb-2">
      Dataset
     </label>
     <div className="grid grid-cols-1 gap-2">
      <button
       type="button"
       className="inline-flex items-center justify-center py-2.5 px-4 text-[15px] font-medium text-content bg-cream dark:bg-accent/8 border border-slate/20 dark:border-accent/16 rounded-[14px] backdrop-blur-xl shadow-[0_1px_2px_rgba(0,0,0,0.04),0_1px_18px_rgba(255,255,255,0.25)_inset] dark:shadow-[0_1px_2px_rgba(0,0,0,0.25),0_1px_18px_rgba(200,216,255,0.08)_inset] cursor-default"
      >
       Blind 75
      </button>
     </div>
     <div className="mt-2 space-y-2">
      <p className="text-xs text-content bg-mint-light/30 dark:bg-blue-900/20 border border-mint dark:border-blue-800/30 rounded-lg p-2">
       💡 <strong>What is Blind 75?</strong> A curated list of 75 essential coding problems covering all major algorithms and data structures. Perfect for efficient interview preparation at top tech companies.
      </p>
      <p className="text-xs text-content-muted dark:text-content-subtle italic pl-1">
       More datasets coming soon...
      </p>
     </div>
    </div>

    <div className="space-y-2">
     <label className="block text-sm font-semibold text-content mb-2">
      Company
     </label>
     <div className="space-y-3">
      {/* Fixed Companies Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
       {fixedCompanies.map(company => {
        return <button
         key={company.id}
         type="button"
         onClick={() => selectCompany(company.id)}
          className={`py-2.5 px-3 text-[15px] font-medium rounded-[14px] backdrop-blur-xl border transition-all duration-200 ${
          formData.company === company.id
           ? 'text-button-foreground bg-button-600 hover:bg-button-500 border border-button-700 shadow-[0_1px_2px_rgba(0,0,0,0.15),0_1px_20px_rgba(0,0,0,0.08)_inset]'
           : 'text-content bg-surface-elevated dark:bg-panel-500 hover:bg-surface-muted/70 dark:hover:bg-panel-400/70 border border-outline-subtle shadow-[0_1px_2px_rgba(0,0,0,0.05),0_1px_20px_rgba(0,0,0,0.04)_inset] dark:shadow-[0_1px_2px_rgba(0,0,0,0.35),0_1px_20px_rgba(0,0,0,0.25)_inset] active:scale-[0.98]'
         }`}
         disabled={isLoading}
        >
         <span className="truncate">{company.name}</span>
        </button>;
       })}
      </div>

      {/* Other Companies Dropdown */}
      {!isLoadingCompanies && (
       <div>
        <label className="block text-xs font-medium text-content-muted dark:text-content-subtle mb-2">
         Other Companies {otherCompanies.length > 0 && `(${otherCompanies.length})`}
        </label>
        <div className="relative">
         <select
          value={FIXED_COMPANY_IDS.includes(formData.company) ? '' : formData.company}
          onChange={(e) => {
           if (e.target.value) {
            selectCompany(e.target.value);
           }
          }}
          disabled={isLoading || otherCompanies.length === 0}
          className="block w-full rounded-lg border border-teal/40 dark:border-neutral-700 bg-cream dark:bg-neutral-800 text-content shadow-sm focus:border-teal focus:ring-2 focus:ring-teal-light dark:focus:ring-indigo-700/50 sm:text-sm px-4 py-3 pr-10 transition-all duration-200 appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
         >
          <option value="">
           {otherCompanies.length > 0
            ? `Choose from ${otherCompanies.length} more companies...`
            : 'No additional companies available'}
          </option>
          {otherCompanies.map(company => (
           <option key={company.id} value={company.id}>
            {company.name}
           </option>
          ))}
         </select>
         <ChevronDownIcon className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-content-muted pointer-events-none" />
        </div>
       </div>
      )}

      {isLoadingCompanies && (
       <div className="text-center py-2">
        <div className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-teal"></div>
        <p className="text-xs text-content-muted dark:text-content-subtle mt-1">Loading companies...</p>
       </div>
      )}

      {/* Selected Company Display */}
      {!FIXED_COMPANY_IDS.includes(formData.company) && selectedCompanyName && (
       <div className="p-3 bg-mint-light/30 dark:bg-indigo-900/20 border border-mint dark:border-indigo-800/30 rounded-md">
        <p className="text-sm text-mint-dark dark:text-indigo-300">
         <span className="font-medium">Selected:</span> {selectedCompanyName}
        </p>
       </div>
      )}
     </div>
    </div>

    <div className="space-y-2">
     <label className="block text-sm font-semibold text-content-muted dark:text-content-subtle mb-2">
      Difficulty
     </label>
     <div className="grid grid-cols-3 gap-2">
      {difficulties.map(difficulty => <button
       key={difficulty.id}
       type="button"
       onClick={() => {
        clearAllErrors();
        setFormData({
         ...formData,
         difficulty: difficulty.id
        });
       }}
       className={`py-2.5 px-3 text-[15px] font-medium rounded-[14px] backdrop-blur-xl border transition-all duration-200 ${
        formData.difficulty === difficulty.id
         ? 'text-button-foreground bg-button-600 hover:bg-button-500 border border-button-700 shadow-[0_1px_2px_rgba(0,0,0,0.15),0_1px_20px_rgba(255,255,255,0.25)_inset] dark:shadow-[0_1px_2px_rgba(0,0,0,0.1),0_1px_20px_rgba(0,0,0,0.3)_inset]'
         : 'text-content bg-surface-elevated dark:bg-panel-500 hover:bg-surface-muted/70 dark:hover:bg-panel-400/70 border border-outline-subtle shadow-[0_1px_2px_rgba(0,0,0,0.05),0_1px_20px_rgba(0,0,0,0.04)_inset] dark:shadow-[0_1px_2px_rgba(0,0,0,0.35),0_1px_20px_rgba(0,0,0,0.25)_inset] active:scale-[0.98]'
       }`}
       disabled={isLoading}
      >
       {difficulty.name}
      </button>)}
     </div>
    </div>

    <div className="space-y-2">
     <label className="block text-sm font-semibold text-content-muted dark:text-content-subtle mb-2">
      Topic
     </label>
     <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
      {topics.map(topic => (
       <button
        key={topic.id}
        type="button"
        onClick={() => {
         clearAllErrors();
         setFormData({
          ...formData,
          topic: topic.id
         });
        }}
        className={`py-2 px-3 text-[13px] font-medium rounded-[14px] backdrop-blur-xl border transition-all duration-200 flex items-center justify-center gap-2 ${
         formData.topic === topic.id
          ? 'text-button-foreground bg-button-600 hover:bg-button-500 border border-button-700 shadow-[0_1px_2px_rgba(0,0,0,0.15),0_1px_20px_rgba(255,255,255,0.25)_inset] dark:shadow-[0_1px_2px_rgba(0,0,0,0.1),0_1px_20px_rgba(0,0,0,0.3)_inset]'
          : 'text-content bg-surface-elevated dark:bg-panel-500 hover:bg-surface-muted/70 dark:hover:bg-panel-400/70 border border-outline-subtle shadow-[0_1px_2px_rgba(0,0,0,0.05),0_1px_20px_rgba(0,0,0,0.04)_inset] dark:shadow-[0_1px_2px_rgba(0,0,0,0.35),0_1px_20px_rgba(0,0,0,0.25)_inset] active:scale-[0.98]'
        }`}
        disabled={isLoading}
       >
        <span className="truncate">
         {topic.name}
        </span>
       </button>
      ))}
     </div>
     <div className="mt-2">
      <p className="text-xs text-content-subtle bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 rounded-lg p-2">
       💡 <strong>Smart Selection:</strong> We'll automatically pick the least recently solved problem from your selected topic to ensure balanced practice.
      </p>
     </div>
    </div>

    <div className="pt-4">
     <button
      type="submit"
      className="w-full inline-flex justify-center items-center gap-2 px-6 py-3.5 text-[17px] font-medium text-button-foreground bg-button-600 hover:bg-button-500 border border-button-700 rounded-[16px] backdrop-blur-xl shadow-[0_1px_2px_rgba(0,0,0,0.15),0_1px_20px_rgba(255,255,255,0.25)_inset] dark:shadow-[0_1px_2px_rgba(0,0,0,0.1),0_1px_20px_rgba(0,0,0,0.3)_inset] hover:shadow-[0_1px_3px_rgba(0,0,0,0.2),0_2px_30px_rgba(255,255,255,0.35)_inset] dark:hover:shadow-[0_1px_3px_rgba(0,0,0,0.15),0_2px_30px_rgba(0,0,0,0.4)_inset] active:scale-[0.98] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
      disabled={isLoading || isLoadingCompanies}
     >
      {isLoading ? (
       <>
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
        Generating Challenge...
       </>
      ) : (
       <>
        Generate Challenge
       </>
      )}
     </button>
     {isLoading && (
      <p className="text-xs text-center text-content-subtle mt-2">
       This may take up to a minute. Please be patient...
      </p>
     )}
    </div>
   </form>

   {/* Copyright Notice */}
   <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
    <p className="text-center text-sm text-content-subtle">
     Copyright © 2025 <span className="font-playfair">AlgoIRL</span>. All rights reserved.
    </p>
   </div>
  </div>
 </div>;
}
