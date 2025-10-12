import { useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { StudyPlanResponse, EnrichedProblem, ROLE_OPTIONS } from '../../../types/studyPlan';
import { StudyPlanOverviewCard } from '../../StudyPlanOverviewCard';
import { DayScheduleCard } from '../../DayScheduleCard';
import { getStudyPlan, getCompletionPercentage } from '../../../utils/studyPlanCache';
import { getAllCachedProblems, parseProblemCacheKey } from '../../../utils/cache';

interface StudyPlanViewProps {
 studyPlan: StudyPlanResponse;
 companyName: string;
 companyId: string;
 studyPlanId?: string | null;
 onBack: () => void;
 onStartProblem: (problem: EnrichedProblem, planId?: string) => void;
 completedProblems?: Set<string>;
 bookmarkedProblems?: Set<string>;
 onToggleBookmark?: (problemId: string) => void;
 inProgressProblems?: Set<string>;
 onResumeProblem?: (problem: EnrichedProblem, planId?: string) => void;
}

export function StudyPlanView({
 studyPlan,
 companyName,
 companyId,
 studyPlanId,
 onBack,
 onStartProblem,
 completedProblems,
 bookmarkedProblems,
 onToggleBookmark,
 inProgressProblems,
 onResumeProblem
}: StudyPlanViewProps) {
 const { studyPlan: plan } = studyPlan;
 const { metadata, dailySchedule } = plan;
 const [showTopics, setShowTopics] = useState(false);
 const [showDifficulty, setShowDifficulty] = useState(false);
 const [showSavedOnly, setShowSavedOnly] = useState(false);
 const problemOrderMap = useMemo(() => {
  const orderMap: Record<string, number> = {};
  let counter = 1;

  dailySchedule.forEach(day => {
   day.problems.forEach(problem => {
    orderMap[problem.problemId] = counter;
    counter += 1;
   });
  });

  return orderMap;
 }, [dailySchedule]);

 const progressInfo = useMemo(() => {
  if (!studyPlanId || typeof window === 'undefined') {
   return {
    completedProblemsSet: completedProblems || new Set<string>(),
    bookmarkedProblemsSet: bookmarkedProblems || new Set<string>(),
    inProgressProblemsSet: inProgressProblems || new Set<string>(),
    completedCount: 0,
    totalProblems: plan.totalProblems,
    percentage: 0
   };
  }

  const cachedPlan = getStudyPlan(studyPlanId);
  const completedFromCache = cachedPlan?.progress.completedProblems ?? [];
  const bookmarkedFromCache = cachedPlan?.progress.bookmarkedProblems ?? [];
  const inProgressFromCache = cachedPlan?.progress.inProgressProblems ?? [];
  const totalProblems = cachedPlan?.response.studyPlan.totalProblems ?? plan.totalProblems;
  const percentage = getCompletionPercentage(studyPlanId);

  const completedSet = completedProblems ?? new Set<string>(completedFromCache);
  const bookmarkedSet = bookmarkedProblems ?? new Set<string>(bookmarkedFromCache);
  const inProgressSet = inProgressProblems ?? new Set<string>(inProgressFromCache);

  return {
   completedProblemsSet: completedSet,
   bookmarkedProblemsSet: bookmarkedSet,
   inProgressProblemsSet: inProgressSet,
   completedCount: completedSet.size,
   totalProblems,
   percentage
  };
 }, [bookmarkedProblems, completedProblems, inProgressProblems, plan.totalProblems, studyPlanId]);

 const completedProblemCount = progressInfo.completedCount;
 const inProgressProblemCount = progressInfo.inProgressProblemsSet?.size ?? 0;

 const cachedPlanProblemTitles = useMemo(() => {
  if (typeof window === 'undefined' || !studyPlanId) {
   return {} as Record<string, string>;
  }

  try {
   const problems = getAllCachedProblems({ includePlanScoped: true });
   const titleMap: Record<string, string> = {};

   problems.forEach(entry => {
    const parsed = parseProblemCacheKey(entry.problemId);
    const planForEntry = entry.planId ?? parsed.planId;

    if (planForEntry !== studyPlanId) {
     return;
    }

    const baseProblemId = parsed.baseProblemId;
    if (!baseProblemId) {
     return;
    }

    if (entry.title && entry.title.trim().length > 0) {
     titleMap[baseProblemId] = entry.title.trim();
    }
   });

   return titleMap;
  } catch (error) {
   if (import.meta.env.DEV) {
    console.error('Error reading study plan problem titles from cache:', error);
   }
   return {} as Record<string, string>;
  }
 }, [companyId, completedProblemCount, inProgressProblemCount, studyPlanId]);

 // Get role display name
 const roleOption = ROLE_OPTIONS.find(r => r.id === metadata.role);
 const roleName = roleOption?.name || metadata.role;

 return (
  <div className="min-h-[calc(100vh-3.5rem)] bg-surface dark:bg-surface py-8 px-4">
   <div className="max-w-6xl mx-auto">
    {/* Header */}
    <div className="mb-8">
     <button
      onClick={onBack}
      className="flex items-center gap-2 text-content-muted dark:text-content-subtle hover:text-content dark:hover:text-button-foreground transition-colors mb-4"
     >
      <ArrowLeft className="w-4 h-4" />
      <span className="text-sm font-medium">Back to Form</span>
     </button>

     <div className="flex flex-wrap items-center gap-3 mb-2">
      <h1 className="text-3xl font-bold text-content">
       Your Study Plan
      </h1>
      <div className="flex items-center gap-2">
       <span className="px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg text-sm font-medium border border-indigo-200 dark:border-indigo-800">
        {companyName}
       </span>
       <span className="px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg text-sm font-medium border border-purple-200 dark:border-purple-800">
        {roleName}
       </span>
      </div>
     </div>

     <p className="text-content-muted dark:text-content-subtle">
      A personalized {dailySchedule.length}-day schedule with {plan.totalProblems} curated problems
     </p>
    </div>

    {/* Overview Card */}
    <div className="mb-8">
     <StudyPlanOverviewCard
      studyPlan={plan}
      companyName={companyName}
      progress={{
       percentage: progressInfo.percentage,
       completedCount: progressInfo.completedCount,
       totalProblems: progressInfo.totalProblems,
       bookmarkedCount: progressInfo.bookmarkedProblemsSet?.size,
       inProgressCount: progressInfo.inProgressProblemsSet?.size
      }}
     />
    </div>

    {/* Daily Schedule */}
    <div className="space-y-4">
     <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
      <h2 className="text-2xl font-bold text-content">
       Daily Schedule
      </h2>
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
       <div className="text-sm text-content-subtle mr-2">
        Click on any day to expand
       </div>
       <button
        type="button"
        onClick={() => setShowTopics(prev => !prev)}
        className="inline-flex items-center gap-2 rounded-full border border-gray-300 dark:border-gray-600 bg-white/90 dark:bg-gray-800/80 px-3 py-1.5 text-sm font-medium text-content-muted dark:text-content-subtle shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        aria-pressed={showTopics}
       >
        <span>{showTopics ? 'Hide topics' : 'Show topics'}</span>
        <span
         className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors ${
          showTopics ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-gray-600'
         }`}
        >
         <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
           showTopics ? 'translate-x-4' : 'translate-x-1'
          }`}
         />
        </span>
       </button>
       <button
        type="button"
        onClick={() => setShowDifficulty(prev => !prev)}
        className="inline-flex items-center gap-2 rounded-full border border-gray-300 dark:border-gray-600 bg-white/90 dark:bg-gray-800/80 px-3 py-1.5 text-sm font-medium text-content-muted dark:text-content-subtle shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        aria-pressed={showDifficulty}
       >
        <span>{showDifficulty ? 'Hide difficulty' : 'Show difficulty'}</span>
        <span
         className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors ${
          showDifficulty ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-gray-600'
         }`}
        >
         <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
           showDifficulty ? 'translate-x-4' : 'translate-x-1'
          }`}
         />
        </span>
       </button>
       <button
        type="button"
        onClick={() => setShowSavedOnly(prev => !prev)}
        className="inline-flex items-center gap-2 rounded-full border border-gray-300 dark:border-gray-600 bg-white/90 dark:bg-gray-800/80 px-3 py-1.5 text-sm font-medium text-content-muted dark:text-content-subtle shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        aria-pressed={showSavedOnly}
       >
        <span>{showSavedOnly ? 'Show all problems' : 'Saved problems only'}</span>
        <span
         className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors ${
          showSavedOnly ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-gray-600'
         }`}
        >
         <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
           showSavedOnly ? 'translate-x-4' : 'translate-x-1'
          }`}
         />
        </span>
       </button>
      </div>
     </div>

     {dailySchedule.map((day, index) => (
      <DayScheduleCard
       key={day.day}
       day={day}
       companyName={companyName}
       roleName={roleName}
       studyPlanId={studyPlanId || undefined}
       completedProblems={progressInfo.completedProblemsSet}
       bookmarkedProblems={progressInfo.bookmarkedProblemsSet}
       inProgressProblems={progressInfo.inProgressProblemsSet}
       onResumeProblem={onResumeProblem}
       onStartProblem={onStartProblem}
       onToggleBookmark={onToggleBookmark}
       showTopics={showTopics}
       showDifficulty={showDifficulty}
       showSavedOnly={showSavedOnly}
       problemOrderMap={problemOrderMap}
       cachedProblemTitles={cachedPlanProblemTitles}
       isExpanded={index === 0} // Expand first day by default
      />
     ))}
    </div>

    {/* Footer Info */}
    <div className="mt-12 p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
     <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
      💡 How to Use This Study Plan
     </h3>
     <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
      <li className="flex items-start gap-2">
       <span className="flex-shrink-0">•</span>
       <span>Click on any problem to start solving it in our coding environment</span>
      </li>
      <li className="flex items-start gap-2">
       <span className="flex-shrink-0">•</span>
       <span>Click the hotness badge to understand why each problem was prioritized</span>
      </li>
      <li className="flex items-start gap-2">
       <span className="flex-shrink-0">•</span>
       <span>Problems with ✓ have been actually asked at {companyName} in interviews</span>
      </li>
      <li className="flex items-start gap-2">
       <span className="flex-shrink-0">•</span>
       <span>Problems with ○ are recommended based on your role and the company's tech stack</span>
      </li>
      <li className="flex items-start gap-2">
       <span className="flex-shrink-0">•</span>
       <span>Your study plan is automatically saved - you can return to it anytime</span>
      </li>
     </ul>
    </div>

    {/* Bottom Padding */}
    <div className="h-8"></div>
   </div>
  </div>
 );
}
