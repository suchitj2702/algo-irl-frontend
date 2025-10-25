import React, { useState, useEffect, useRef } from 'react';
import { CheckCircleIcon, ClockIcon, TrashIcon, AlertTriangleIcon, XIcon } from 'lucide-react';
import { getAllCachedProblems, CachedProblem, clearCache } from '../../../utils/cache';
import { blind75Data } from '../../../constants/blind75';
import { Blind75ViewState } from '../../../utils/blind75ViewState';

interface Blind75Props {
 onPracticeWithContext: (problemSlug: string) => void;
 onResumeProblem: (problemId: string) => void;
 highlightedProblemSlug?: string;
 viewState?: Blind75ViewState | null;
}

export function Blind75({ onPracticeWithContext, onResumeProblem, highlightedProblemSlug, viewState }: Blind75Props) {
 const [cachedProblems, setCachedProblems] = useState<CachedProblem[]>([]);
 const [showResetConfirmation, setShowResetConfirmation] = useState(false);
 const [highlightedProblem, setHighlightedProblem] = useState<string | undefined>(highlightedProblemSlug);
 const problemRefs = useRef<Record<string, HTMLDivElement | null>>({});

 useEffect(() => {
  const problems = getAllCachedProblems();
  setCachedProblems(problems);
 }, []);

 // 🎯 Restore scroll position and highlight problem on mount
 useEffect(() => {
  if (!viewState) return;

  // Restore scroll position after DOM renders
  requestAnimationFrame(() => {
   requestAnimationFrame(() => {
    window.scrollTo({
     top: viewState.scrollY,
     behavior: 'smooth'
    });

    // Scroll highlighted problem into view
    if (viewState.lastViewedProblemSlug && problemRefs.current[viewState.lastViewedProblemSlug]) {
     setTimeout(() => {
      problemRefs.current[viewState.lastViewedProblemSlug!]?.scrollIntoView({
       behavior: 'smooth',
       block: 'center',
       inline: 'nearest'
      });
     }, 300);
    }

    // Set highlighted problem from viewState
    if (viewState.lastViewedProblemSlug) {
     setHighlightedProblem(viewState.lastViewedProblemSlug);
    }

    console.log('📜 Restored Blind75 view state:', {
     scrollY: viewState.scrollY,
     highlightedProblem: viewState.lastViewedProblemSlug
    });
   });
  });
 }, [viewState]);

 // Clear highlight after 3 seconds (separate effect)
 useEffect(() => {
  if (highlightedProblem) {
   const timer = setTimeout(() => {
    setHighlightedProblem(undefined);
   }, 3000);
   return () => clearTimeout(timer);
  }
 }, [highlightedProblem]);

 // Helper function to convert slug to title
 const slugToTitle = (slug: string): string => {
  return slug
   .split('-')
   .map(word => word.charAt(0).toUpperCase() + word.slice(1))
   .join(' ');
 };

 // Helper function to get all cached problems for a slug (both solved and in-progress)
 const getAllCachedProblemsForSlug = (slug: string): CachedProblem[] => {
  return cachedProblems.filter(p => 
   p.title?.toLowerCase().replace(/\s+/g, '-') === slug || 
   p.problemId?.includes(slug) ||
   p.problemId?.startsWith(slug + '_') // Handle new format: slug_companyId
  );
 };

 // Helper function to get latest solved problem for a slug
 const getLatestSolvedProblem = (slug: string): CachedProblem | null => {
  const solvedProblems = cachedProblems
   .filter(p => 
    (p.title?.toLowerCase().replace(/\s+/g, '-') === slug || 
     p.problemId?.includes(slug) ||
     p.problemId?.startsWith(slug + '_')) &&
    p.status === 'solved'
   )
   .sort((a, b) => b.timestamp - a.timestamp); // latest first
  
  return solvedProblems.length > 0 ? solvedProblems[0] : null;
 };

 // Helper function to get in-progress problem for a slug
 const getInProgressProblem = (slug: string): CachedProblem | null => {
  return cachedProblems.find(p => 
   (p.title?.toLowerCase().replace(/\s+/g, '-') === slug || 
    p.problemId?.includes(slug) ||
    p.problemId?.startsWith(slug + '_')) &&
   p.status === 'in_progress'
  ) || null;
 };

 // Helper function to get the latest attempt (regardless of status)
 const getLatestAttempt = (slug: string): CachedProblem | null => {
  const allAttempts = cachedProblems
   .filter(p => 
    p.title?.toLowerCase().replace(/\s+/g, '-') === slug || 
    p.problemId?.includes(slug) ||
    p.problemId?.startsWith(slug + '_')
   )
   .sort((a, b) => b.timestamp - a.timestamp); // latest first
  
  return allAttempts.length > 0 ? allAttempts[0] : null;
 };

 // Get problem status: 'solved', 'in_progress', or 'not_started' (based on most recent attempt only)
 const getProblemStatus = (slug: string): 'solved' | 'in_progress' | 'not_started' => {
  const latestAttempt = getLatestAttempt(slug);
  
  if (!latestAttempt) return 'not_started';
  return latestAttempt.status;
 };

 // Calculate overall statistics (both solved and in-progress)
 const calculateStats = () => {
  const totalProblems = Object.values(blind75Data).flat().length;
  const solvedProblems = Object.values(blind75Data).flat().filter(problem => {
   return getProblemStatus(problem.slug) === 'solved';
  });
  const inProgressProblems = Object.values(blind75Data).flat().filter(problem => {
   return getProblemStatus(problem.slug) === 'in_progress';
  });

  const easyProblems = Object.values(blind75Data).flat().filter(p => p.difficulty === 'Easy');
  const mediumProblems = Object.values(blind75Data).flat().filter(p => p.difficulty === 'Medium');
  const hardProblems = Object.values(blind75Data).flat().filter(p => p.difficulty === 'Hard');

  const solvedEasy = easyProblems.filter(p => getProblemStatus(p.slug) === 'solved').length;
  const solvedMedium = mediumProblems.filter(p => getProblemStatus(p.slug) === 'solved').length;
  const solvedHard = hardProblems.filter(p => getProblemStatus(p.slug) === 'solved').length;

  return {
   total: { solved: solvedProblems.length, inProgress: inProgressProblems.length, total: totalProblems },
   easy: { solved: solvedEasy, total: easyProblems.length },
   medium: { solved: solvedMedium, total: mediumProblems.length },
   hard: { solved: solvedHard, total: hardProblems.length }
  };
 };

 const stats = calculateStats();

 // Get last 3 unique companies for a problem (both solved and in-progress, oldest to latest)
 const getCompaniesForProblem = (slug: string) => {
  const problemSolutions = cachedProblems
   .filter(p => 
    (p.title?.toLowerCase().replace(/\s+/g, '-') === slug || 
     p.problemId?.includes(slug) ||
     p.problemId?.startsWith(slug + '_')) && 
    (p.status === 'solved' || p.status === 'in_progress')
   )
   .sort((a, b) => b.timestamp - a.timestamp); // latest first for deduplication

  // Deduplicate by company name while preserving most recent occurrence
  const uniqueCompanies = [];
  const seenCompanies = new Set();
  
  for (const problem of problemSolutions) {
   const companyName = problem.companyName; // Use exact name from cache
   if (!seenCompanies.has(companyName.toLowerCase())) {
    seenCompanies.add(companyName.toLowerCase());
    uniqueCompanies.push(companyName);
   }
  }

  // Return up to 3 unique companies, most recent first
  return uniqueCompanies.slice(0, 3);
 };

 const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
   case 'Easy': return 'text-green-600 dark:text-green-400';
   case 'Medium': return 'text-yellow-600 dark:text-yellow-400';
   case 'Hard': return 'text-red-600 dark:text-red-400';
   default: return 'text-content-muted dark:text-content-subtle';
  }
 };

 const getStatBadgeColor = (difficulty: string) => {
  switch (difficulty) {
   case 'Easy': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
   case 'Medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
   case 'Hard': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
   default: return 'bg-gray-100 text-content dark:bg-gray-800/30 dark:text-content-subtle';
  }
 };

 const handleActionClick = (slug: string, status: 'solved' | 'in_progress' | 'not_started') => {
  const latestAttempt = getLatestAttempt(slug);
  if (latestAttempt) {
   onResumeProblem(latestAttempt.problemId);
  }
 };

 // Handle reset progress
 const handleResetProgress = () => {
  clearCache();
  setCachedProblems([]);
  setShowResetConfirmation(false);
 };

 return (
  <div className="min-h-[calc(100vh-3.5rem)] bg-surface dark:bg-surface p-6">
   <div className="max-w-5xl mx-auto">
    {/* Header */}
    <div className="text-center mb-6">
     <h1 className="text-4xl font-bold bg-gradient-to-r from-mint via-slate to-navy dark:from-green-400 dark:via-emerald-400 dark:to-green-600 bg-clip-text text-transparent mb-2">
      Blind 75
     </h1>
     <p className="text-content-muted dark:text-content-subtle text-sm mb-2">
      Master the most important coding interview problems
     </p>
     <div className="max-w-2xl mx-auto">
      <p className="text-sm text-content-muted dark:text-content-subtle bg-mint-light/30 dark:bg-blue-900/20 border border-mint/30 dark:border-blue-800/30 rounded-lg p-3">
       💡 <strong>What is Blind 75?</strong> A curated list of 75 essential LeetCode problems covering all major data structures and algorithms patterns. Created by a Facebook engineer, this list is designed to help you efficiently prepare for technical interviews at top tech companies.
      </p>
     </div>
    </div>

    {/* Cool Progress Stats */}
    <div className="bg-gradient-to-br from-panel-muted via-panel-100 to-panel-accent dark:from-gray-800 dark:via-gray-850 dark:to-indigo-900/20 rounded-xl shadow-lg border border-panel-200 dark:border-gray-700/50 p-6 mb-8 backdrop-blur-sm">
     {/* Main Progress Circle and Stats */}
     <div className="flex items-center justify-between mb-6">
      {/* Animated Progress Circle */}
      <div className="relative">
       <div className="flex items-center gap-6">
        {/* Large Progress Circle */}
        <div className="relative w-24 h-24">
         <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
           cx="50"
           cy="50"
           r="40"
           stroke="currentColor"
           strokeWidth="8"
           fill="none"
           className="text-panel-accent dark:text-content-muted"
          />
          {/* Progress circle */}
          <circle
           cx="50"
           cy="50"
           r="40"
           stroke="url(#progressGradient)"
           strokeWidth="8"
           fill="none"
           strokeLinecap="round"
           strokeDasharray={`${2 * Math.PI * 40}`}
           strokeDashoffset={`${2 * Math.PI * 40 * (1 - stats.total.solved / stats.total.total)}`}
           className="transition-all duration-1000 ease-out"
           style={{
            filter: 'drop-shadow(0 0 6px rgba(112, 137, 147, 0.3))'
           }}
          />
          <defs>
           <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#d9eafd" />
            <stop offset="50%" stopColor="#bcccdc" />
            <stop offset="100%" stopColor="#99a6b2" />
           </linearGradient>
          </defs>
         </svg>
         {/* Center content */}
         <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
           <div className="text-2xl font-bold bg-gradient-to-r from-mint via-slate to-navy bg-clip-text text-transparent">
            {Math.round((stats.total.solved / stats.total.total) * 100)}%
           </div>
           <div className="text-xs text-content-muted/70 dark:text-content-subtle">
            Complete
           </div>
          </div>
         </div>
        </div>

        {/* Stats Display */}
        <div className="space-y-2">
         <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold bg-gradient-to-r from-mint via-slate to-navy bg-clip-text text-transparent">
           {stats.total.solved}
          </span>
          <span className="text-xl text-content-muted/60 dark:text-content-subtle font-medium">
           / {stats.total.total}
          </span>
          <span className="text-sm text-content-muted dark:text-content-subtle ml-2">
           problems solved
          </span>
         </div>
         
         {stats.total.inProgress > 0 && (
          <div className="flex items-center gap-2">
           <div className="w-2 h-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
           <span className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">
            {stats.total.inProgress} in progress
           </span>
          </div>
         )}
         
         {stats.total.solved === stats.total.total && (
          <div className="flex items-center gap-2">
           <div className="w-2 h-2 bg-gradient-to-r from-sage to-teal rounded-full animate-pulse"></div>
           <span className="text-sm text-mint-dark dark:text-emerald-400 font-medium">
            🎉 All problems completed!
           </span>
          </div>
         )}
        </div>
       </div>
      </div>

      {/* Reset Progress Button */}
      {(stats.total.solved > 0 || stats.total.inProgress > 0) && (
       <button
        onClick={() => setShowResetConfirmation(true)}
        className="inline-flex items-center gap-2 px-5 py-2.5 text-[15px] font-medium text-red-600 dark:text-red-400 bg-white/90 dark:bg-accent/10 hover:bg-white /15 border border-red-500/20 dark:border-red-400/20 rounded-[14px] backdrop-blur-xl shadow-[0_1px_2px_rgba(0,0,0,0.05),0_1px_20px_rgba(255,255,255,0.3)_inset] dark:shadow-[0_1px_2px_rgba(0,0,0,0.3),0_1px_20px_rgba(200,216,255,0.1)_inset] hover:shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_30px_rgba(255,255,255,0.4)_inset] dark:hover:shadow-[0_1px_3px_rgba(0,0,0,0.4),0_2px_30px_rgba(255,255,255,0.15)_inset] active:scale-[0.98] transition-all duration-200"
        title="Reset all progress"
       >
        <TrashIcon className="w-4 h-4" />
        Reset Progress
       </button>
      )}
     </div>

     {/* Difficulty Breakdown with Mini Progress Bars */}
     <div className="grid grid-cols-3 gap-4">
      {/* Easy */}
      <div className="bg-white/70 dark:bg-gray-800/70 rounded-lg p-4 backdrop-blur-sm border border-sage/40 dark:border-green-800/30">
       <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-mint-dark dark:text-green-300">Easy</span>
        <span className="text-xs text-mint-dark dark:text-green-400 font-mono">
         {stats.easy.solved}/{stats.easy.total}
        </span>
       </div>
       <div className="w-full bg-green-100 dark:bg-green-900/40 rounded-full h-2.5 overflow-hidden border border-green-200/50 dark:border-green-800/50">
        <div
         className="h-full bg-gradient-to-r from-green-400 to-green-600 dark:from-green-500 dark:to-green-700 rounded-full transition-all duration-1000 ease-out shadow-sm"
         style={{ width: `${(stats.easy.solved / stats.easy.total) * 100}%` }}
        ></div>
       </div>
       <div className="text-right mt-1">
        <span className="text-xs text-mint-dark dark:text-green-400 font-medium">
         {Math.round((stats.easy.solved / stats.easy.total) * 100)}%
        </span>
       </div>
      </div>

      {/* Medium */}
      <div className="bg-white/70 dark:bg-gray-800/70 rounded-lg p-4 backdrop-blur-sm border border-mint/40 dark:border-yellow-800/30">
       <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-teal-dark dark:text-yellow-300">Medium</span>
        <span className="text-xs text-teal-dark dark:text-yellow-400 font-mono">
         {stats.medium.solved}/{stats.medium.total}
        </span>
       </div>
       <div className="w-full bg-yellow-100 dark:bg-yellow-900/40 rounded-full h-2.5 overflow-hidden border border-yellow-200/50 dark:border-yellow-800/50">
        <div
         className="h-full bg-gradient-to-r from-yellow-400 to-yellow-600 dark:from-yellow-500 dark:to-yellow-700 rounded-full transition-all duration-1000 ease-out shadow-sm"
         style={{ width: `${(stats.medium.solved / stats.medium.total) * 100}%` }}
        ></div>
       </div>
       <div className="text-right mt-1">
        <span className="text-xs text-teal-dark dark:text-yellow-400 font-medium">
         {Math.round((stats.medium.solved / stats.medium.total) * 100)}%
        </span>
       </div>
      </div>

      {/* Hard */}
      <div className="bg-white/70 dark:bg-gray-800/70 rounded-lg p-4 backdrop-blur-sm border border-slate/40 dark:border-red-800/30">
       <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-content">Hard</span>
        <span className="text-xs text-content font-mono">
         {stats.hard.solved}/{stats.hard.total}
        </span>
       </div>
       <div className="w-full bg-red-100 dark:bg-red-900/40 rounded-full h-2.5 overflow-hidden border border-red-200/50 dark:border-red-800/50">
        <div
         className="h-full bg-gradient-to-r from-red-400 to-red-600 dark:from-red-500 dark:to-red-700 rounded-full transition-all duration-1000 ease-out shadow-sm"
         style={{ width: `${(stats.hard.solved / stats.hard.total) * 100}%` }}
        ></div>
       </div>
       <div className="text-right mt-1">
        <span className="text-xs text-content font-medium">
         {Math.round((stats.hard.solved / stats.hard.total) * 100)}%
        </span>
       </div>
      </div>
     </div>
    </div>

    {/* Problems by Topic */}
    <div className="space-y-6">
     {Object.entries(blind75Data).map(([topic, problems]) => (
      <div key={topic} className="bg-panel-muted dark:bg-panel-300 rounded-lg shadow-sm border border-panel-200 dark:border-panel-300 p-4">
       <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-content">
         {topic}
        </h3>
        <span className="text-xs text-content-muted dark:text-content-subtle">
         {problems.filter(p => getProblemStatus(p.slug) === 'solved').length}/{problems.length}
        </span>
       </div>
       
       <div className="space-y-2">
        {problems.map((problem) => {
         const status = getProblemStatus(problem.slug);
         const companies = (status === 'solved' || status === 'in_progress') ? getCompaniesForProblem(problem.slug) : [];
         
         return (
          <div
           key={problem.slug}
           ref={(el) => { problemRefs.current[problem.slug] = el; }}
           className={`flex items-center justify-between p-3 rounded-md border transition-all duration-200 ${
            highlightedProblem === problem.slug
             ? 'border-indigo-500 dark:border-indigo-400 ring-4 ring-indigo-500/20 dark:ring-indigo-400/20 shadow-lg shadow-indigo-500/10 dark:shadow-indigo-400/10'
             : status === 'solved'
             ? 'bg-mint-light/40 dark:bg-green-900/10 border-sage/30 dark:border-green-800/30'
             : status === 'in_progress'
             ? 'bg-mint-light/30 dark:bg-yellow-900/10 border-mint/30 dark:border-yellow-800/30'
             : 'bg-panel-muted dark:bg-panel-300 border-panel-200 dark:border-panel-300'
           } ${
            highlightedProblem === problem.slug && status === 'solved'
             ? 'bg-mint-light/40 dark:bg-green-900/10'
             : highlightedProblem === problem.slug && status === 'in_progress'
             ? 'bg-mint-light/30 dark:bg-yellow-900/10'
             : highlightedProblem === problem.slug
             ? 'bg-panel-muted dark:bg-panel-300'
             : ''
           }`}
          >
           <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
             <span className="font-medium text-content truncate">
              {slugToTitle(problem.slug)}
             </span>
             <span className={`text-xs font-medium ${getDifficultyColor(problem.difficulty)} flex-shrink-0`}>
              {problem.difficulty}
             </span>
             {status === 'solved' && (
              <CheckCircleIcon className="w-4 h-4 text-mint-dark dark:text-green-400 flex-shrink-0" />
             )}
             {status === 'in_progress' && (
              <ClockIcon className="w-4 h-4 text-teal-dark dark:text-yellow-400 flex-shrink-0" />
             )}
            </div>
            
            {/* Company Context for Both Solved and In-Progress Problems */}
            {(status === 'solved' || status === 'in_progress') && companies.length > 0 && (
             <div className="mt-1 flex items-center gap-1">
              <span className="text-xs text-content-muted/70 dark:text-content-subtle">
               Recent:
              </span>
              {companies.map((company, index) => (
               <span
                key={index}
                className="text-xs px-2 py-0.5 rounded bg-mint-light/50 text-teal-dark dark:bg-blue-900/30 dark:text-blue-300"
               >
                {company}
               </span>
              ))}
             </div>
            )}
           </div>
           
           <div className="flex items-center gap-2 ml-3">
            {/* Resume/See Solution Button */}
            {(status === 'solved' || status === 'in_progress') && (
             <button
              onClick={() => handleActionClick(problem.slug, status)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[13px] font-medium text-content bg-white/90 dark:bg-accent/10 hover:bg-white /15 border border-black/8 rounded-[12px] backdrop-blur-xl shadow-[0_1px_2px_rgba(0,0,0,0.05),0_1px_20px_rgba(255,255,255,0.3)_inset] dark:shadow-[0_1px_2px_rgba(0,0,0,0.3),0_1px_20px_rgba(200,216,255,0.1)_inset] hover:shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_30px_rgba(255,255,255,0.4)_inset] dark:hover:shadow-[0_1px_3px_rgba(0,0,0,0.4),0_2px_30px_rgba(255,255,255,0.15)_inset] active:scale-[0.98] transition-all duration-200 flex-shrink-0"
             >
              {status === 'solved' ? (
               <>
                <CheckCircleIcon className="w-3.5 h-3.5" />
                See Solution
               </>
              ) : (
               <>
                Resume
               </>
              )}
             </button>
            )}

            {/* Practice Button */}
            <button
             onClick={() => onPracticeWithContext(problem.slug)}
             className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[13px] font-medium text-button-foreground bg-button-600 hover:bg-button-500 border border-button-700 rounded-[12px] backdrop-blur-xl shadow-[0_1px_2px_rgba(0,0,0,0.15),0_1px_20px_rgba(255,255,255,0.25)_inset] hover:shadow-[0_1px_3px_rgba(0,0,0,0.2),0_2px_30px_rgba(255,255,255,0.35)_inset] dark:shadow-[0_1px_2px_rgba(0,0,0,0.1),0_1px_20px_rgba(0,0,0,0.3)_inset] dark:hover:shadow-[0_1px_3px_rgba(0,0,0,0.15),0_2px_30px_rgba(0,0,0,0.4)_inset] active:scale-[0.98] transition-all duration-200 flex-shrink-0"
            >
             Practice
            </button>
           </div>
          </div>
         );
        })}
       </div>
      </div>
     ))}
    </div>

    {/* Reset Confirmation Modal */}
    {showResetConfirmation && (
     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
       <div className="flex items-center gap-3 mb-4">
        <div className="flex-shrink-0 w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
         <AlertTriangleIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
        </div>
        <div>
         <h3 className="text-lg font-semibold text-content">
          Reset All Progress
         </h3>
         <p className="text-sm text-content-muted dark:text-content-subtle">
          This action cannot be undone
         </p>
        </div>
        <button
         onClick={() => setShowResetConfirmation(false)}
         className="ml-auto p-1.5 text-content bg-white/90 dark:bg-accent/10 hover:bg-white /15 backdrop-blur-xl border border-black/8 rounded-[12px] shadow-[0_1px_2px_rgba(0,0,0,0.05),0_1px_20px_rgba(255,255,255,0.3)_inset] dark:shadow-[0_1px_2px_rgba(0,0,0,0.3),0_1px_20px_rgba(200,216,255,0.1)_inset] active:scale-[0.95] transition-all duration-200"
        >
         <XIcon className="w-5 h-5" />
        </button>
       </div>
       
       <p className="text-content-muted dark:text-content-subtle mb-6">
        Are you sure you want to reset all your progress? This will permanently delete:
       </p>
       
       <ul className="text-sm text-content-muted dark:text-content-subtle mb-6 space-y-1">
        <li>• All solved problems ({stats.total.solved} problems)</li>
        <li>• All in-progress problems ({stats.total.inProgress} problems)</li>
        <li>• All saved solutions and company contexts</li>
        <li>• Recent company selections</li>
       </ul>
       
       <div className="flex gap-3">
        <button
         onClick={() => setShowResetConfirmation(false)}
         className="flex-1 px-4 py-2.5 text-[15px] font-medium text-content bg-white/90 dark:bg-accent/10 hover:bg-white /15 backdrop-blur-xl border border-black/8 rounded-[14px] shadow-[0_1px_2px_rgba(0,0,0,0.05),0_1px_20px_rgba(255,255,255,0.3)_inset] dark:shadow-[0_1px_2px_rgba(0,0,0,0.3),0_1px_20px_rgba(200,216,255,0.1)_inset] hover:shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_30px_rgba(255,255,255,0.4)_inset] dark:hover:shadow-[0_1px_3px_rgba(0,0,0,0.4),0_2px_30px_rgba(255,255,255,0.15)_inset] active:scale-[0.98] transition-all duration-200"
        >
         Cancel
        </button>
        <button
         onClick={handleResetProgress}
         className="flex-1 px-4 py-2.5 text-[15px] font-medium text-button-foreground bg-button-600 hover:bg-button-500 border border-button-700 rounded-[14px] backdrop-blur-xl shadow-[0_1px_2px_rgba(0,0,0,0.15),0_1px_20px_rgba(255,255,255,0.25)_inset] hover:shadow-[0_1px_3px_rgba(0,0,0,0.2),0_2px_30px_rgba(255,255,255,0.35)_inset] dark:shadow-[0_1px_2px_rgba(0,0,0,0.1),0_1px_20px_rgba(0,0,0,0.3)_inset] dark:hover:shadow-[0_1px_3px_rgba(0,0,0,0.15),0_2px_30px_rgba(0,0,0,0.4)_inset] active:scale-[0.98] transition-all duration-200"
        >
         Reset Progress
        </button>
       </div>
      </div>
     </div>
    )}

    {/* Copyright Notice */}
    <div className="mt-8 pt-6 border-t border-slate/20 dark:border-gray-700">
     <p className="text-center text-sm text-content-muted dark:text-content-subtle">
      Copyright © 2025 <span className="font-playfair">AlgoIRL</span>. All rights reserved.
     </p>
    </div>
   </div>
  </div>
 );
} 
