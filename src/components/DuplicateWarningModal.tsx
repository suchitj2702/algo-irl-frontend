import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Calendar, Target, CheckCircle2, Clock, Bookmark } from 'lucide-react';
import { CachedStudyPlan } from '../types/studyPlan';
import { getCompletionPercentageFromPlan } from '../services/studyPlanFirestoreService';

interface DuplicateWarningModalProps {
 isOpen: boolean;
 existingPlan: CachedStudyPlan;
 onOverwrite: () => void;
 onKeepOriginal: () => void;
 onCancel: () => void;
}

export function DuplicateWarningModal({
 isOpen,
 existingPlan,
 onOverwrite,
 onKeepOriginal,
 onCancel
}: DuplicateWarningModalProps) {
 if (!isOpen) return null;

 const completionPercentage = getCompletionPercentageFromPlan(existingPlan);
 const createdDate = new Date(existingPlan.createdAt).toLocaleDateString('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric'
 });

 const completedCount = existingPlan.progress.completedProblems.length;
 const inProgressCount = existingPlan.progress.inProgressProblems?.length || 0;
 const bookmarkedCount = existingPlan.progress.bookmarkedProblems?.length || 0;
 const totalCount = existingPlan.response.studyPlan.totalProblems;
 const hasProgress = completedCount > 0 || inProgressCount > 0;

 return (
  <AnimatePresence>
   {isOpen && (
    <>
     {/* Backdrop */}
     <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onCancel}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
     />

     {/* Modal */}
     <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
       initial={{ opacity: 0, scale: 0.95, y: 10 }}
       animate={{ opacity: 1, scale: 1, y: 0 }}
       exit={{ opacity: 0 }}
       transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
       className="bg-white/95 dark:bg-surface-elevated/90 backdrop-blur-xl rounded-[20px] shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] border border-outline-subtle/80 dark:border-outline-subtle/60 max-w-md w-full overflow-hidden"
      >
       {/* Header */}
       <div className="bg-panel-100 dark:bg-panel-300 border-b border-panel-200 dark:border-panel-300 px-6 py-4">
        <div className="flex items-start gap-3">
         <div className="flex-shrink-0 w-10 h-10 rounded-full bg-panel-accent dark:bg-panel-300 flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-panel-strong dark:text-content" />
         </div>
         <div className="flex-1">
          <h3 className="text-lg font-semibold text-panel-strong dark:text-content">
           Duplicate Study Plan Detected
          </h3>
          <p className="text-sm text-panel-strong opacity-80 dark:text-panel-muted mt-1">
           A study plan with these exact parameters already exists
          </p>
         </div>
         <button
          onClick={onCancel}
          className="flex-shrink-0 text-panel-strong hover:text-panel-300 dark:text-content dark:hover:text-panel-muted transition-colors"
         >
          <X className="w-5 h-5" />
         </button>
        </div>
       </div>

       {/* Content */}
       <div className="p-6 space-y-4">
        <div className="bg-panel-100 dark:bg-panel-300 rounded-[12px] p-4 border border-panel-200 dark:border-panel-300">
         <h4 className="text-sm font-semibold text-content mb-3">
          Existing Plan Details
         </h4>

         <div className="space-y-2.5">
          {/* Creation Date */}
          <div className="flex items-center gap-2.5 text-sm">
           <Calendar className="w-4 h-4 text-content-muted dark:text-content-subtle flex-shrink-0" />
           <span className="text-content-muted dark:text-content-subtle">Created:</span>
           <span className="font-medium text-content">{createdDate}</span>
          </div>

          {/* Overall Progress */}
          <div className="flex items-center gap-2.5 text-sm">
           <Target className="w-4 h-4 text-content-muted dark:text-content-subtle flex-shrink-0" />
           <span className="text-content-muted dark:text-content-subtle">Overall:</span>
           <span className="font-medium text-content">
            {completedCount}/{totalCount} problems ({completionPercentage}%)
           </span>
          </div>

          {/* Detailed Stats */}
          {hasProgress && (
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-panel-200 dark:border-panel-400">
              {/* Completed */}
              <div className="flex flex-col items-center py-2 px-1 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 mb-1" />
                <span className="text-xs font-semibold text-green-700 dark:text-green-300">{completedCount}</span>
                <span className="text-[10px] text-green-600 dark:text-green-400">Completed</span>
              </div>

              {/* In Progress */}
              <div className="flex flex-col items-center py-2 px-1 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400 mb-1" />
                <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">{inProgressCount}</span>
                <span className="text-[10px] text-blue-600 dark:text-blue-400">In Progress</span>
              </div>

              {/* Bookmarked */}
              <div className="flex flex-col items-center py-2 px-1 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <Bookmark className="w-4 h-4 text-amber-600 dark:text-amber-400 mb-1" />
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">{bookmarkedCount}</span>
                <span className="text-[10px] text-amber-600 dark:text-amber-400">Bookmarked</span>
              </div>
            </div>
          )}

          {/* Progress Bar */}
          {completionPercentage > 0 && (
           <div className="mt-3">
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
             <div
              className="h-full bg-mint dark:bg-mint-500 transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
             />
            </div>
           </div>
          )}
         </div>
        </div>

        <div className="bg-panel-100 dark:bg-panel-300 rounded-[12px] p-3 border border-panel-200 dark:border-panel-300">
         <p className="text-xs text-panel-strong dark:text-content">
          <strong>What would you like to do?</strong>
         </p>
         <ul className="mt-2 space-y-1 text-xs text-panel-strong opacity-80 dark:text-panel-muted">
          <li className="flex items-start gap-1.5">
           <span className="flex-shrink-0">•</span>
           <span><strong>Overwrite:</strong> Generate a new plan and replace the existing one {hasProgress && <span className="text-red-600 dark:text-red-400 font-semibold">(⚠️ all progress will be permanently lost)</span>}</span>
          </li>
          <li className="flex items-start gap-1.5">
           <span className="flex-shrink-0">•</span>
           <span><strong>Keep Original:</strong> Keep the existing plan and view it now</span>
          </li>
         </ul>
        </div>
       </div>

       {/* Actions */}
       <div className="px-6 pb-6 space-y-2">
        <button
         onClick={onOverwrite}
         className="w-full px-4 py-2.5 text-sm font-semibold text-white bg-error-600 hover:bg-error-700 dark:bg-error-600 dark:hover:bg-error-700 border border-error-600/60 dark:border-error-500/60 rounded-[10px] shadow-[0_8px_20px_rgba(239,68,68,0.25)] hover:shadow-[0_10px_24px_rgba(220,38,38,0.3)] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error-500/60 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-0 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
         Overwrite Study Plan
        </button>

        <button
         onClick={onKeepOriginal}
         className="w-full px-4 py-2.5 text-sm font-medium text-button-foreground bg-button-600 hover:bg-button-500 border border-button-700 shadow-[0_1px_2px_rgba(0,0,0,0.15),0_1px_20px_rgba(255,255,255,0.25)_inset] dark:shadow-[0_1px_2px_rgba(0,0,0,0.1),0_1px_20px_rgba(0,0,0,0.3)_inset] hover:shadow-[0_1px_3px_rgba(0,0,0,0.2),0_2px_30px_rgba(255,255,255,0.35)_inset] dark:hover:shadow-[0_1px_3px_rgba(0,0,0,0.15),0_2px_30px_rgba(0,0,0,0.4)_inset] rounded-[10px] backdrop-blur-xl transition-all duration-200 active:scale-[0.98]"
        >
         Keep Original Plan
        </button>

        <button
         onClick={onCancel}
         className="w-full px-4 py-2.5 text-sm font-medium text-content bg-white/90 dark:bg-accent/10 hover:bg-white /15 backdrop-blur-xl border border-black/8 rounded-[10px] transition-all duration-200 active:scale-[0.98] shadow-[0_1px_2px_rgba(0,0,0,0.05),0_1px_20px_rgba(255,255,255,0.3)_inset] dark:shadow-[0_1px_2px_rgba(0,0,0,0.3),0_1px_20px_rgba(200,216,255,0.1)_inset]"
        >
         Cancel
        </button>
       </div>
      </motion.div>
     </div>
    </>
   )}
  </AnimatePresence>
 );
}
