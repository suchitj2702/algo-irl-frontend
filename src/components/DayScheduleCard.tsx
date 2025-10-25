// Day Schedule Card Component
// Accordion-style card for each day in the study plan

import { Calendar, Clock, NavArrowDown } from 'iconoir-react';
import { DaySchedule, EnrichedProblem } from '../types/studyPlan';
import { StudyPlanProblemCard } from './StudyPlanProblemCard';
import { getCompanyDisplayName } from '../utils/companyDisplay';

interface DayScheduleCardProps {
 day: DaySchedule;
 companyId: string;
 roleName: string;
 onStartProblem: (problem: EnrichedProblem, planId?: string) => void;
 studyPlanId?: string;
 completedProblems?: Set<string>;
 bookmarkedProblems?: Set<string>;
 onToggleBookmark?: (problemId: string) => void;
 inProgressProblems?: Set<string>;
 onResumeProblem?: (problem: EnrichedProblem, planId?: string) => void;
 isExpanded?: boolean;
 onToggleExpand?: () => void;
 showTopics: boolean;
 showDifficulty: boolean;
 showSavedOnly: boolean;
 problemOrderMap: Record<string, number>;
 cachedProblemTitles: Record<string, string>;
 highlightedProblemId?: string;
}

const ICON_STROKE_WIDTH = 1.75;

export function DayScheduleCard({
 day,
 companyId,
 roleName,
 onStartProblem,
 studyPlanId,
 completedProblems,
 bookmarkedProblems,
 onToggleBookmark,
 inProgressProblems,
 onResumeProblem,
 isExpanded = false,
 onToggleExpand,
 showTopics,
 showDifficulty,
 showSavedOnly,
 problemOrderMap,
 cachedProblemTitles,
 highlightedProblemId
}: DayScheduleCardProps) {
 const companyName = getCompanyDisplayName(companyId);

 const formattedDate = new Date(day.date).toLocaleDateString('en-US', {
  weekday: 'long',
  month: 'short',
  day: 'numeric'
 });
 const visibleProblems = showSavedOnly
  ? day.problems.filter(problem => bookmarkedProblems?.has(problem.problemId))
  : day.problems;

 return (
  <div className="bg-panel-100 dark:bg-panel-300 rounded-lg shadow-md border border-panel-200 dark:border-panel-300 overflow-hidden hover:shadow-lg">
   {/* Card Header - Always Visible */}
   <button
    onClick={onToggleExpand}
    className="w-full px-6 py-4 flex items-center justify-between hover:bg-panel-accent dark:hover:bg-panel-300"
   >
    <div className="flex items-center gap-4">
     {/* Day Info */}
     <div className="text-left">
      <h3 className="text-lg font-semibold text-content">
       Day {day.day}
      </h3>
      <div className="flex items-center gap-3 mt-1">
       <div className="flex items-center gap-1 text-xs text-content-muted dark:text-content-subtle">
        <Calendar className="w-3 h-3" strokeWidth={ICON_STROKE_WIDTH} />
        <span>{formattedDate}</span>
       </div>
       <div className="flex items-center gap-1 text-xs text-content-muted dark:text-content-subtle">
        <Clock className="w-3 h-3" strokeWidth={ICON_STROKE_WIDTH} />
        <span>{day.estimatedHours.toFixed(1)}h</span>
       </div>
      </div>
     </div>
    </div>

    {/* Right Side Info */}
    <div className="flex items-center gap-4">
     {/* Problem Count Badge */}
     <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-full">
      <span className="text-sm font-semibold text-content">
       {day.problems.length}
      </span>
      <span className="text-xs text-content-muted dark:text-content-subtle">
       problem{day.problems.length !== 1 ? 's' : ''}
      </span>
     </div>

     {/* Expand/Collapse Icon */}
     <NavArrowDown
      className={`w-5 h-5 text-content-subtle ${
       isExpanded ? 'rotate-180' : ''
      }`}
      strokeWidth={ICON_STROKE_WIDTH}
     />
    </div>
   </button>

   {/* Expanded Content - Problem List */}
   {isExpanded && (
    <div className="border-t border-panel-200 dark:border-panel-300 px-6 py-4 space-y-3 bg-panel-muted dark:bg-panel-300">
     {/* Problems */}
     {visibleProblems.length === 0 && (
      <div className="rounded-lg border border-dashed border-panel-200 dark:border-panel-300 bg-panel-100 dark:bg-panel-300 px-4 py-6 text-center text-sm text-panel-strong dark:text-content">
       {showSavedOnly
        ? 'No saved problems for this day yet.'
        : 'No problems available for this day.'}
      </div>
     )}

     {visibleProblems.map((problem, index) => {
      const isCompleted = completedProblems?.has(problem.problemId) ?? false;
      const isBookmarked = bookmarkedProblems?.has(problem.problemId) ?? false;
      const isInProgress = inProgressProblems?.has(problem.problemId) ?? false;
      const resumeHandler =
       onResumeProblem && (isInProgress || isCompleted)
        ? () => onResumeProblem(problem, studyPlanId)
        : undefined;
      const problemSequenceNumber =
       problemOrderMap[problem.problemId] ?? index + 1;
      const placeholderTitle = `Problem ${problemSequenceNumber}`;
      const cachedTitle = cachedProblemTitles[problem.problemId];
      const shouldRevealTitle = isCompleted || isInProgress;
      const displayTitle =
       shouldRevealTitle && cachedTitle ? cachedTitle : placeholderTitle;

      return (
       <StudyPlanProblemCard
        key={`${problem.problemId}-${index}`}
        problem={problem}
        companyId={companyId}
        roleName={roleName}
        isCompleted={isCompleted}
        isBookmarked={isBookmarked}
        isInProgress={isInProgress}
        displayTitle={displayTitle}
        showDifficulty={showDifficulty}
        onToggleBookmark={() => onToggleBookmark?.(problem.problemId)}
        onStartProblem={() => onStartProblem(problem, studyPlanId)}
        showTopics={showTopics}
        onResumeProblem={resumeHandler}
        isHighlighted={highlightedProblemId === problem.problemId}
       />
      );
     })}
    </div>
   )}
  </div>
 );
}
