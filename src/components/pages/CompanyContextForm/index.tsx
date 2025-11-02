import { useState, useEffect } from 'react';
import { ChevronDownIcon } from 'lucide-react';
import { fetchCompanies as fetchCompaniesAPI } from '../../../utils/api-service';
import { getCachedCompanies, cacheCompanies } from '../../../utils/companiesCache';
import { Company } from '../../../types';
import { RoleFamily, ROLE_OPTIONS } from '../../../types/studyPlan';

export interface CompanyContextFormData {
 company: string;
 roleFamily?: RoleFamily;
}

interface CompanyContextFormProps {
 onSubmit: (data: CompanyContextFormData) => void;
 onCancel: () => void;
 problemSlug?: string;
}

// Six fixed company IDs
const FIXED_COMPANY_IDS = ['meta', 'apple', 'amazon', 'netflix', 'google', 'microsoft'];

export function CompanyContextForm({ onSubmit, onCancel, problemSlug }: CompanyContextFormProps) {
 const [formData, setFormData] = useState<CompanyContextFormData>({
  company: 'meta',
  roleFamily: 'backend'
 });
 const [companies, setCompanies] = useState<Company[]>([]);
 const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);
 const [error, setError] = useState<string | null>(null);

 // Fetch companies from cache or API on mount
 useEffect(() => {
  const loadCompanies = async () => {
   console.log('[CompanyContextForm] Component mounted, loading companies...');

   // Try to get from cache first
   const cachedCompanies = getCachedCompanies();

   if (cachedCompanies) {
    // Use cached companies immediately
    console.log('[CompanyContextForm] Loaded companies from cache:', cachedCompanies.length, 'companies');
    setCompanies(cachedCompanies);
    setIsLoadingCompanies(false);
    return;
   }

   // Cache miss or expired - fetch from API
   try {
    setIsLoadingCompanies(true);
    console.log('[CompanyContextForm] Fetching companies from API...');
    const response = await fetchCompaniesAPI();
    console.log('[CompanyContextForm] API Response:', response);

    if (response.data && Array.isArray(response.data)) {
     console.log('[CompanyContextForm] Fetched companies:', response.data.length, 'companies');
     console.log('[CompanyContextForm] First few companies:', response.data.slice(0, 3));
     setCompanies(response.data);
     // Cache the companies for 24 hours
     cacheCompanies(response.data);
    } else if (response.companies && Array.isArray(response.companies)) {
     // Fallback: try response.companies format
     console.log('[CompanyContextForm] Fetched companies (companies field):', response.companies.length, 'companies');
     console.log('[CompanyContextForm] First few companies:', response.companies.slice(0, 3));
     setCompanies(response.companies);
     cacheCompanies(response.companies);
    } else if (response && Array.isArray(response)) {
     // Maybe the response IS the array directly?
     console.log('[CompanyContextForm] Response is direct array:', response.length, 'companies');
     console.log('[CompanyContextForm] First few companies:', response.slice(0, 3));
     setCompanies(response);
     cacheCompanies(response);
    } else {
     console.warn('[CompanyContextForm] Invalid response format. Expected response.companies to be an array');
     console.log('[CompanyContextForm] Actual response:', response);

     // TEMPORARY: Use test data if API fails
     const testCompanies: Company[] = [
      { id: 'uber', name: 'Uber' },
      { id: 'airbnb', name: 'Airbnb' },
      { id: 'stripe', name: 'Stripe' },
      { id: 'doordash', name: 'DoorDash' },
      { id: 'instacart', name: 'Instacart' }
     ];
     console.log('[CompanyContextForm] Using test data:', testCompanies.length, 'companies');
     setCompanies(testCompanies);
    }
   } catch (err) {
    console.error('[CompanyContextForm] Error fetching companies:', err);
    setError('Failed to load companies list');

    // TEMPORARY: Use test data on error
    const testCompanies: Company[] = [
     { id: 'uber', name: 'Uber' },
     { id: 'airbnb', name: 'Airbnb' },
     { id: 'stripe', name: 'Stripe' },
     { id: 'doordash', name: 'DoorDash' },
     { id: 'instacart', name: 'Instacart' }
    ];
    console.log('[CompanyContextForm] Using test data after error:', testCompanies.length, 'companies');
    setCompanies(testCompanies);
   } finally {
    setIsLoadingCompanies(false);
   }
  };

  loadCompanies();
 }, []);

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

 // Debug logging
 useEffect(() => {
  console.log('Total companies loaded:', companies.length);
  console.log('Other companies (filtered):', otherCompanies.length);
  if (otherCompanies.length > 0) {
   console.log('Sample other companies:', otherCompanies.slice(0, 3));
  }
 }, [companies, otherCompanies]);

 const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  onSubmit(formData);
 };

 const selectCompany = (companyId: string) => {
  setFormData(prev => ({
   ...prev,
   company: companyId
  }));
 };

 const selectRole = (roleFamily: RoleFamily) => {
  setFormData(prev => ({
   ...prev,
   roleFamily
  }));
 };

 // Helper function to convert slug to title
 const slugToTitle = (slug: string): string => {
  return slug
   .split('-')
   .map(word => word.charAt(0).toUpperCase() + word.slice(1))
   .join(' ');
 };

 // Get selected company name for display
 const selectedCompanyName = formData.company
  ? (fixedCompanies.find(c => c.id === formData.company)?.name ||
    companies.find(c => c.id === formData.company)?.name ||
    formData.company)
  : '';

 return (
  <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)] p-4 bg-white dark:bg-neutral-900">
   <div className="w-full max-w-md bg-panel-100 dark:bg-panel-300 rounded-lg shadow-medium border border-panel-200 dark:border-panel-300 p-6">
    <h2 className="text-xl font-medium text-content text-center mb-2">
     Practice with Company Context
    </h2>
    {problemSlug ? (
     <div className="text-center mb-6">
      <p className="text-sm text-content-muted dark:text-content-subtle mb-1">
       Selected problem:
      </p>
      <p className="font-medium text-mint-dark dark:text-mint-light">
       {slugToTitle(problemSlug)}
      </p>
     </div>
    ) : (
     <p className="text-sm text-content-muted dark:text-content-subtle text-center mb-6">
      Get a random Blind75 problem with company-specific context
     </p>
    )}

    {error && (
     <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
      <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
     </div>
    )}

    <form onSubmit={handleSubmit} className="space-y-6">
     <div>
      <label className="block text-sm font-medium text-content mb-3">
       Select Company
      </label>
      <div className="space-y-3">
       {/* Fixed Companies Grid */}
       <div className="grid grid-cols-3 gap-2">
        {fixedCompanies.map(company => {
         return (
          <button
           key={company.id}
           type="button"
           onClick={() => selectCompany(company.id)}
           className={`py-2 px-3 border rounded-md text-sm flex items-center justify-center transition-all ${
            formData.company === company.id
             ? 'bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-400 dark:text-indigo-300 shadow-sm'
             : 'border-outline-subtle text-content dark:border-outline-subtle dark:text-content hover:bg-surface-muted/60 dark:hover:bg-surface-muted/40 hover:border-outline-subtle/80'
           }`}
          >
           {company.name}
          </button>
         );
        })}
       </div>

       {/* Other Companies Dropdown */}
       {!isLoadingCompanies && (
        <div>
         <label className="block text-xs font-medium text-content-muted mb-2">
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
           disabled={otherCompanies.length === 0}
           className="block w-full rounded-md border border-outline-subtle dark:border-outline-subtle bg-surface-elevated dark:bg-panel-500 text-content-muted shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-700/50 sm:text-sm px-3 py-2.5 pr-10 transition-all duration-200 appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
          <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-content-subtle pointer-events-none" />
         </div>
        </div>
       )}

       {isLoadingCompanies && (
        <div className="text-center py-3">
         <div className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-indigo-600"></div>
         <p className="text-xs text-content-subtle mt-2">Loading companies...</p>
        </div>
       )}
      </div>
     </div>

     {/* Role Selection */}
     <div>
      <label className="block text-sm font-medium text-content mb-3">
       Select Your Role
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
       {ROLE_OPTIONS.map(role => (
        <button
         key={role.id}
         type="button"
         onClick={() => selectRole(role.id)}
         className={`py-3 px-3 border rounded-md transition-all ${
          formData.roleFamily === role.id
           ? 'bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-400 dark:text-indigo-300 shadow-sm'
           : 'border-outline-subtle text-content dark:border-outline-subtle dark:text-content hover:bg-surface-muted/60 dark:hover:bg-surface-muted/40 hover:border-outline-subtle/80'
         }`}
        >
         <div className="text-sm font-medium">{role.name}</div>
         <div className="text-xs text-content-muted dark:text-content-subtle mt-1">
          {role.description}
         </div>
        </button>
       ))}
      </div>
     </div>

     <div className="pt-4 space-y-3">
      <button
       type="submit"
       className="w-full flex justify-center items-center px-4 py-2.5 text-base font-medium text-button-foreground bg-button-600 hover:bg-button-500 border border-button-700 rounded-lg transition-all duration-200 shadow-subtle hover:shadow-medium disabled:opacity-50 disabled:cursor-not-allowed"
       disabled={isLoadingCompanies}
      >
       {problemSlug ? 'Get Contextualized Problem' : 'Get Random Problem'}
      </button>

      <button
       type="button"
       onClick={onCancel}
       className="w-full px-4 py-2.5 text-base font-medium text-content-muted dark:text-content-subtle bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-all duration-200"
      >
       Cancel
      </button>
     </div>
    </form>
   </div>
  </div>
 );
}
