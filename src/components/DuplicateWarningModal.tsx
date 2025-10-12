import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Calendar, Target } from 'lucide-react';
import { CachedStudyPlan } from '../types/studyPlan';
import { getCompletionPercentage } from '../utils/studyPlanCache';

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

 const completionPercentage = getCompletionPercentage(existingPlan.id);
 const createdDate = new Date(existingPlan.createdAt).toLocaleDateString('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric'
 });

 const completedCount = existingPlan.progress.completedProblems.length;
 const totalCount = existingPlan.response.studyPlan.totalProblems;

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
       exit={{ opacity: 0, scale: 0.95, y: 10 }}
       transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
       className="bg-panel-muted dark:bg-panel-300 rounded-[20px] shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] border border-panel-200 dark:border-panel-300 max-w-md w-full overflow-hidden"
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

          {/* Progress */}
          <div className="flex items-center gap-2.5 text-sm">
           <Target className="w-4 h-4 text-content-muted dark:text-content-subtle flex-shrink-0" />
           <span className="text-content-muted dark:text-content-subtle">Progress:</span>
           <span className="font-medium text-content">
            {completedCount}/{totalCount} problems ({completionPercentage}%)
           </span>
          </div>

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
           <span><strong>Overwrite:</strong> Generate a new plan and replace the existing one (progress will be lost)</span>
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
         className="w-full px-4 py-2.5 text-sm font-medium text-button-foreground bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 rounded-[10px] transition-all duration-200 active:scale-[0.98] shadow-[0_1px_2px_rgba(0,0,0,0.2)] hover:shadow-[0_2px_4px_rgba(0,0,0,0.25)]"
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
         className="w-full px-4 py-2.5 text-sm font-medium text-content bg-white/90 dark:bg-white/10 hover:bg-white /15 backdrop-blur-xl border border-black/8 rounded-[10px] transition-all duration-200 active:scale-[0.98] shadow-[0_1px_2px_rgba(0,0,0,0.05),0_1px_20px_rgba(255,255,255,0.3)_inset] dark:shadow-[0_1px_2px_rgba(0,0,0,0.3),0_1px_20px_rgba(255,255,255,0.1)_inset]"
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
