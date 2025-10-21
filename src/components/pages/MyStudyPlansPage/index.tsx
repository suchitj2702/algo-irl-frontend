import { motion } from 'framer-motion';
import { Plus, Calendar, Target, Trash2, BookOpen, Clock } from 'lucide-react';
import { CachedStudyPlan, ROLE_OPTIONS } from '../../../types/studyPlan';
import { getStudyPlansFromFirestore, deleteStudyPlanFromFirestore, getCompletionPercentageFromPlan } from '../../../services/studyPlanFirestoreService';
import { getAllCachedPlans, removePlanFromCache, savePlanToCache, migrateToCachedPlanData } from '../../../services/studyPlanCacheService';
import { getCompanyDisplayName } from '../../../utils/companyDisplay';
import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';

interface MyStudyPlansPageProps {
 onCreateNew: () => void;
 onViewPlan: (planId: string) => void;
}

export function MyStudyPlansPage({ onCreateNew, onViewPlan }: MyStudyPlansPageProps) {
 const { user, loading: authLoading } = useAuth();
 const [studyPlans, setStudyPlans] = useState<CachedStudyPlan[]>([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);

 useEffect(() => {
  // Wait for auth to be ready before attempting to load plans
  if (authLoading) {
   return;
  }

  // If no user after auth loads, don't try to fetch (PremiumGate should handle this)
  if (!user) {
   setLoading(false);
   return;
  }

  async function loadPlans() {
   try {
    setLoading(true);

    // Firestore-first approach: Always fetch from server as source of truth
    // This eliminates ghost deleted plans that may still be in localStorage
    console.log('☁️ [Firestore] Loading plans from server (source of truth)');
    const firestorePlans = await getStudyPlansFromFirestore();

    console.log(`☁️ [Sync] Fetched ${firestorePlans.length} plans from Firestore`);

    // Update cache with validated data from Firestore
    // First, get existing cache to find plans that should be removed
    const cachedPlans = getAllCachedPlans();
    const firestorePlanIds = new Set(firestorePlans.map(p => p.id));

    // Remove deleted plans from cache (ghosts)
    const ghostPlans = cachedPlans.filter(cached => !firestorePlanIds.has(cached.planId));
    if (ghostPlans.length > 0) {
      console.log(`🗑️ [Cache] Removing ${ghostPlans.length} deleted plan(s) from cache`);
      ghostPlans.forEach(ghost => {
        removePlanFromCache(ghost.planId);
      });
    }

    // Update cache with current Firestore data
    firestorePlans.forEach(plan => {
      const cached = migrateToCachedPlanData(plan);
      savePlanToCache(cached);
    });

    // Show validated data (no ghosts)
    setStudyPlans(firestorePlans);
    setLoading(false);
   } catch (err) {
    console.error('Failed to load study plans:', err);
    setError('Failed to load study plans. Please try refreshing the page.');
    setLoading(false);
   }
  }
  loadPlans();
 }, [authLoading, user]);

 const handleDeletePlan = async (planId: string, e: React.MouseEvent) => {
  e.stopPropagation(); // Prevent card click

  if (confirm('Are you sure you want to delete this study plan? This action cannot be undone.')) {
   try {
    // Optimistic update - remove from UI immediately
    setStudyPlans(plans => plans.filter(p => p.id !== planId));

    // Remove from cache
    removePlanFromCache(planId);

    // Delete from Firestore in background
    await deleteStudyPlanFromFirestore(planId);

    console.log(`🗑️ Plan ${planId} deleted successfully`);
   } catch (err) {
    console.error('Failed to delete study plan:', err);
    alert('Failed to delete study plan. Please try again.');

    // Reload plans on error
    const updatedPlans = await getStudyPlansFromFirestore();
    setStudyPlans(updatedPlans);
   }
  }
 };

 if (loading) {
  return (
   <div className="min-h-[calc(100vh-3.5rem)] bg-surface dark:bg-surface py-8 px-4 flex items-center justify-center">
    <div className="text-center">
     <div className="animate-spin w-12 h-12 border-4 border-mint-600 border-t-transparent rounded-full mx-auto mb-4"></div>
     <p className="text-content-muted">Loading your study plans...</p>
    </div>
   </div>
  );
 }

 if (error) {
  return (
   <div className="min-h-[calc(100vh-3.5rem)] bg-surface dark:bg-surface py-8 px-4 flex items-center justify-center">
    <div className="text-center max-w-md">
     <div className="text-red-600 dark:text-red-400 mb-4 text-4xl">⚠️</div>
     <p className="text-content mb-4">{error}</p>
     <button
      onClick={() => window.location.reload()}
      className="px-6 py-3 bg-mint-600 hover:bg-mint-700 text-white rounded-lg font-medium transition-colors"
     >
      Refresh Page
     </button>
    </div>
   </div>
  );
 }

 return (
  <div className="min-h-[calc(100vh-3.5rem)] bg-surface dark:bg-surface py-8 px-4">
   <div className="max-w-6xl mx-auto">
    {/* Header */}
    <div className="mb-8">
     <h1 className="text-3xl font-bold text-content mb-2">
      My Study Plans
     </h1>
     <p className="text-content-muted dark:text-content-subtle">
      Manage your personalized interview preparation schedules
     </p>
    </div>

    {/* Create New Button */}
    <motion.button
     initial={{ opacity: 0, y: 8 }}
     animate={{ opacity: 1, y: 0 }}
     transition={{ duration: 0.3 }}
     onClick={onCreateNew}
     className="w-full mb-6 px-6 py-4 bg-gradient-to-r from-mint to-mint-dark dark:from-mint-600 dark:to-mint-700 hover:from-mint-dark hover:to-mint dark:hover:from-mint-500 dark:hover:to-mint-600 text-button-foreground rounded-[16px] shadow-[0_2px_8px_rgba(188,204,220,0.3)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.4)] hover:shadow-[0_4px_16px_rgba(188,204,220,0.4)] dark:hover:shadow-[0_4px_16px_rgba(0,0,0,0.5)] transition-all duration-200 active:scale-[0.98] border border-mint-dark/20 dark:border-mint-500/30"
    >
     <div className="flex items-center justify-center gap-3">
      <Plus className="w-5 h-5" />
      <span className="text-base font-semibold">Create New Study Plan</span>
     </div>
    </motion.button>

    {/* Study Plans List */}
    {studyPlans.length === 0 ? (
     <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="text-center py-16"
     >
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
       <BookOpen className="w-10 h-10 text-content-subtle dark:text-content-muted" />
      </div>
      <h3 className="text-xl font-semibold text-content mb-2">
       No Study Plans Yet
      </h3>
      <p className="text-content-muted dark:text-content-subtle mb-6 max-w-md mx-auto">
       Create your first personalized study plan to start preparing for your target company interview
      </p>
      <button
       onClick={onCreateNew}
       className="inline-flex items-center gap-2 px-6 py-3 bg-button-600 hover:bg-button-500 text-button-foreground text-sm font-medium rounded-[12px] border border-button-700 shadow-[0_1px_2px_rgba(0,0,0,0.15),0_1px_20px_rgba(255,255,255,0.25)_inset] dark:shadow-[0_1px_2px_rgba(0,0,0,0.1),0_1px_20px_rgba(0,0,0,0.3)_inset] transition-all duration-200 active:scale-[0.98]"
      >
       <Plus className="w-4 h-4" />
       Create Your First Plan
      </button>
     </motion.div>
    ) : (
     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {studyPlans.map((plan, index) => {
       const completionPercentage = getCompletionPercentageFromPlan(plan);
       const companyName = getCompanyDisplayName(plan.config.companyId);
       const roleOption = ROLE_OPTIONS.find(r => r.id === plan.config.roleFamily);
       const roleName = roleOption?.name || plan.config.roleFamily;

       const createdDate = new Date(plan.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
       });

       const totalProblems = plan.response.studyPlan.totalProblems;
       const completedCount = plan.progress.completedProblems.length;
       const inProgressCount = plan.progress.inProgressProblems?.length ?? 0;
       const bookmarkCount = plan.progress.bookmarkedProblems?.length ?? 0;

       return (
        <motion.div
         key={plan.id}
         initial={{ opacity: 0, y: 8 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ duration: 0.3, delay: index * 0.05 }}
         onClick={() => onViewPlan(plan.id)}
         className="group relative bg-panel-100 dark:bg-panel-300 backdrop-blur-lg rounded-[16px] border border-panel-200 dark:border-panel-300 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_8px_24px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),0_8px_24px_rgba(0,0,0,0.2)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.08),0_12px_32px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_2px_8px_rgba(0,0,0,0.4),0_12px_32px_rgba(0,0,0,0.3)] transition-all duration-200 cursor-pointer overflow-hidden"
        >
         {/* Progress Bar at Top */}
         <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700">
          <div
           className="h-full bg-gradient-to-r from-mint to-mint-dark dark:from-mint-500 dark:to-mint-600 transition-all duration-300"
           style={{ width: `${completionPercentage}%` }}
          />
         </div>

         <div className="p-5 pt-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
           <div className="flex-1">
            <div className="flex items-center gap-2 mb-1.5">
             <h3 className="text-lg font-semibold text-content">
              {companyName}
             </h3>
             <span className="px-2 py-0.5 bg-mint-100 dark:bg-mint-900/30 text-mint-700 dark:text-mint-300 rounded-md text-xs font-medium border border-mint-200 dark:border-mint-800">
              {plan.config.timeline} days
             </span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-content-muted dark:text-content-subtle">
             <span>{roleName}</span>
            </div>
           </div>

           {/* Delete Button */}
           <button
            onClick={(e) => handleDeletePlan(plan.id, e)}
            className="flex-shrink-0 p-2 text-content-subtle hover:text-red-600 dark:text-content-muted dark:hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
            aria-label="Delete study plan"
           >
            <Trash2 className="w-4 h-4" />
           </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-panel-muted dark:bg-panel-300 rounded-[10px] p-3 border border-panel-200 dark:border-panel-300">
            <div className="flex items-center gap-2 text-xs text-content-muted dark:text-content-subtle mb-1">
             <Target className="w-3.5 h-3.5" />
             <span>Progress</span>
            </div>
           <div className="text-lg font-semibold text-content">
            {completionPercentage}%
           </div>
           <div className="text-[10px] text-content-muted dark:text-content-subtle mt-0.5 space-y-0.5">
            <div>{completedCount}/{totalProblems} completed</div>
            <div>{inProgressCount} in progress</div>
            <div>{bookmarkCount} bookmarked</div>
           </div>
           </div>

           <div className="bg-panel-muted dark:bg-panel-300 rounded-[10px] p-3 border border-panel-200 dark:border-panel-300">
            <div className="flex items-center gap-2 text-xs text-content-muted dark:text-content-subtle mb-1">
             <Clock className="w-3.5 h-3.5" />
             <span>Daily Hours</span>
            </div>
            <div className="text-lg font-semibold text-content">
             {plan.config.hoursPerDay}h
            </div>
            <div className="text-[10px] text-content-muted dark:text-content-subtle mt-0.5">
             per day
            </div>
           </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-black/5 dark:border-white/5">
           <div className="flex items-center gap-1.5 text-xs text-content-muted dark:text-content-subtle">
            <Calendar className="w-3.5 h-3.5" />
            <span>Created {createdDate}</span>
           </div>

           <div className="text-xs font-medium text-mint-700 dark:text-mint-400 opacity-0 group-hover:opacity-100 transition-opacity">
            View Plan →
           </div>
          </div>
         </div>
        </motion.div>
       );
      })}
     </div>
    )}

    {/* Bottom Info */}
    {studyPlans.length > 0 && (
     <div className="mt-8 text-center">
      <p className="text-xs text-content-muted dark:text-content-subtle">
       Showing {studyPlans.length} study plan{studyPlans.length !== 1 ? 's' : ''}.
       {studyPlans.length >= 10 && ' Only the 10 most recent plans are kept.'}
      </p>
     </div>
    )}
   </div>
  </div>
 );
}
