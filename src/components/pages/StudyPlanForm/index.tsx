import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SparklesIcon, XCircleIcon, ChevronDownIcon } from 'lucide-react';
import { Company } from '../../../types';
import { StudyPlanConfig, ROLE_OPTIONS, COMMON_TOPICS, RoleFamily, DifficultyPreference } from '../../../types/studyPlan';
import { fetchCompanies as fetchCompaniesAPI } from '../../../utils/api-service';
import { getCachedCompanies, cacheCompanies } from '../../../utils/companiesCache';
import { PremiumGate } from '../../PremiumGate';

// Six fixed company IDs
const FIXED_COMPANY_IDS = ['meta', 'apple', 'amazon', 'netflix', 'google', 'microsoft'];

interface StudyPlanFormProps {
 onSubmit: (config: StudyPlanConfig) => void;
 onCancel: () => void;
 isLoading?: boolean;
 error?: string | null;
}

export function StudyPlanForm({ onSubmit, onCancel, isLoading = false, error: externalError = null }: StudyPlanFormProps) {
 // Form state
 const [companyId, setCompanyId] = useState<string>('meta');
 const [roleFamily, setRoleFamily] = useState<RoleFamily>('backend');
 const [timeline, setTimeline] = useState<number>(14);
 const [hoursPerDay, setHoursPerDay] = useState<number>(2);
 const [difficultyPreference, setDifficultyPreference] = useState<DifficultyPreference>({
  easy: true,
  medium: true,
  hard: true
 });
 const [topicFocus, setTopicFocus] = useState<string[]>([]);
 const [datasetType, setDatasetType] = useState<'blind75' | 'full'>('full');

 // Company loading state
 const [companies, setCompanies] = useState<Company[]>([]);
 const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);
 const [localError, setLocalError] = useState<string | null>(null);

 // Fetch companies from cache or API on mount
 useEffect(() => {
  const loadCompanies = async () => {
   const cachedCompanies = getCachedCompanies();

   if (cachedCompanies) {
    setCompanies(cachedCompanies);
    setIsLoadingCompanies(false);
    return;
   }

   try {
    setIsLoadingCompanies(true);
    const response = await fetchCompaniesAPI();

    if (response.data && Array.isArray(response.data)) {
     setCompanies(response.data);
     cacheCompanies(response.data);
    } else if (response.companies && Array.isArray(response.companies)) {
     setCompanies(response.companies);
     cacheCompanies(response.companies);
    } else if (response && Array.isArray(response)) {
     setCompanies(response);
     cacheCompanies(response);
    }
   } catch (err) {
    console.error('Error fetching companies:', err);
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

 const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  setLocalError(null);

  // Validation
  if (!companyId) {
   setLocalError('Please select a company');
   return;
  }

  if (!difficultyPreference.easy && !difficultyPreference.medium && !difficultyPreference.hard) {
   setLocalError('Please select at least one difficulty level');
   return;
  }

  if (topicFocus.length > 5) {
   setLocalError('Maximum 5 topics can be selected');
   return;
  }

  const config: StudyPlanConfig = {
   companyId,
   roleFamily,
   timeline,
   hoursPerDay,
   difficultyPreference,
   topicFocus: topicFocus.length > 0 ? topicFocus : undefined,
   datasetType
  };

  onSubmit(config);
 };

 const toggleTopic = (topic: string) => {
  if (topicFocus.includes(topic)) {
   setTopicFocus(topicFocus.filter(t => t !== topic));
  } else {
   if (topicFocus.length < 5) {
    setTopicFocus([...topicFocus, topic]);
   }
  }
 };

 const toggleDifficulty = (diff: 'easy' | 'medium' | 'hard') => {
  setDifficultyPreference({
   ...difficultyPreference,
   [diff]: !difficultyPreference[diff]
  });
 };

 const currentError = externalError || localError;

 return (
  <PremiumGate feature="Study Plan Generation">
   <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)] p-4 bg-surface dark:bg-surface">
    <motion.div
     initial={{ opacity: 0, y: 8 }}
     animate={{ opacity: 1, y: 0 }}
     transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
     className="w-full max-w-lg"
    >
     <div className="bg-panel-100 dark:bg-panel-300 backdrop-blur-lg rounded-[20px] shadow-[0_1px_3px_rgba(0,0,0,0.05),0_8px_24px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),0_8px_24px_rgba(0,0,0,0.2)] border border-panel-200 dark:border-panel-300 overflow-hidden">
      {/* Header */}
      <div className="text-center px-6 pt-6 pb-4 border-b border-black/5 dark:border-white/5">
       <h2 className="text-lg font-semibold text-content mb-1">
        Create Study Plan
       </h2>
       <p className="text-xs text-content-muted dark:text-content-subtle">
        Personalized prep schedule for your target company
       </p>
      </div>

      {/* Error Message */}
      <AnimatePresence>
       {currentError && (
        <motion.div
         initial={{ opacity: 0, height: 0 }}
         animate={{ opacity: 1, height: 'auto' }}
         exit={{ opacity: 0, height: 0 }}
         className="mx-5 mt-4"
        >
         <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-[12px]">
          <div className="flex items-start gap-2">
           <XCircleIcon className="h-4 w-4 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
           <div className="flex-1">
            <p className="text-xs text-red-700 dark:text-red-300">{currentError}</p>
           </div>
           <button
            onClick={() => setLocalError(null)}
            className="text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-300 transition-colors"
           >
            <XCircleIcon className="h-3.5 w-3.5" />
           </button>
          </div>
         </div>
        </motion.div>
       )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="p-5 space-y-5">
      {/* Company Selection */}
      <div className="space-y-2">
       <label className="block text-xs font-medium text-content">
        Target Company
       </label>
       <div className="space-y-2">
        <div className="grid grid-cols-3 gap-1.5">
         {fixedCompanies.map((company) => (
          <button
           key={company.id}
           type="button"
           onClick={() => setCompanyId(company.id)}
           className={`py-2 px-2.5 text-xs font-medium transition-all duration-200 rounded-[8px] ${
            companyId === company.id
             ? 'bg-button-600 text-button-foreground border border-button-700 shadow-[0_1px_2px_rgba(0,0,0,0.15),0_1px_20px_rgba(0,0,0,0.08)_inset]'
             : 'bg-cream-100/90 text-content border border-cream-200 shadow-[0_1px_2px_rgba(0,0,0,0.05),0_1px_20px_rgba(0,0,0,0.04)_inset] hover:bg-cream-200/80 dark:bg-panel-500/80 dark:text-cream-50 dark:border-panel-600 dark:shadow-[0_1px_2px_rgba(0,0,0,0.35),0_1px_20px_rgba(0,0,0,0.25)_inset] dark:hover:bg-panel-400/70'
           } backdrop-blur-xl active:scale-[0.98]`}
           disabled={isLoading}
          >
           {company.name}
          </button>
         ))}
        </div>

        {!isLoadingCompanies && otherCompanies.length > 0 && (
         <div className="relative">
          <select
           value={FIXED_COMPANY_IDS.includes(companyId) ? '' : companyId}
           onChange={(e) => {
            if (e.target.value) {
             setCompanyId(e.target.value);
            }
           }}
           disabled={isLoading}
           className="block w-full rounded-[8px] border border-outline-subtle dark:border-outline-subtle bg-surface-elevated dark:bg-panel-500 backdrop-blur-xl text-content shadow-[0_1px_2px_rgba(0,0,0,0.05),0_1px_20px_rgba(0,0,0,0.04)_inset] dark:shadow-[0_1px_2px_rgba(0,0,0,0.35),0_1px_20px_rgba(0,0,0,0.25)_inset] text-xs px-3 py-2 pr-8 transition-all duration-200 appearance-none cursor-pointer disabled:opacity-50"
          >
           <option value="">{otherCompanies.length} more companies...</option>
           {otherCompanies.map(company => (
            <option key={company.id} value={company.id}>
             {company.name}
            </option>
           ))}
          </select>
          <ChevronDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-content-muted dark:text-content-subtle pointer-events-none" />
         </div>
        )}
       </div>
      </div>

      {/* Dataset Selection */}
      <div className="space-y-2">
       <label className="block text-xs font-medium text-content">
        Problem Dataset
       </label>
       <p className="text-xs text-content-muted dark:text-content-subtle mb-1.5">
        Choose your practice problem set
       </p>
       <div className="grid grid-cols-2 gap-1.5">
        <button
         type="button"
         onClick={() => setDatasetType('blind75')}
         className={`py-2.5 px-3 text-xs font-medium transition-all duration-200 rounded-[8px] text-left ${
          datasetType === 'blind75'
           ? 'bg-mint-400 text-content border border-mint-500 shadow-[0_1px_2px_rgba(0,0,0,0.12),0_1px_20px_rgba(0,0,0,0.06)_inset] dark:bg-mint-600 dark:text-cream-50 dark:border-mint-700'
           : 'bg-cream-100/90 text-content border border-cream-200 shadow-[0_1px_2px_rgba(0,0,0,0.05),0_1px_20px_rgba(0,0,0,0.04)_inset] hover:bg-cream-200/80 dark:bg-panel-500/80 dark:text-cream-50 dark:border-panel-600 dark:shadow-[0_1px_2px_rgba(0,0,0,0.35),0_1px_20px_rgba(0,0,0,0.25)_inset] dark:hover:bg-panel-400/70'
         } backdrop-blur-xl active:scale-[0.98]`}
         disabled={isLoading}
        >
         <div className="font-semibold text-xs mb-1">Blind 75</div>
         <div className={`text-[10px] leading-tight ${
          datasetType === 'blind75'
           ? 'text-content-muted dark:text-cream-200'
           : 'text-content-muted dark:text-content-subtle'
         }`}>
          75 essential LeetCode problems covering all major data structures and algorithms patterns
         </div>
        </button>

        <button
         type="button"
         onClick={() => setDatasetType('full')}
         className={`py-2.5 px-3 text-xs font-medium transition-all duration-200 rounded-[8px] text-left ${
          datasetType === 'full'
           ? 'bg-button-500 text-button-foreground border border-button-600 shadow-[0_1px_2px_rgba(0,0,0,0.12),0_1px_20px_rgba(0,0,0,0.06)_inset]'
           : 'bg-cream-100/90 text-content border border-cream-200 shadow-[0_1px_2px_rgba(0,0,0,0.05),0_1px_20px_rgba(0,0,0,0.04)_inset] hover:bg-cream-200/80 dark:bg-panel-500/80 dark:text-cream-50 dark:border-panel-600 dark:shadow-[0_1px_2px_rgba(0,0,0,0.35),0_1px_20px_rgba(0,0,0,0.25)_inset] dark:hover:bg-panel-400/70'
         } backdrop-blur-xl active:scale-[0.98]`}
         disabled={isLoading}
        >
         <div className="font-semibold text-xs mb-1">Full Dataset</div>
         <div className={`text-[10px] leading-tight ${
          datasetType === 'full'
           ? 'text-content-subtle dark:text-cream-200'
           : 'text-content-muted dark:text-content-subtle'
         }`}>
          2000+ comprehensive problems for more targeted practice
         </div>
        </button>
       </div>
      </div>

      {/* Role Selection - Simplified */}
      <div className="space-y-2">
       <label className="block text-xs font-medium text-content">
        Target Role
       </label>
       <p className="text-xs text-content-muted dark:text-content-subtle mb-1.5">
        Select the engineering role you're preparing for
       </p>
       <div className="grid grid-cols-2 gap-1.5">
        {ROLE_OPTIONS.map((role) => (
         <button
          key={role.id}
          type="button"
          onClick={() => setRoleFamily(role.id)}
          className={`py-2 px-2.5 text-xs font-medium transition-all duration-200 rounded-[8px] text-left ${
           roleFamily === role.id
            ? 'bg-button-500 text-button-foreground border border-button-600 shadow-[0_1px_2px_rgba(0,0,0,0.12),0_1px_20px_rgba(0,0,0,0.06)_inset]'
            : 'bg-cream-100/90 text-content border border-cream-200 shadow-[0_1px_2px_rgba(0,0,0,0.05),0_1px_20px_rgba(0,0,0,0.04)_inset] hover:bg-cream-200/80 dark:bg-panel-500/80 dark:text-cream-50 dark:border-panel-600 dark:shadow-[0_1px_2px_rgba(0,0,0,0.35),0_1px_20px_rgba(0,0,0,0.25)_inset] dark:hover:bg-panel-400/70'
          } backdrop-blur-xl active:scale-[0.98]`}
          disabled={isLoading}
         >
          <div className="font-medium text-xs mb-0.5">{role.name}</div>
          <div className={`text-[10px] leading-tight ${
           roleFamily === role.id
            ? 'text-content-subtle dark:text-cream-200'
            : 'text-content-muted dark:text-content-subtle'
          }`}>
           {role.description}
          </div>
         </button>
        ))}
       </div>
      </div>

      {/* Study Schedule - Gradient Sliders */}
      <div className="space-y-2">
       <label className="block text-xs font-medium text-content">
        Study Schedule
       </label>
       <div className="bg-cream-100/80 dark:bg-panel-500/70 backdrop-blur-xl rounded-[12px] p-4 border border-cream-200 dark:border-panel-600 shadow-[0_1px_2px_rgba(0,0,0,0.05),0_1px_20px_rgba(0,0,0,0.04)_inset] dark:shadow-[0_1px_2px_rgba(0,0,0,0.35),0_1px_20px_rgba(0,0,0,0.25)_inset] space-y-4">

        {/* Timeline Slider (Red to Green) */}
        <div className="space-y-2">
         <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-content-muted dark:text-content-subtle">Timeline</label>
          <span className="text-xs font-semibold text-content">{timeline} days</span>
         </div>
         <div className="relative">
          <input
           type="range"
           min="1"
           max="21"
           step="0.01"
           value={timeline}
           onChange={(e) => setTimeline(Math.round(parseFloat(e.target.value)))}
           className="w-full h-2.5 rounded-full appearance-none cursor-pointer relative z-10 bg-transparent
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white dark:[&::-webkit-slider-thumb]:bg-neutral-850
            [&::-webkit-slider-thumb]:shadow-[0_2px_12px_rgba(0,0,0,0.3),0_0_0_4px_rgba(0,0,0,0.08)] dark:[&::-webkit-slider-thumb]:shadow-[0_2px_12px_rgba(0,0,0,0.6),0_0_0_4px_rgba(255,255,255,0.1)]
            [&::-webkit-slider-thumb]:border-0
            [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:duration-100 [&::-webkit-slider-thumb]:ease-out [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:active:scale-105
            [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-white dark:[&::-moz-range-thumb]:bg-neutral-850 [&::-moz-range-thumb]:border-0
            [&::-moz-range-thumb]:shadow-[0_2px_12px_rgba(0,0,0,0.3),0_0_0_4px_rgba(0,0,0,0.08)] dark:[&::-moz-range-thumb]:shadow-[0_2px_12px_rgba(0,0,0,0.6),0_0_0_4px_rgba(255,255,255,0.1)]
            [&::-moz-range-thumb]:transition-transform [&::-moz-range-thumb]:duration-100 [&::-moz-range-thumb]:ease-out"
           style={{
            background: 'linear-gradient(to right,' +
             ' rgba(var(--navy-600-rgb), 1) 0%,' +
             ' rgba(var(--slate-400-rgb), 1) 40%,' +
             ' rgba(var(--mint-300-rgb), 1) 100%)'
           }}
           disabled={isLoading}
          />
         </div>
         <div className="flex justify-between text-[10px] text-content-muted dark:text-content-subtle">
          <span>1 day</span>
          <span>21 days</span>
         </div>
        </div>

        {/* Hours per Day Slider (Green to Red) */}
        <div className="space-y-2">
         <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-content-muted dark:text-content-subtle">Daily Hours</label>
          <span className="text-xs font-semibold text-content">{hoursPerDay}h/day</span>
         </div>
         <div className="relative">
          <input
           type="range"
           min="1"
           max="12"
           step="0.01"
           value={hoursPerDay}
           onChange={(e) => setHoursPerDay(Math.round(parseFloat(e.target.value) * 2) / 2)}
           className="w-full h-2.5 rounded-full appearance-none cursor-pointer relative z-10 bg-transparent
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white dark:[&::-webkit-slider-thumb]:bg-neutral-850
            [&::-webkit-slider-thumb]:shadow-[0_2px_12px_rgba(0,0,0,0.3),0_0_0_4px_rgba(0,0,0,0.08)] dark:[&::-webkit-slider-thumb]:shadow-[0_2px_12px_rgba(0,0,0,0.6),0_0_0_4px_rgba(255,255,255,0.1)]
            [&::-webkit-slider-thumb]:border-0
            [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:duration-100 [&::-webkit-slider-thumb]:ease-out [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:active:scale-105
            [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-white dark:[&::-moz-range-thumb]:bg-neutral-850 [&::-moz-range-thumb]:border-0
            [&::-moz-range-thumb]:shadow-[0_2px_12px_rgba(0,0,0,0.3),0_0_0_4px_rgba(0,0,0,0.08)] dark:[&::-moz-range-thumb]:shadow-[0_2px_12px_rgba(0,0,0,0.6),0_0_0_4px_rgba(255,255,255,0.1)]
            [&::-moz-range-thumb]:transition-transform [&::-moz-range-thumb]:duration-100 [&::-moz-range-thumb]:ease-out"
           style={{
            background: 'linear-gradient(to right,' +
             ' rgba(var(--mint-300-rgb), 1) 0%,' +
             ' rgba(var(--slate-400-rgb), 1) 60%,' +
             ' rgba(var(--navy-600-rgb), 1) 100%)'
           }}
           disabled={isLoading}
          />
         </div>
         <div className="flex justify-between text-[10px] text-content-muted dark:text-content-subtle">
          <span>1 hour</span>
          <span>12 hours</span>
         </div>
        </div>
       </div>
      </div>

      {/* Difficulty Selection */}
      <div className="space-y-2">
       <label className="block text-xs font-medium text-content">
        Difficulty Levels
       </label>
       <div className="grid grid-cols-3 gap-1.5">
        {(['easy', 'medium', 'hard'] as const).map(diff => (
         <button
          key={diff}
          type="button"
          onClick={() => toggleDifficulty(diff)}
          className={`py-2 px-2.5 text-xs font-medium transition-all duration-200 rounded-[8px] ${
           difficultyPreference[diff]
            ? 'bg-button-600 text-button-foreground border border-button-700 shadow-[0_1px_2px_rgba(0,0,0,0.15),0_1px_18px_rgba(0,0,0,0.1)_inset]'
            : 'bg-cream-100/90 text-content border border-cream-200 shadow-[0_1px_2px_rgba(0,0,0,0.05),0_1px_20px_rgba(0,0,0,0.04)_inset] hover:bg-cream-200/80 dark:bg-panel-500/80 dark:text-cream-50 dark:border-panel-600 dark:shadow-[0_1px_2px_rgba(0,0,0,0.35),0_1px_20px_rgba(0,0,0,0.25)_inset] dark:hover:bg-panel-400/70'
          } backdrop-blur-xl active:scale-[0.98]`}
          disabled={isLoading}
         >
          {diff.charAt(0).toUpperCase() + diff.slice(1)}
         </button>
        ))}
       </div>
      </div>

      {/* Topic Focus */}
      <div className="space-y-2">
       <label className="block text-xs font-medium text-content">
        Topic Focus <span className="text-[10px] font-normal text-content-muted dark:text-content-subtle">(Optional, max 5)</span>
       </label>
       <div className="bg-cream-100/80 dark:bg-panel-500/70 backdrop-blur-xl rounded-[12px] p-3 border border-cream-200 dark:border-panel-600 shadow-[0_1px_2px_rgba(0,0,0,0.05),0_1px_20px_rgba(0,0,0,0.04)_inset] dark:shadow-[0_1px_2px_rgba(0,0,0,0.35),0_1px_20px_rgba(0,0,0,0.25)_inset]">
        <div className="flex flex-wrap gap-1.5">
         {COMMON_TOPICS.map(topic => {
          const isSelected = topicFocus.includes(topic);
          const isDisabled = !isSelected && topicFocus.length >= 5;

          return (
           <button
            key={topic}
            type="button"
            onClick={() => toggleTopic(topic)}
            className={`px-2 py-1 rounded-[6px] text-[10px] font-medium transition-all duration-200 ${
             isSelected
              ? 'bg-mint-400 text-content border border-mint-500 dark:bg-mint-600 dark:text-cream-50 dark:border-mint-700'
              : isDisabled
              ? 'bg-cream-200/60 dark:bg-panel-600/60 text-content-subtle dark:text-content-muted border border-cream-200/60 dark:border-panel-700/60 cursor-not-allowed'
              : 'bg-cream-100/90 dark:bg-panel-500/80 text-content border border-cream-200 dark:border-panel-600 hover:bg-cream-200/80 dark:hover:bg-panel-400/70'
            } backdrop-blur-xl active:scale-[0.95]`}
            disabled={isDisabled}
           >
            {topic}
           </button>
          );
         })}
        </div>
        {topicFocus.length > 0 && (
         <div className="mt-2 pt-2 border-t border-black/5 dark:border-white/5">
          <p className="text-center text-[10px] text-content-muted dark:text-content-subtle">
           {topicFocus.length}/5 selected
          </p>
         </div>
        )}
       </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-2 space-y-2">
       <button
        type="submit"
       className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium text-button-foreground bg-button-600 hover:bg-button-500 border border-button-700 shadow-[0_1px_2px_rgba(0,0,0,0.18),0_1px_20px_rgba(0,0,0,0.1)_inset] active:scale-[0.98] rounded-[10px] backdrop-blur-xl transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
        disabled={isLoading || isLoadingCompanies}
       >
        {isLoading ? (
         <>
          <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-current"></div>
          Generating...
         </>
        ) : (
         <>
          <SparklesIcon className="h-3.5 w-3.5" />
          Generate Study Plan
         </>
        )}
       </button>

       <button
        type="button"
        onClick={onCancel}
       className="w-full px-4 py-2.5 text-xs font-medium text-content bg-cream-100/90 dark:bg-panel-500/70 hover:bg-cream-200/80 dark:hover:bg-panel-400/70 backdrop-blur-xl border border-cream-200 dark:border-panel-600 rounded-[10px] transition-all duration-200 active:scale-[0.98] shadow-[0_1px_2px_rgba(0,0,0,0.05),0_1px_20px_rgba(0,0,0,0.04)_inset] dark:shadow-[0_1px_2px_rgba(0,0,0,0.35),0_1px_20px_rgba(0,0,0,0.25)_inset] disabled:opacity-40"
        disabled={isLoading}
       >
        Cancel
       </button>
      </div>

      {isLoading && (
       <p className="text-[10px] text-center text-content-muted dark:text-content-subtle italic">
        Analyzing company patterns and optimizing your schedule...
       </p>
      )}
      </form>
     </div>
    </motion.div>
   </div>
  </PremiumGate>
 );
}
