// Study Plan Problem Card Component
// Horizontal card layout for problems within a day schedule

import { useState, useEffect, useRef, memo } from 'react';
import { Bookmark, BookmarkSolid, CheckCircle, Circle, Clock } from 'iconoir-react';
import { EnrichedProblem } from '../types/studyPlan';
import { HotnessBadge } from './HotnessBadge';
import { HotnessScoreModal } from './HotnessScoreModal';
import { getCompanyDisplayName } from '../utils/companyDisplay';

interface StudyPlanProblemCardProps {
 problem: EnrichedProblem;
 companyId: string;
 roleName: string;
 onStartProblem: () => void;
 isCompleted?: boolean;
 isBookmarked?: boolean;
 onToggleBookmark?: () => void;
 isInProgress?: boolean;
 showTopics?: boolean;
 displayTitle: string;
 showDifficulty?: boolean;
 onResumeProblem?: () => void;
 isHighlighted?: boolean;
}

const ICON_STROKE_WIDTH = 1.75;

const StudyPlanProblemCardComponent: React.FC<StudyPlanProblemCardProps> = ({
 problem,
 companyId,
 roleName,
 onStartProblem,
 isCompleted = false,
 isBookmarked = false,
 onToggleBookmark,
 isInProgress = false,
 showTopics = true,
 displayTitle,
 showDifficulty = true,
 onResumeProblem,
 isHighlighted = false
}) => {
 const companyName = getCompanyDisplayName(companyId);
 const [showHotnessModal, setShowHotnessModal] = useState(false);
 const cardRef = useRef<HTMLDivElement>(null);

 // Auto-scroll to highlighted problem with smooth scroll for better UX
 // This is a user-initiated navigation action (not continuous scrolling),
 // so smooth scroll provides valuable visual feedback without performance impact
 useEffect(() => {
  if (isHighlighted && cardRef.current) {
   setTimeout(() => {
    cardRef.current?.scrollIntoView({
     behavior: 'smooth',
     block: 'center',
     inline: 'nearest'
    });
   }, 300); // Delay to allow day expansion animation
  }
 }, [isHighlighted]);

 const getDifficultyColor = () => {
  switch (problem.difficulty) {
   case 'Easy':
    return 'bg-green-100 text-green-700 dark:bg-emerald-500/20 dark:text-emerald-300 border-green-200 dark:border-emerald-500/40';
   case 'Medium':
    return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/25 dark:text-yellow-200 border-yellow-200 dark:border-yellow-500/40';
   case 'Hard':
    return 'bg-red-100 text-red-700 dark:bg-red-500/25 dark:text-red-200 border-red-200 dark:border-red-500/40';
   default:
    return 'bg-gray-100 text-content-muted dark:bg-gray-700 dark:text-content-subtle border-gray-200 dark:border-gray-600';
  }
 };

 // Get top 3 topics to display
 const displayTopics = [...problem.enrichedTopics.algorithmPatterns, ...problem.enrichedTopics.dataStructures]
  .slice(0, 3);
 const hasResumeHandler = Boolean(onResumeProblem);
 const actionLabel = isCompleted
  ? hasResumeHandler ? 'Review' : 'Start'
  : isInProgress
   ? hasResumeHandler ? 'Resume' : 'Start'
   : 'Start';
 const handleActionClick = () => {
  if ((isInProgress || isCompleted) && onResumeProblem) {
   onResumeProblem();
   return;
  }

  onStartProblem();
 };

 return (
  <>
   <div
    ref={cardRef}
    className={`rounded-lg p-4 transition-all duration-200 ${
     isCompleted
      ? 'bg-green-50/60 dark:bg-emerald-900/20 border border-green-200/50 dark:border-emerald-600/50 hover:shadow-lg hover:shadow-green-500/10'
      : 'bg-white dark:bg-[#334155] border border-gray-200 dark:border-slate-600 hover:shadow-md'
    } ${
     isHighlighted
      ? 'border-indigo-500 dark:border-indigo-400 ring-4 ring-indigo-500/20 dark:ring-indigo-400/20 shadow-lg shadow-indigo-500/10 dark:shadow-indigo-400/10'
      : ''
    }`}
   >
    <div className="flex items-start gap-4">
     {/* Left: Problem Info */}
     <div className="flex-1 min-w-0">
      {/* Title and Difficulty */}
      <div className="flex items-start gap-2 mb-2">
       <div
        className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border ${
         isCompleted
          ? 'bg-green-100 text-green-700 border-green-300 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-600'
          : 'bg-gray-100 text-content-subtle border-gray-200 dark:bg-gray-800 dark:text-content-subtle dark:border-gray-700'
        }`}
       >
        {isCompleted ? (
         <CheckCircle className="w-3.5 h-3.5" strokeWidth={ICON_STROKE_WIDTH} />
        ) : (
         <Circle className="w-3.5 h-3.5" strokeWidth={ICON_STROKE_WIDTH} />
        )}
       </div>
       <h4 className="text-base font-semibold text-content flex-1 truncate">
        {displayTitle}
       </h4>
       {showDifficulty && (
        <span className={`px-2 py-0.5 rounded text-xs font-medium border flex-shrink-0 ${getDifficultyColor()}`}>
         {problem.difficulty}
        </span>
       )}
       {onToggleBookmark && (
        <button
         type="button"
         onClick={(e) => {
          e.stopPropagation();
          onToggleBookmark();
         }}
         className={`flex-shrink-0 ml-1 inline-flex items-center justify-center rounded-full border px-2 py-1 text-xs font-medium transition-colors ${
          isBookmarked
           ? 'border-amber-400 text-amber-700 bg-amber-50 dark:border-amber-500 dark:text-amber-300 dark:bg-amber-900/30'
           : 'border-gray-200 text-content-subtle bg-gray-100 dark:border-gray-700 dark:text-content-subtle dark:bg-gray-800'
         }`}
         aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark problem'}
        >
         {isBookmarked ? (
          <BookmarkSolid className="w-3.5 h-3.5 mr-1" strokeWidth={ICON_STROKE_WIDTH} />
         ) : (
          <Bookmark className="w-3.5 h-3.5 mr-1" strokeWidth={ICON_STROKE_WIDTH} />
         )}
         <span className="hidden sm:inline">{isBookmarked ? 'Saved' : 'Save'}</span>
        </button>
       )}
      </div>

      {/* Topics */}
      {showTopics && displayTopics.length > 0 && (
       <div className="flex flex-wrap gap-2 mb-2">
        {displayTopics.map((topic, index) => (
         <span
          key={`${topic}-${index}`}
          className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-content-muted dark:text-content-subtle rounded text-xs"
         >
          {topic}
         </span>
        ))}
       </div>
      )}

      {/* Bottom Row: Time + Hotness + Role Relevance */}
      <div className={`flex items-center gap-3 flex-wrap ${showTopics ? '' : 'mt-2'}`}>
       {/* Estimated Time */}
       <div className="flex items-center gap-1 text-xs text-content-muted dark:text-content-subtle">
        <Clock className="w-3 h-3" strokeWidth={ICON_STROKE_WIDTH} />
        <span>~{problem.estimatedTimeMinutes} min</span>
       </div>

       {/* Hotness Badge */}
       <HotnessBadge
        problem={problem}
        onClick={() => setShowHotnessModal(true)}
        showTooltip={false}
       />

       {/* Role Relevance Bar (mini) */}
       <div className="hidden sm:flex items-center gap-2">
        <span className="text-xs text-content-muted dark:text-content-subtle">
         {problem.roleRelevance}% role fit
        </span>
        <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
         <div
          className="h-full bg-purple-500"
          style={{ width: `${problem.roleRelevance}%` }}
         />
        </div>
       </div>

       {isInProgress && !isCompleted && (
        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 text-[11px] font-medium text-indigo-700 dark:text-indigo-300">
         <Clock className="w-3 h-3" strokeWidth={ICON_STROKE_WIDTH} />
         In progress
        </span>
       )}
      </div>
     </div>

     {/* Right: Action Button */}
     <button
      onClick={handleActionClick}
      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[13px] font-medium rounded-[12px] backdrop-blur-xl transition-all duration-200 flex-shrink-0 active:scale-[0.98] ${
       isCompleted && hasResumeHandler
        ? 'text-green-700 dark:text-emerald-300 bg-green-50 dark:bg-emerald-900/30 border border-green-300 dark:border-emerald-600 hover:bg-green-100 dark:hover:bg-emerald-900/40'
        : 'text-button-foreground bg-button-600 hover:bg-button-500 border border-button-700 shadow-[0_1px_2px_rgba(0,0,0,0.15),0_1px_20px_rgba(255,255,255,0.25)_inset] dark:shadow-[0_1px_2px_rgba(0,0,0,0.1),0_1px_20px_rgba(0,0,0,0.3)_inset] hover:shadow-[0_1px_3px_rgba(0,0,0,0.2),0_2px_30px_rgba(255,255,255,0.35)_inset] dark:hover:shadow-[0_1px_3px_rgba(0,0,0,0.15),0_2px_30px_rgba(0,0,0,0.4)_inset]'
      }`}
     >
      <span>{actionLabel}</span>
     </button>
    </div>
   </div>

   {/* Hotness Score Modal */}
   {showHotnessModal && (
    <HotnessScoreModal
     problem={problem}
     companyId={companyId}
     roleName={roleName}
     onClose={() => setShowHotnessModal(false)}
    />
   )}
  </>
 );
};

// Export memoized version with custom comparison function
// Return true if props are equal (skip re-render), false if different (re-render)
export const StudyPlanProblemCard = memo(StudyPlanProblemCardComponent, (prevProps, nextProps) => {
 return (
  prevProps.problem.problemId === nextProps.problem.problemId &&
  prevProps.isCompleted === nextProps.isCompleted &&
  prevProps.isBookmarked === nextProps.isBookmarked &&
  prevProps.isInProgress === nextProps.isInProgress &&
  prevProps.showTopics === nextProps.showTopics &&
  prevProps.showDifficulty === nextProps.showDifficulty &&
  prevProps.displayTitle === nextProps.displayTitle &&
  prevProps.isHighlighted === nextProps.isHighlighted
 );
});

// Add display name for debugging
StudyPlanProblemCard.displayName = 'StudyPlanProblemCard';
