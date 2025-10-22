// Study Plan Overview Card Component
// Displays high-level statistics, momentum, and quality metrics for the study plan

import { useState } from 'react';
import {
 Calendar,
 Clock,
 InfoCircle,
 StatsUpSquare,
 TriangleFlag,
 Xmark,
 OpenBook,
 CheckCircle
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
 const [showLikelihoodInfo, setShowLikelihoodInfo] = useState(false);
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

 // Completion likelihood calculation
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
 const totalPlanDays = Math.max(scheduleLength, 1);
 const daysUntilStart = today < planStart ? Math.floor((planStart.getTime() - today.getTime()) / msInDay) : 0;
 const rawDaysIntoPlan = today >= planStart ? Math.floor((today.getTime() - planStart.getTime()) / msInDay) + 1 : 0;
 const daysIntoPlan = Math.min(Math.max(rawDaysIntoPlan, 0), totalPlanDays);
 const expectedProgressRatio = Math.min(daysIntoPlan / totalPlanDays, 1);
 const actualProgressRatio = progressPercentage !== null ? Math.max(Math.min(progressPercentage / 100, 1), 0) : 0;
 const paceRatio =
  expectedProgressRatio > 0
   ? Math.min(Math.max(actualProgressRatio / expectedProgressRatio, 0), 1.3)
   : actualProgressRatio > 0
   ? 1
   : 0.65;
 const rawDaysRemaining = today <= planEnd ? Math.floor((planEnd.getTime() - today.getTime()) / msInDay) + 1 : 0;
 const daysRemaining = Math.max(rawDaysRemaining, 0);
 const overdueDays = today > planEnd ? Math.floor((today.getTime() - planEnd.getTime()) / msInDay) : 0;
 const bufferScore =
  overdueDays > 0 ? 1 / (1 + overdueDays) : Math.min(1, (daysRemaining || 1) / totalPlanDays);
 let probability = Math.round(
  Math.max(0, Math.min((0.45 * paceRatio + 0.35 * actualProgressRatio + 0.2 * bufferScore) * 100, 100))
 );
 if (actualProgressRatio >= 1) {
  probability = 100;
 }
 const probabilityTone =
  probability >= 85
   ? 'You are comfortably ahead of schedule.'
   : probability >= 70
   ? 'Steady pace—keep the rhythm.'
   : probability >= 50
   ? 'Slightly behind—consider a small push.'
   : 'At risk of slipping behind—time to refocus.';
 const probabilityTextClass =
  probability >= 85
   ? 'text-emerald-600 dark:text-emerald-300'
   : probability >= 60
   ? 'text-amber-600 dark:text-amber-300'
   : 'text-rose-600 dark:text-rose-300';
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
    <h2 className="text-xl font-semibold text-content">
     Study Plan Overview
    </h2>
    <div className="text-xs text-content-muted dark:text-content-subtle">
     Generated{' '}
     {new Date(metadata.generatedAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
     })}
    </div>
   </div>

   {/* Completion Likelihood & Timeline Cards */}
   <div className="grid gap-3 sm:grid-cols-2 mb-5">
    <div className="relative overflow-hidden rounded-xl border border-emerald-200/70 dark:border-emerald-800 bg-gradient-to-br from-emerald-50/80 via-white to-emerald-100/60 dark:from-emerald-900/20 dark:via-gray-900/20 dark:to-emerald-800/10 p-4 sm:p-5">
     <div>
      <div className="flex items-center gap-1.5">
       <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
        <StatsUpSquare className="h-3.5 w-3.5" strokeWidth={ICON_STROKE_WIDTH} />
        Completion Likelihood
       </span>
       <button
        onClick={() => setShowLikelihoodInfo(true)}
        className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/60 transition-colors"
        aria-label="About completion likelihood"
        title="How this metric works"
       >
        <InfoCircle className="w-3 h-3" strokeWidth={ICON_STROKE_WIDTH} />
       </button>
      </div>
      <div className={`mt-3 text-3xl font-extrabold ${probabilityTextClass}`}>
       {probability}%
      </div>
      <p className="mt-2 text-xs text-emerald-700/80 dark:text-emerald-200/80">
       {probabilityTone}
      </p>
     </div>
    </div>

    <div className="relative overflow-hidden rounded-xl border border-teal-200/60 dark:border-teal-800 bg-gradient-to-br from-teal-50/70 via-white to-emerald-100/40 dark:from-teal-900/20 dark:via-gray-900/20 dark:to-emerald-800/5 p-4 sm:p-5">
     <div className="flex items-start justify-between gap-4">
      <div>
       <span className="inline-flex items-center gap-1 rounded-full bg-teal-500/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-300">
        <TriangleFlag className="h-3.5 w-3.5" strokeWidth={ICON_STROKE_WIDTH} />
        Timeline Status
       </span>
       <div className="mt-3 text-2xl font-bold text-teal-800 dark:text-teal-200">
        {timelineHeadline}
       </div>
       <p className="mt-2 text-xs text-teal-700/80 dark:text-teal-200/80">
        {timelineSubtext}
       </p>
      </div>
     </div>
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
       className="h-full bg-mint dark:bg-mint-500 transition-all duration-300"
       style={{ width: `${progressPercentage ?? 0}%` }}
      />
     </div>
     <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-content-muted dark:text-content-subtle">
      <span>{completedCount} completed</span>
      <span>{inProgressCount} in progress</span>
      <span>{bookmarkedCount} bookmarked</span>
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
     <div className="flex items-start gap-2 rounded-lg border border-teal-200/70 dark:border-teal-800 bg-teal-50/70 dark:bg-teal-900/20 px-3 py-2.5">
      <InfoCircle className="h-5 w-5 text-teal-600 dark:text-teal-400 flex-shrink-0 mt-0.5" strokeWidth={ICON_STROKE_WIDTH} />
      <div>
       <p className="text-sm font-semibold text-teal-900 dark:text-teal-100 leading-tight">
        {quality.extrapolatedProblems} recommended for {roleArticle} {roleDisplayName} role at {companyName}
       </p>
       <p className="text-xs text-teal-700 dark:text-teal-300 mt-0.5">
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

   {/* Completion Likelihood Info Modal */}
   {showLikelihoodInfo && (
    <div
     className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
     onClick={() => setShowLikelihoodInfo(false)}
    >
     <div
      className="relative bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-emerald-200 dark:border-emerald-700"
      onClick={(e) => e.stopPropagation()}
     >
      {/* Close button */}
      <button
       onClick={() => setShowLikelihoodInfo(false)}
       className="absolute top-4 right-4 text-content-muted dark:text-content-subtle hover:text-content dark:hover:text-button-foreground transition-colors"
       aria-label="Close"
      >
       <Xmark className="w-5 h-5" strokeWidth={ICON_STROKE_WIDTH} />
      </button>

      {/* Title */}
      <h2 className="text-2xl font-bold text-content mb-4 pr-8 flex items-center gap-2">
       <StatsUpSquare className="w-6 h-6 text-emerald-600 dark:text-emerald-400" strokeWidth={ICON_STROKE_WIDTH} />
       Completion Likelihood
      </h2>

      {/* Content */}
      <div className="space-y-4 text-sm text-content-muted dark:text-content-subtle">
       <p className="leading-relaxed">
        This percentage predicts how likely you are to complete your study plan on schedule based on your current momentum.
       </p>

       <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3 border border-emerald-200 dark:border-emerald-800">
        <p className="font-semibold text-emerald-800 dark:text-emerald-200 mb-2">
         This metric considers:
        </p>
        <ul className="space-y-1.5 text-emerald-700 dark:text-emerald-300">
         <li className="flex items-start gap-2">
          <span className="text-emerald-600 dark:text-emerald-400">•</span>
          <span>Your current progress vs. expected progress for this point in the plan</span>
         </li>
         <li className="flex items-start gap-2">
          <span className="text-emerald-600 dark:text-emerald-400">•</span>
          <span>Your pace and momentum compared to the schedule</span>
         </li>
         <li className="flex items-start gap-2">
          <span className="text-emerald-600 dark:text-emerald-400">•</span>
          <span>Time remaining vs. problems left to complete</span>
         </li>
        </ul>
       </div>

       <p className="leading-relaxed">
        <strong className="text-content">This updates automatically</strong> as you complete problems, so you always know where you stand.
       </p>

       <p className="text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-900/10 rounded p-2 border-l-2 border-emerald-400">
        💡 Tip: Check this metric regularly to stay on track and adjust your study pace if needed.
       </p>
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
       <button
        onClick={() => setShowLikelihoodInfo(false)}
        className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors"
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
