// Study Plan Overview Card Component
// Displays high-level statistics and quality metrics for the study plan

import { Clock, Calendar, BookOpen, CheckCircle, Info } from 'lucide-react';
import { StudyPlanResponse, ROLE_OPTIONS } from '../types/studyPlan';

interface StudyPlanOverviewCardProps {
 studyPlan: StudyPlanResponse['studyPlan'];
 companyName: string;
 progress?: {
  percentage: number;
  completedCount: number;
  totalProblems: number;
  bookmarkedCount?: number;
  inProgressCount?: number;
 };
}

export function StudyPlanOverviewCard({ studyPlan, companyName, progress }: StudyPlanOverviewCardProps) {
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
       <BookOpen className="h-4 w-4" />
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
       <Calendar className="h-4 w-4" />
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
       <Clock className="h-4 w-4" />
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
     <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
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
      <Info className="h-5 w-5 text-teal-600 dark:text-teal-400 flex-shrink-0 mt-0.5" />
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
  </div>
 );
}
