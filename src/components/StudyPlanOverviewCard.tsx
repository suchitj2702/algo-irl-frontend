// Study Plan Overview Card Component
// Displays high-level statistics, momentum, and quality metrics for the study plan

import { useState } from 'react';
import {
 Calendar,
 Clock,
 InfoCircle,
 OpenBook,
 CheckCircle,
 Xmark
} from 'iconoir-react';
import { StudyPlanResponse, ROLE_OPTIONS } from '../types/studyPlan';
import { getCompanyDisplayName } from '../utils/companyDisplay';

interface StudyPlanOverviewCardProps {
 studyPlan: StudyPlanResponse['studyPlan'];
 companyId: string;
 progress?: {
  percentage: number;
  completedCount: number;
  totalProblems: number;
  bookmarkedCount?: number;
 inProgressCount?: number;
 };
}

const ICON_STROKE_WIDTH = 1.75;

export function StudyPlanOverviewCard({ studyPlan, companyId, progress }: StudyPlanOverviewCardProps) {
 const companyName = getCompanyDisplayName(companyId);
 const [showUsageGuide, setShowUsageGuide] = useState(false);
 const { totalProblems, estimatedHours, metadata } = studyPlan;
 const { quality } = metadata;
 const roleOption = ROLE_OPTIONS.find(option => option.id === metadata.role);
 const roleDisplayName =
  roleOption?.name ??
  (metadata.role.charAt(0).toUpperCase() + metadata.role.slice(1));
 const roleArticle = /^[aeiou]/i.test(roleDisplayName.trim()) ? 'an' : 'a';
 const progressPercentage = progress ? Math.min(progress.percentage, 100) : null;
 const completedCount = progress?.completedCount ?? 0;
 const totalProgressProblems = progress?.totalProblems ?? totalProblems;
 const bookmarkedCount = progress?.bookmarkedCount ?? 0;
 const inProgressCount = progress?.inProgressCount ?? 0;

 // Timeline calculation
 const msInDay = 1000 * 60 * 60 * 24;
 const normalizeToStartOfDay = (date: Date) => {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
 };
 const scheduleLength = studyPlan.dailySchedule.length;
 const fallbackDate = new Date(metadata.generatedAt);
 const startDate = scheduleLength > 0 ? new Date(studyPlan.dailySchedule[0].date) : fallbackDate;
 const endDate = scheduleLength > 0 ? new Date(studyPlan.dailySchedule[scheduleLength - 1].date) : fallbackDate;
 const today = normalizeToStartOfDay(new Date());
 const planStart = normalizeToStartOfDay(startDate);
 const planEnd = normalizeToStartOfDay(endDate);
 const daysUntilStart = today < planStart ? Math.floor((planStart.getTime() - today.getTime()) / msInDay) : 0;
 const rawDaysRemaining = today <= planEnd ? Math.floor((planEnd.getTime() - today.getTime()) / msInDay) + 1 : 0;
 const daysRemaining = Math.max(rawDaysRemaining, 0);
 const overdueDays = today > planEnd ? Math.floor((today.getTime() - planEnd.getTime()) / msInDay) : 0;
 const actualProgressRatio = progressPercentage !== null ? Math.max(Math.min(progressPercentage / 100, 1), 0) : 0;
 const pluralizeDays = (value: number) => `${value} day${value === 1 ? '' : 's'}`;
 const timelineHeadline =
  actualProgressRatio >= 1
   ? 'Completed'
   : daysUntilStart > 0
   ? `${pluralizeDays(daysUntilStart)} until kickoff`
   : daysRemaining > 0
   ? `${pluralizeDays(daysRemaining)} left`
   : overdueDays > 0
   ? `Overdue by ${pluralizeDays(overdueDays)}`
   : 'On the final stretch';

 // Color coding based on days remaining
 const getTimelineColor = () => {
  if (actualProgressRatio >= 1) return 'text-emerald-600 dark:text-emerald-400';
  if (overdueDays > 0) return 'text-rose-600 dark:text-rose-400';
  if (daysUntilStart > 0) return 'text-blue-600 dark:text-blue-400';

  const totalDays = scheduleLength;
  const daysRatio = daysRemaining / totalDays;

  if (daysRatio > 0.5) return 'text-emerald-600 dark:text-emerald-400'; // Green - plenty of time
  if (daysRatio > 0.25) return 'text-amber-600 dark:text-amber-400'; // Amber - moderate time
  return 'text-rose-600 dark:text-rose-400'; // Red - running out of time
 };
 const timelineSubtext =
  actualProgressRatio >= 1
   ? 'All scheduled problems are done—fantastic work.'
   : daysUntilStart > 0
   ? 'Plan hasn\'t started yet—use this window to prep resources.'
   : daysRemaining > 0
   ? 'Stay consistent to finish comfortably on time.'
   : overdueDays > 0
   ? 'Wrap up the remaining problems to close out the plan.'
   : 'Today is the last scheduled day—finish strong!';

 return (
  <div className="bg-panel-muted dark:bg-panel-300 rounded-xl shadow-md border border-panel-200 dark:border-panel-300 p-4 sm:p-5">
   <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
    <div className="flex items-center gap-2">
     <h2 className="text-xl font-semibold text-content font-playfair">
      Study Plan Overview
     </h2>
     <button
      onClick={() => setShowUsageGuide(true)}
      className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 transition-colors hover:bg-blue-200 dark:hover:bg-blue-900/60"
      aria-label="How to use this study plan"
      title="How to use this study plan"
     >
      <InfoCircle className="w-3.5 h-3.5" strokeWidth={ICON_STROKE_WIDTH} />
     </button>
    </div>
    <div className="text-xs text-content-muted dark:text-content-subtle">
     Generated{' '}
     {new Date(metadata.generatedAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
     })}
    </div>
   </div>

   {progress && (
    <div className="mb-5">
     <div className="flex items-center justify-between mb-2">
      <span className="text-xs font-semibold tracking-wide uppercase text-content-subtle">
       Overall Progress
      </span>
      <span className="text-sm font-semibold text-content">
       {progressPercentage ?? 0}% • {completedCount}/{totalProgressProblems} problems
      </span>
     </div>
     <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
      <div
       className="h-full bg-mint dark:bg-mint-500 transition-all duration-500 ease-out"
       style={{ width: `${progressPercentage ?? 0}%` }}
      />
     </div>
     <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-content-muted dark:text-content-subtle">
      <span>{completedCount} completed</span>
      <span>{inProgressCount} in progress</span>
      <span>{bookmarkedCount} bookmarked</span>
      <span className={getTimelineColor()}>
       {timelineHeadline}
      </span>
     </div>
    </div>
   )}

   {/* Stats Strip */}
   <div className="mb-5 inline-flex max-w-full rounded-lg border border-emerald-200/70 dark:border-emerald-800 bg-white/60 dark:bg-gray-800/40 px-4 py-3">
    <div className="flex flex-nowrap items-center divide-x divide-emerald-400/50 dark:divide-emerald-500/40">
     <div className="flex items-center gap-2 pr-3">
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
       <OpenBook className="h-4 w-4" strokeWidth={ICON_STROKE_WIDTH} />
      </span>
      <div>
       <div className="text-sm font-semibold text-emerald-800 dark:text-emerald-200 leading-tight">
        {totalProblems}
       </div>
       <div className="text-[11px] uppercase tracking-wide text-emerald-700/70 dark:text-emerald-400/80">
        Problems
       </div>
      </div>
     </div>

     <div className="flex items-center gap-2 px-3">
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
       <Calendar className="h-4 w-4" strokeWidth={ICON_STROKE_WIDTH} />
      </span>
      <div>
       <div className="text-sm font-semibold text-emerald-800 dark:text-emerald-200 leading-tight">
        {studyPlan.dailySchedule.length}
       </div>
       <div className="text-[11px] uppercase tracking-wide text-emerald-700/70 dark:text-emerald-400/80">
        Days
       </div>
      </div>
     </div>

     <div className="flex items-center gap-2 pl-3">
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
       <Clock className="h-4 w-4" strokeWidth={ICON_STROKE_WIDTH} />
      </span>
      <div>
       <div className="text-sm font-semibold text-emerald-800 dark:text-emerald-200 leading-tight">
        {Math.round(estimatedHours)}h
       </div>
       <div className="text-[11px] uppercase tracking-wide text-emerald-700/70 dark:text-emerald-400/80">
        Total Time
       </div>
      </div>
     </div>
    </div>
   </div>

   {/* Quality Metrics */}
   <div className="grid gap-3 sm:grid-cols-2">
    <div className="flex items-start gap-2 rounded-lg border border-emerald-200/70 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-900/20 px-3 py-2.5">
     <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" strokeWidth={ICON_STROKE_WIDTH} />
     <div>
      <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100 leading-tight">
       {quality.actualCompanyProblems} actually asked at {companyName}
      </p>
      <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
       Verified interview problems
      </p>
     </div>
    </div>

    {quality.extrapolatedProblems > 0 && (
     <div className="flex items-start gap-2 rounded-lg border border-emerald-200/70 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-900/20 px-3 py-2.5">
      <InfoCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" strokeWidth={ICON_STROKE_WIDTH} />
      <div>
       <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100 leading-tight">
        {quality.extrapolatedProblems} recommended for {roleArticle} {roleDisplayName} role at {companyName}
       </p>
       <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
        Derived from role relevance and company trends
       </p>
      </div>
     </div>
    )}
   </div>

   {!progress && (
    <div className="mt-4 text-xs text-content-muted dark:text-content-subtle">
     Generated{' '}
     {new Date(metadata.generatedAt).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
     })}
    </div>
   )}

   {/* Usage Guide Modal */}
   {showUsageGuide && (
    <div
     className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
     onClick={() => setShowUsageGuide(false)}
    >
     <div
      className="relative bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-blue-200 dark:border-blue-700"
      onClick={(e) => e.stopPropagation()}
     >
      {/* Close button */}
      <button
       onClick={() => setShowUsageGuide(false)}
       className="absolute top-4 right-4 text-content-muted dark:text-content-subtle transition-colors hover:text-content dark:hover:text-button-foreground"
       aria-label="Close"
      >
       <Xmark className="w-5 h-5" strokeWidth={ICON_STROKE_WIDTH} />
      </button>

      {/* Title */}
      <h2 className="text-2xl font-bold text-content mb-4 pr-8 flex items-center gap-2 font-playfair">
       <InfoCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" strokeWidth={ICON_STROKE_WIDTH} />
       How to Use This Study Plan
      </h2>

      {/* Content */}
      <div className="space-y-4 text-sm text-content-muted dark:text-content-subtle">
       <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
        <p className="font-semibold text-blue-800 dark:text-blue-200 mb-3">
         Navigation & Problem Access:
        </p>
        <ul className="space-y-2 text-blue-700 dark:text-blue-300">
         <li className="flex items-start gap-2">
          <span className="text-blue-600 dark:text-blue-400 flex-shrink-0">•</span>
          <span>Click on any day to expand and view problems for that day</span>
         </li>
         <li className="flex items-start gap-2">
          <span className="text-blue-600 dark:text-blue-400 flex-shrink-0">•</span>
          <span>Click "Start" to solve a problem in our coding environment</span>
         </li>
         <li className="flex items-start gap-2">
          <span className="text-blue-600 dark:text-blue-400 flex-shrink-0">•</span>
          <span>Problem titles are revealed once you start or complete them</span>
         </li>
         <li className="flex items-start gap-2">
          <span className="text-blue-600 dark:text-blue-400 flex-shrink-0">•</span>
          <span>Click "Resume" on in-progress problems to continue where you left off</span>
         </li>
        </ul>
       </div>

       <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4 border border-emerald-200 dark:border-emerald-800">
        <p className="font-semibold text-emerald-800 dark:text-emerald-200 mb-3">
         Understanding Problem Indicators:
        </p>
        <ul className="space-y-2 text-emerald-700 dark:text-emerald-300">
         <li className="flex items-start gap-2">
          <span className="text-emerald-600 dark:text-emerald-400 flex-shrink-0">•</span>
          <span><strong>Hotness badge:</strong> Click to see why each problem was prioritized for you</span>
         </li>
         <li className="flex items-start gap-2">
          <span className="text-emerald-600 dark:text-emerald-400 flex-shrink-0">•</span>
          <span><strong>Role fit %:</strong> Shows how relevant the problem is to your target role</span>
         </li>
         <li className="flex items-start gap-2">
          <span className="text-emerald-600 dark:text-emerald-400 flex-shrink-0">•</span>
          <span><strong>Topics:</strong> Toggle to show/hide algorithm patterns and data structures</span>
         </li>
         <li className="flex items-start gap-2">
          <span className="text-emerald-600 dark:text-emerald-400 flex-shrink-0">•</span>
          <span><strong>Difficulty:</strong> Toggle to show/hide Easy/Medium/Hard labels</span>
         </li>
        </ul>
       </div>

       <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
        <p className="font-semibold text-amber-800 dark:text-amber-200 mb-3">
         Organization & Tracking:
        </p>
        <ul className="space-y-2 text-amber-700 dark:text-amber-300">
         <li className="flex items-start gap-2">
          <span className="text-amber-600 dark:text-amber-400 flex-shrink-0">•</span>
          <span>Click "Save" to bookmark problems you want to review later</span>
         </li>
         <li className="flex items-start gap-2">
          <span className="text-amber-600 dark:text-amber-400 flex-shrink-0">•</span>
          <span>Toggle "Saved problems only" to filter and focus on bookmarked problems</span>
         </li>
         <li className="flex items-start gap-2">
          <span className="text-amber-600 dark:text-amber-400 flex-shrink-0">•</span>
          <span>Your progress is automatically saved and synced across sessions</span>
         </li>
         <li className="flex items-start gap-2">
          <span className="text-amber-600 dark:text-amber-400 flex-shrink-0">•</span>
          <span>Track your timeline with color-coded days remaining (green to red)</span>
         </li>
        </ul>
       </div>

       <p className="text-xs text-content bg-gray-50/50 dark:bg-gray-900/10 rounded p-3 border-l-2 border-blue-400">
        💡 <strong>Tip:</strong> Focus on completing problems in order to build a strong foundation. The hotness score helps you prioritize what's most relevant for {companyName} interviews.
       </p>
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
       <button
        onClick={() => setShowUsageGuide(false)}
        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
       >
        Got it!
       </button>
      </div>
     </div>
    </div>
   )}
  </div>
 );
}
