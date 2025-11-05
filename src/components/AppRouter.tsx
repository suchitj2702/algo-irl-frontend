import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { IntroSection } from './pages/IntroSection';
import { ProblemForm } from './pages/ProblemForm';
import { StudyPlanLoading } from './pages/StudyPlanLoading';
import { ResumeLoadingSequence } from './ResumeLoadingSequence';
import { ProblemSolver } from './ProblemSolver';
import { ResultsView } from './ResultsView';
import { Blind75 } from './pages/Blind75';
import { CompanyContextForm, CompanyContextFormData } from './pages/CompanyContextForm';
import { StudyPlanForm } from './pages/StudyPlanForm';
import { StudyPlanView } from './pages/StudyPlanView';
import { MyStudyPlansPage } from './pages/MyStudyPlansPage';
import PaymentStatusPage from '@/pages/PaymentStatus';
import { PremiumGate } from './PremiumGate';
import { DuplicateWarningModal } from './DuplicateWarningModal';
import { useFeatureFlags } from '@/contexts/FeatureFlagsContext';
import { DarkModeProvider } from './DarkModeContext';
import { Navbar } from './Navbar';
import { ErrorBoundary } from './ErrorBoundary';
import { Problem, CodeDetails, TestCase, FormData, Company } from '../types';
import { StudyPlanConfig, StudyPlanResponse, EnrichedProblem, CachedStudyPlan, StudyPlanViewState } from '../types/studyPlan';
import { prepareProblem as prepareProblemAPI, generateStudyPlan as generateStudyPlanAPI } from '../utils/api-service';
import { APIAuthenticationError, APIRateLimitError } from '../utils/api-errors';
import { subscribeToRateLimit, getDefaultRateLimitMessage } from '../utils/rateLimitNotifier';
import { saveViewStateToSession, loadViewStateFromSession, createDefaultViewState } from '../utils/viewStateStorage';
import {
 addProblemToCache,
 getCachedProblem,
 markProblemAsSolved,
 updateProblemSolution,
 setCachedProblemData,
 getCachedProblemData,
 buildProblemCacheKey,
 parseProblemCacheKey
} from '../utils/cache';
import { buildProblemCacheKey as buildPlanProblemCacheKey } from '../utils/cache';
import {
  saveStudyPlanToFirestore,
  getStudyPlanFromFirestore,
  getStudyPlansFromFirestore,
  saveProblemCode,
  setProblemStatus,
  toggleProblemBookmark as toggleProblemBookmarkFirestore,
  findDuplicateStudyPlanInFirestore,
  getCompletionPercentageFromPlan,
  saveProblemWithDetails
} from '../services/studyPlanFirestoreService';
import { useDebounceAutoSave } from '../hooks/useDebounceAutoSave';
import { usePlanProgressState } from '../hooks/usePlanProgressState';
import { useStudyPlanAutoSave } from '../hooks/useStudyPlanAutoSave';
import {
  getPlanFromCache,
  getAllCachedPlans,
  savePlanToCache,
  getProblemFromCache,
  updateProblemInCache,
  migrateToCachedPlanData
} from '../services/studyPlanCacheService';
import { getCompanyDisplayName } from '../utils/companyDisplay';
import { extractCleanProblemTitle } from '../utils/problemTitleExtractor';
import { saveBlind75ViewState, loadBlind75ViewState, Blind75ViewState, createDefaultBlind75ViewState } from '../utils/blind75ViewState';
import { normalizeStudyPlanDatasetType } from '../utils/studyPlanDataset';
import { secureLog } from '../utils/secureLogger';

interface TestResultsFromParent {
 passed: boolean;
 executionTime: string;
 testCases: Array<{
  input: string;
  output: string;
  passed: boolean;
 }>;
}

export const MAX_LOADING_DURATION_SECONDS = 60;
const RATE_LIMIT_TOOLTIP_DURATION_MS = 6000;

export function AppRouter() {
 const navigate = useNavigate();
 const location = useLocation();
 const { flags } = useFeatureFlags();

 // Debug logging
 useEffect(() => {
  if (import.meta.env.DEV) {
   console.log('[AppRouter] flags.paymentsEnabled:', flags.paymentsEnabled);
  }
 secureLog.dev('FeatureFlags', 'Payments enabled flag changed', { paymentsEnabled: flags.paymentsEnabled });
}, [flags.paymentsEnabled]);

 useEffect(() => {
  const unsubscribe = subscribeToRateLimit((message) => {
   if (rateLimitTimeoutRef.current) {
    window.clearTimeout(rateLimitTimeoutRef.current);
    rateLimitTimeoutRef.current = null;
   }

   setRateLimitTooltip({
    visible: true,
    message
   });

   rateLimitTimeoutRef.current = window.setTimeout(() => {
    setRateLimitTooltip((prev) => ({
     ...prev,
     visible: false
    }));
    rateLimitTimeoutRef.current = null;
   }, RATE_LIMIT_TOOLTIP_DURATION_MS);
  });

  return () => {
   unsubscribe();
   if (rateLimitTimeoutRef.current) {
    window.clearTimeout(rateLimitTimeoutRef.current);
    rateLimitTimeoutRef.current = null;
   }
  };
 }, []);

 // Problem state
 const [problem, setProblem] = useState<Problem | null>(null);
 const [codeDetails, setCodeDetails] = useState<CodeDetails | null>(null);
 const [solutionFromSolver, setSolutionFromSolver] = useState<string | null>(null);
 const [evaluationResults, setEvaluationResults] = useState<TestResultsFromParent | null>(null);
 const [showSaveProgress, setShowSaveProgress] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [apiResponseReceived, setApiResponseReceived] = useState(false);
 const [isResuming, setIsResuming] = useState(false);
 const [resumeProblemId, setResumeProblemId] = useState<string | null>(null);
 const [resumeDataLoaded, setResumeDataLoaded] = useState(false);

 // Navigation state to prevent double-clicks
 const [isNavigating, setIsNavigating] = useState(false);

 // Blind75 view state tracking
 const [blind75ViewState, setBlind75ViewState] = useState<Blind75ViewState>(createDefaultBlind75ViewState());
 const [returnToBlind75, setReturnToBlind75] = useState(false);

 // Form state
 const [companyContextFormData, setCompanyContextFormData] = useState<CompanyContextFormData>({
  company: 'meta',
  roleFamily: 'backend'
 });
 const [selectedProblemSlug, setSelectedProblemSlug] = useState<string | null>(null);
 const [isCompanyContextFlow, setIsCompanyContextFlow] = useState(false);
 const [currentCompanyId, setCurrentCompanyId] = useState<string>('meta');

 // Study Plan state
 const [studyPlanConfig, setStudyPlanConfig] = useState<StudyPlanConfig | null>(null);
 const [studyPlanResponse, setStudyPlanResponse] = useState<StudyPlanResponse | null>(null);
 const [currentStudyPlanId, setCurrentStudyPlanId] = useState<string | null>(null);
 const [isGeneratingStudyPlan, setIsGeneratingStudyPlan] = useState(false);
 const [studyPlanError, setStudyPlanError] = useState<string | null>(null);
 const [duplicateStudyPlan, setDuplicateStudyPlan] = useState<CachedStudyPlan | null>(null);
 const [showDuplicateModal, setShowDuplicateModal] = useState(false);
 const [pendingStudyPlanConfig, setPendingStudyPlanConfig] = useState<StudyPlanConfig | null>(null);
 const [planProblems, setPlanProblems] = useState<EnrichedProblem[]>([]);
 const [planProblemMap, setPlanProblemMap] = useState<Record<string, { problem: EnrichedProblem; index: number; day: number }>>({});
 const [currentPlanProblemId, setCurrentPlanProblemId] = useState<string | null>(null);
 const [studyPlanViewState, setStudyPlanViewState] = useState<StudyPlanViewState>(createDefaultViewState());

 // Track expanded days and filter states from StudyPlanView
 const [expandedDaysInView, setExpandedDaysInView] = useState<number[]>([]);
 const [filterStatesInView, setFilterStatesInView] = useState({
  showTopics: false,
  showDifficulty: false,
  showSavedOnly: false,
  showGuidance: false
 });

 // Use optimistic state management for plan progress
 const {
   completedProblems: completedPlanProblems,
   bookmarkedProblems: bookmarkedPlanProblems,
   inProgressProblems: inProgressPlanProblems,
   initializeState: initializePlanProgressState,
   toggleBookmark: toggleBookmarkOptimistic,
   toggleCompletion: toggleCompletionOptimistic,
   updateStatus: updateStatusOptimistic,
   forceSync: forceSyncPlanProgress,
   hasPendingChanges: hasPendingProgressChanges
 } = usePlanProgressState({
   planId: currentStudyPlanId,
   onError: (error) => {
     secureLog.error('PlanProgress', error as Error, { planId: currentStudyPlanId });
   }
 });

 // Auto-save state
 const [lastSaveTime, setLastSaveTime] = useState<number>(Date.now());
 const [currentCode, setCurrentCode] = useState<string>('');
const [codeSaveStatus, setCodeSaveStatus] = useState<'saving' | 'saved' | 'error' | undefined>();
const [hasUnsyncedCode, setHasUnsyncedCode] = useState(false);
const [codeSaveTimestamp, setCodeSaveTimestamp] = useState<number | null>(null);
const [rateLimitTooltip, setRateLimitTooltip] = useState({
 visible: false,
 message: getDefaultRateLimitMessage()
});
const rateLimitTimeoutRef = useRef<number | null>(null);

 // Track active problem ID with ref for race condition prevention
 // This ensures debounced saves don't fire for wrong problem after navigation
 const activeProblemIdRef = useRef<string | null>(null);

 // Setup study plan auto-save hook
 const {
   createPlan: createPlanOptimistic,
   saveProgress: savePlanProgress,
   saveProblem: savePlanProblem,
   forceSync: forceSyncStudyPlan,
   hasPendingChanges: hasPendingPlanChanges
 } = useStudyPlanAutoSave({
   onError: (error) => {
     secureLog.error('AutoSave', error as Error, { context: 'StudyPlanAutoSave' });
   },
   onSyncComplete: (planId) => {
     if (import.meta.env.DEV) {
       console.log(`[Study Plan Auto-Save] Sync complete for plan ${planId}`);
     }
     secureLog.dev('AutoSave', 'Study plan sync complete', { planId });
   }
 });

 // Setup hybrid auto-save hook for code editor
 const { autoSave, forceSave } = useDebounceAutoSave({
  localDebounceMs: 500,
  cloudDebounceMs: 3000,
  onLocalSave: (data: { planId: string; problemId: string; code: string }) => {
    // Save to unified cache (instant, accessible via getProblemFromCache)
    updateProblemInCache(data.planId, data.problemId, {
      userCode: data.code
    });

    // Also save to old format for backward compatibility (migration path)
    const key = `problem_${data.planId}_${data.problemId}`;
    localStorage.setItem(key, data.code);
  },
  onCloudSave: async (data: { planId: string; problemId: string; code: string }) => {
    // CRITICAL: Safety check - only save if we're still on this problem
    // This prevents race conditions when navigating during debounce period
    if (activeProblemIdRef.current !== data.problemId) {
      if (import.meta.env.DEV) {
        console.log(`⚠️ [Auto-Save] Skipping stale save - problem changed (${data.problemId} → ${activeProblemIdRef.current})`);
      }
      secureLog.dev('AutoSave', 'Skipping stale save - problem changed', {
        oldProblemId: data.problemId,
        currentProblemId: activeProblemIdRef.current
      });
      return;
    }

    try {
      // Save to Firestore
      await saveProblemCode(data.planId, data.problemId, data.code);
      const now = Date.now();
      setLastSaveTime(now);
      setCodeSaveTimestamp(now);
      setHasUnsyncedCode(false);
      setCodeSaveStatus('saved');

      // Auto-hide "saved" indicator after 2 seconds
      setTimeout(() => {
        setCodeSaveStatus(undefined);
      }, 2000);
    } catch (error) {
      secureLog.error('AutoSave', error as Error, {
        planId: data.planId,
        problemId: data.problemId,
        operation: 'cloudSave'
      });
      setCodeSaveStatus('error');

      // Auto-hide error after 3 seconds
      setTimeout(() => {
        setCodeSaveStatus(undefined);
      }, 3000);
    }
  },
  onError: (error) => {
    secureLog.error('AutoSave', error as Error, { operation: 'autoSave' });
    setCodeSaveStatus('error');
    setHasUnsyncedCode(true);
    setTimeout(() => {
      setCodeSaveStatus(undefined);
    }, 3000);
  }
 });

 const clearPlanSessionContext = useCallback(() => {
  // CRITICAL FIX: Clear BOTH study plan context variables
  // This prevents study plan toolbar from appearing in Blind75 mode
  setCurrentPlanProblemId(null);
  setCurrentStudyPlanId(null);
  setHasUnsyncedCode(false);
 }, []);

 const dismissRateLimitTooltip = useCallback(() => {
  if (rateLimitTimeoutRef.current) {
   window.clearTimeout(rateLimitTimeoutRef.current);
   rateLimitTimeoutRef.current = null;
  }
  setRateLimitTooltip((prev) => ({
   ...prev,
   visible: false
  }));
 }, []);

 const syncPlanStructures = useCallback((response?: StudyPlanResponse | null) => {
  const source = response || studyPlanResponse;
  if (!source) {
   setPlanProblems([]);
   setPlanProblemMap({});
   return;
  }

  const flattened: EnrichedProblem[] = [];
  const nextMap: Record<string, { problem: EnrichedProblem; index: number; day: number }> = {};

  source.studyPlan.dailySchedule.forEach(day => {
   day.problems.forEach(problem => {
    const index = flattened.length;
    flattened.push(problem);
    nextMap[problem.problemId] = {
     problem,
     index,
     day: day.day
    };
   });
  });

  setPlanProblems(flattened);
  setPlanProblemMap(nextMap);
 }, [studyPlanResponse]);

 const syncPlanProgress = useCallback(async (planId?: string) => {
  const activePlanId = planId || currentStudyPlanId;
  if (!activePlanId) {
   initializePlanProgressState(new Set(), new Set(), new Set());
   return;
  }

  try {
   // Check cache first for instant load
   const cachedPlan = getPlanFromCache(activePlanId);
   if (cachedPlan) {
     if (import.meta.env.DEV) {
       console.log(`💾 [Progress Sync] Loading from cache for plan ${activePlanId}`);
     }
     secureLog.dev('ProgressSync', 'Loading from cache', { planId: activePlanId });
     initializePlanProgressState(
       new Set(cachedPlan.progress.completedProblems || []),
       new Set(cachedPlan.progress.bookmarkedProblems || []),
       new Set(cachedPlan.progress.inProgressProblems || [])
     );
     return;
   }

   // Fallback to Firestore only if not cached
   if (import.meta.env.DEV) {
     console.log(`☁️ [Progress Sync] Loading from Firestore for plan ${activePlanId}`);
   }
   secureLog.dev('ProgressSync', 'Loading from Firestore', { planId: activePlanId });
   const firestorePlan = await getStudyPlanFromFirestore(activePlanId);
   if (!firestorePlan) return;

   initializePlanProgressState(
     new Set(firestorePlan.progress.completedProblems || []),
     new Set(firestorePlan.progress.bookmarkedProblems || []),
     new Set(firestorePlan.progress.inProgressProblems || [])
   );
  } catch (error) {
   secureLog.error('ProgressSync', error as Error, { planId: activePlanId });
  }
 }, [currentStudyPlanId, initializePlanProgressState]);

 // Helper: Find which day a problem belongs to
 const findDayForProblem = useCallback((problemId: string): number | undefined => {
  if (!studyPlanResponse) return undefined;

  for (const day of studyPlanResponse.studyPlan.dailySchedule) {
   if (day.problems.some(p => p.problemId === problemId)) {
    return day.day;
   }
  }
  return undefined;
 }, [studyPlanResponse]);

 useEffect(() => {
  syncPlanStructures();
 }, [studyPlanResponse, syncPlanStructures]);

const handleHomeClick = () => navigate('/');
 const handleBlind75Click = () => navigate('/blind75');
 const handleStudyPlansClick = () => navigate('/my-study-plans');

 // Study Plan navigation handlers
 const handleCreateNewStudyPlan = () => {
  navigate('/study-plan-form');
 };

 const handleViewStudyPlan = async (planId: string) => {
  try {
   // 🎯 FIX: Load plan-specific view state OR create fresh default
   // This prevents stale view state from previous plans causing incorrect highlighting
   const savedViewState = loadViewStateFromSession(planId);
   setStudyPlanViewState(savedViewState || createDefaultViewState());
   if (import.meta.env.DEV) {
     console.log(`🔄 [ViewState] ${savedViewState ? 'Restored' : 'Reset to default'} view state for plan ${planId}`);
   }
   secureLog.dev('ViewState', savedViewState ? 'Restored view state' : 'Reset to default', { planId });

   // Load from cache first for instant display
  const cachedPlan = getPlanFromCache(planId);

  if (cachedPlan) {
    const normalizedConfig = normalizeStudyPlanDatasetType(
      cachedPlan.config,
      cachedPlan.response.studyPlan.dailySchedule
    );
    const planForState = normalizedConfig === cachedPlan.config
      ? cachedPlan
      : { ...cachedPlan, config: normalizedConfig };

    if (planForState !== cachedPlan) {
      savePlanToCache(planForState);
    }

     // Instant load from cache
     if (import.meta.env.DEV) {
       console.log(`💾 [Cache] Loading plan ${planId} from cache`);
     }
     secureLog.dev('Cache', 'Loading plan from cache', { planId });
     setCurrentStudyPlanId(planId);
     setStudyPlanConfig(planForState.config);
     setStudyPlanResponse(planForState.response);
     syncPlanStructures(planForState.response);

     // Initialize progress from cache
     initializePlanProgressState(
       new Set(planForState.progress.completedProblems),
       new Set(planForState.progress.bookmarkedProblems),
       new Set(planForState.progress.inProgressProblems)
     );

     setCurrentPlanProblemId(null);
     navigate('/study-plan-view');

     // Note: Background Firestore sync removed to eliminate unnecessary API calls
     // Cache is the source of truth during active session
     // Cross-device sync happens on page load via MyStudyPlansPage
   } else {
     // No cache, load from Firestore
     if (import.meta.env.DEV) {
       console.log(`☁️ [Firestore] Loading plan ${planId} from Firestore (not cached)`);
     }
     secureLog.dev('Firestore', 'Loading plan from Firestore', { planId });
     const plan = await getStudyPlanFromFirestore(planId);

     if (!plan) {
       secureLog.error('Firestore', new Error('Study plan not found'), { planId });
       return;
     }

     // Save to cache for next time - PASS problemProgress to migration
     // This ensures problemDetails are populated from Firestore data
     const normalizedConfig = normalizeStudyPlanDatasetType(
       plan.config,
       plan.response.studyPlan.dailySchedule
     );
     const normalizedPlan = normalizedConfig === plan.config
       ? plan
       : { ...plan, config: normalizedConfig };

     const cachedData = migrateToCachedPlanData(normalizedPlan, normalizedPlan.progress.problemProgress);
     savePlanToCache(cachedData);

     setCurrentStudyPlanId(planId);
     setStudyPlanConfig(normalizedPlan.config);
     setStudyPlanResponse(normalizedPlan.response);
     syncPlanStructures(normalizedPlan.response);

     // Initialize progress from Firestore data (already fetched, no need for blocking call)
     initializePlanProgressState(
       new Set(normalizedPlan.progress.completedProblems || []),
       new Set(normalizedPlan.progress.bookmarkedProblems || []),
       new Set(normalizedPlan.progress.inProgressProblems || [])
     );

     setCurrentPlanProblemId(null);
     navigate('/study-plan-view');
   }
  } catch (error) {
   secureLog.error('StudyPlan', error as Error, { planId, operation: 'load' });
  }
 };

 // Handle practice with company context
 const handlePracticeWithContext = (problemSlug: string) => {
  // 🎯 CAPTURE VIEW STATE BEFORE NAVIGATION (for Blind75 back button)
  const capturedViewState: Blind75ViewState = {
    scrollY: window.scrollY,
    lastViewedProblemSlug: problemSlug,
    lastUpdated: Date.now()
  };

  // Save to React state (primary)
  setBlind75ViewState(capturedViewState);

  // Save to sessionStorage (backup for page reloads)
  saveBlind75ViewState(capturedViewState);

  // Set flag to show back button in ProblemSolver
  setReturnToBlind75(true);

  if (import.meta.env.DEV) {
    console.log('📸 Captured Blind75 view state:', {
      scrollY: capturedViewState.scrollY,
      problemSlug: capturedViewState.lastViewedProblemSlug
    });
  }
  secureLog.dev('ViewState', 'Captured Blind75 view state', {
    scrollY: capturedViewState.scrollY,
    problemSlug: capturedViewState.lastViewedProblemSlug
  });

  // Clear ref when leaving study plan context
  activeProblemIdRef.current = null;

  // Clear visual state
  setProblem(null);
  setCodeDetails(null);
  setSolutionFromSolver(null);
  setEvaluationResults(null);

  clearPlanSessionContext();
  setSelectedProblemSlug(problemSlug);
  setIsCompanyContextFlow(true);
  navigate('/company-context-form');
 };

 // Company context form submission
 const handleCompanyContextSubmit = async (data: CompanyContextFormData) => {
  try {
   // CRITICAL FIX: Clear study plan context first (prevents toolbar in Blind75)
   clearPlanSessionContext();

   // CRITICAL FIX: Update ref immediately (for Blind75 context)
   // Use selectedProblemSlug which is the actual problem being requested
   activeProblemIdRef.current = selectedProblemSlug || null;

   setCompanyContextFormData(data);
   setCurrentCompanyId(data.company);

   // Note: Removed planProblemMap sync and setCurrentPlanProblemId here
   // Those were accidentally setting plan context for Blind75 problems

   navigate('/loading');
   setError(null);
   setProblem(null);
   setCodeDetails(null);
   setEvaluationResults(null);
   setSolutionFromSolver(null);
   setApiResponseReceived(false);
   setIsResuming(false);
   setResumeProblemId(null);

   const { company, roleFamily } = data;
   const isBlind75 = true;
   const companyId = company;
   const companyName = getCompanyDisplayName(company);

   let apiPayload: any = { companyId, isBlind75 };
   if (selectedProblemSlug) {
    apiPayload.problemId = selectedProblemSlug;
   } else {
    const difficulties = ['Easy', 'Medium', 'Hard'];
    apiPayload.difficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
   }
   if (roleFamily) {
    apiPayload.roleFamily = roleFamily;
   }

   const responseData = await prepareProblemAPI(
    apiPayload.problemId,
    apiPayload.companyId,
    apiPayload.difficulty,
    apiPayload.isBlind75,
    apiPayload.roleFamily
   );

   const apiTestCases = responseData.problem?.testCases || [];
   const formattedTestCases: TestCase[] = apiTestCases.map((tc: any) => ({
    id: tc.id || undefined,
    stdin: tc.input || tc.stdin,
    expectedStdout: tc.output || tc.expected_output || tc.expectedOutput || tc.expectedStdout,
    isSample: tc.isSample === true || tc.is_sample === true,
    explanation: tc.explanation || undefined,
   }));

   const baseProblemId = responseData.problem?.id || responseData.problem?.problemId || `${selectedProblemSlug || 'random'}_${Date.now()}`;
   const uniqueProblemId = buildProblemCacheKey(baseProblemId, companyId);

   const formattedProblem: Problem = {
    title: extractCleanProblemTitle(
      responseData.problem?.title || "Algorithm Challenge",
      companyId
    ),
    background: responseData.problem?.background || "",
    problemStatement: responseData.problem?.problemStatement || "",
    testCases: formattedTestCases,
    constraints: responseData.problem?.constraints || [],
    requirements: responseData.problem?.requirements || [],
    leetcodeUrl: responseData.problem?.leetcodeUrl || "",
    problemId: uniqueProblemId
   };

   const formattedCodeDetails: CodeDetails = {
    boilerplateCode: responseData.codeDetails?.boilerplateCode || "",
    defaultUserCode: responseData.codeDetails?.defaultUserCode || "",
    functionName: responseData.codeDetails?.functionName || "",
    solutionStructureHint: responseData.codeDetails?.solutionStructureHint || "",
    language: responseData.codeDetails?.language || "python"
   };

   if (!formattedProblem.problemStatement || !formattedProblem.testCases || formattedProblem.testCases.length === 0 || !formattedProblem.constraints) {
    throw new Error("Invalid problem data received from API. Missing statement, test cases, or constraints.");
   }

   setCachedProblemData(uniqueProblemId, formattedProblem, formattedCodeDetails);

   addProblemToCache(
    baseProblemId,
    'in_progress',
    formattedCodeDetails.defaultUserCode || '',
    companyId,
    companyName,
    selectedProblemSlug ? 'Mixed' : 'Random',
    formattedProblem.title
   );

   setApiResponseReceived(true);
   setProblem(formattedProblem);
   setCodeDetails(formattedCodeDetails);
   navigate('/problem', { replace: true });

  } catch (err) {
   secureLog.error('ProblemPreparation', err as Error, {
     companyId: data.company,
     problemSlug: selectedProblemSlug,
     context: 'contextualized'
   });

  if (err instanceof APIRateLimitError) {
    setError(null);
  } else if (err instanceof APIAuthenticationError) {
    setError(err.message + ' Please refresh the page and try again.');
  } else {
    setError(err instanceof Error ? err.message : 'An unexpected error occurred');
  }
   navigate('/company-context-form');
  }
 };

 const handleCompanyContextCancel = () => {
  setSelectedProblemSlug(null);
  setIsCompanyContextFlow(false);
  navigate('/blind75');
 };

 const handleResumeProblem = async (problemId: string) => {
  try {
   // 🎯 CAPTURE VIEW STATE BEFORE NAVIGATION (for Blind75 back button)
   // Extract problem slug from problemId (format: "slug_companyId")
   const problemSlug = problemId.split('_')[0];

   const capturedViewState: Blind75ViewState = {
     scrollY: window.scrollY,
     lastViewedProblemSlug: problemSlug,
     lastUpdated: Date.now()
   };

   // Save to React state (primary)
   setBlind75ViewState(capturedViewState);

   // Save to sessionStorage (backup for page reloads)
   saveBlind75ViewState(capturedViewState);

   // Set flag to show back button in ProblemSolver
   setReturnToBlind75(true);

   if (import.meta.env.DEV) {
     console.log('📸 Captured Blind75 view state (Resume):', {
       scrollY: capturedViewState.scrollY,
       problemSlug: capturedViewState.lastViewedProblemSlug
     });
   }
   secureLog.dev('ViewState', 'Captured Blind75 view state on resume', {
     scrollY: capturedViewState.scrollY,
     problemSlug: capturedViewState.lastViewedProblemSlug
   });

   // CRITICAL FIX: Update ref immediately (for Blind75 resume)
   activeProblemIdRef.current = problemId;

   // Clear visual state
   setProblem(null);
   setCodeDetails(null);
   setSolutionFromSolver(null);
   setEvaluationResults(null);

   setIsResuming(true);
   setResumeProblemId(problemId);
   setResumeDataLoaded(false);
   navigate('/resume-loading');

   const cachedProblem = getCachedProblem(problemId);
   if (!cachedProblem) {
    throw new Error('Cached problem not found');
   }

   const cachedProblemData = getCachedProblemData(problemId);

   if (cachedProblemData) {
    const storedProblem: Problem = {
     ...cachedProblemData.problem,
     problemId
    };

    const storedCodeDetails: CodeDetails = {
     ...cachedProblemData.codeDetails
    };

    setProblem(storedProblem);
    setCodeDetails(storedCodeDetails);
    setSolutionFromSolver(cachedProblem.solution);
    setResumeDataLoaded(true);
    return;
   }

   const parsedKey = parseProblemCacheKey(problemId);
   const baseProblemId = parsedKey.baseProblemId;
   const companyId = cachedProblem.companyId || parsedKey.companyId;

   const responseData = await prepareProblemAPI(
    baseProblemId,
    companyId,
    undefined,
    true
   );

   const apiTestCases = responseData.problem?.testCases || [];
   const formattedTestCases: TestCase[] = apiTestCases.map((tc: any) => ({
    id: tc.id || undefined,
    stdin: tc.input || tc.stdin,
    expectedStdout: tc.output || tc.expected_output || tc.expectedOutput || tc.expectedStdout,
    isSample: tc.isSample === true || tc.is_sample === true,
    explanation: tc.explanation || undefined,
   }));

   const formattedProblem: Problem = {
    title: extractCleanProblemTitle(
      responseData.problem?.title || "Algorithm Challenge",
      companyId
    ),
    background: responseData.problem?.background || "",
    problemStatement: responseData.problem?.problemStatement || "",
    testCases: formattedTestCases,
    constraints: responseData.problem?.constraints || [],
    requirements: responseData.problem?.requirements || [],
    leetcodeUrl: responseData.problem?.leetcodeUrl || "",
    problemId: problemId
   };

   const formattedCodeDetails: CodeDetails = {
    boilerplateCode: responseData.codeDetails?.boilerplateCode || "",
    defaultUserCode: responseData.codeDetails?.defaultUserCode || "",
    functionName: responseData.codeDetails?.functionName || "",
    solutionStructureHint: responseData.codeDetails?.solutionStructureHint || "",
    language: responseData.codeDetails?.language || "python"
   };

   setCachedProblemData(problemId, formattedProblem, formattedCodeDetails);

   setProblem(formattedProblem);
   setCodeDetails(formattedCodeDetails);
   setSolutionFromSolver(cachedProblem.solution);
   setResumeDataLoaded(true);

  } catch (err) {
   secureLog.error('ProblemResume', err as Error, { problemId });

  if (err instanceof APIRateLimitError) {
   setError(null);
  } else if (err instanceof APIAuthenticationError) {
   setError(err.message + ' Please refresh the page and try again.');
  } else {
   setError(err instanceof Error ? err.message : 'An unexpected error occurred while resuming');
  }
   navigate('/blind75');
   setIsResuming(false);
   setResumeProblemId(null);
   setResumeDataLoaded(false);
  }
 };

 const handleFormSubmit = async (data: FormData) => {
  try {
   clearPlanSessionContext();
   setCurrentCompanyId(data.company);
   setIsCompanyContextFlow(false);
   navigate('/loading');
   setError(null);
   setProblem(null);
   setCodeDetails(null);
   setEvaluationResults(null);
   setSolutionFromSolver(null);
   setApiResponseReceived(false);
   setIsResuming(false);
   setResumeProblemId(null);

   const { company, difficulty, specificProblemSlug } = data;
   const isBlind75 = data.dataset === 'blind75';
   const companyId = company;
   const companyName = getCompanyDisplayName(company);

   let apiPayload: any = { companyId, isBlind75 };
   if (specificProblemSlug) {
    apiPayload.problemId = specificProblemSlug;
   } else {
    apiPayload.difficulty = difficulty;
   }

   const responseData = await prepareProblemAPI(
    apiPayload.problemId,
    apiPayload.companyId,
    apiPayload.difficulty,
    apiPayload.isBlind75
   );

   const apiTestCases = responseData.problem?.testCases || [];
   const formattedTestCases: TestCase[] = apiTestCases.map((tc: any) => ({
    id: tc.id || undefined,
    stdin: tc.input || tc.stdin,
    expectedStdout: tc.output || tc.expected_output || tc.expectedOutput || tc.expectedStdout,
    isSample: tc.isSample === true || tc.is_sample === true,
    explanation: tc.explanation || undefined,
   }));

   const baseProblemId = responseData.problem?.id || responseData.problem?.problemId || specificProblemSlug || `${difficulty}_${Date.now()}`;
   const uniqueProblemId = buildProblemCacheKey(baseProblemId, companyId);

   const formattedProblem: Problem = {
    title: extractCleanProblemTitle(
      responseData.problem?.title || "Algorithm Challenge",
      companyId
    ),
    background: responseData.problem?.background || "",
    problemStatement: responseData.problem?.problemStatement || "",
    testCases: formattedTestCases,
    constraints: responseData.problem?.constraints || [],
    requirements: responseData.problem?.requirements || [],
    leetcodeUrl: responseData.problem?.leetcodeUrl || "",
    problemId: uniqueProblemId
   };

   const formattedCodeDetails: CodeDetails = {
    boilerplateCode: responseData.codeDetails?.boilerplateCode || "",
    defaultUserCode: responseData.codeDetails?.defaultUserCode || "",
    functionName: responseData.codeDetails?.functionName || "",
    solutionStructureHint: responseData.codeDetails?.solutionStructureHint || "",
    language: responseData.codeDetails?.language || "python"
   };

   if (!formattedProblem.problemStatement || !formattedProblem.testCases || formattedProblem.testCases.length === 0 || !formattedProblem.constraints) {
    throw new Error("Invalid problem data received from API. Missing statement, test cases, or constraints.");
   }

   addProblemToCache(
    baseProblemId,
    'in_progress',
    formattedCodeDetails.defaultUserCode || '',
    companyId,
    companyName,
    specificProblemSlug ? 'Mixed' : difficulty,
    formattedProblem.title
   );

   setApiResponseReceived(true);
   setProblem(formattedProblem);
   setCodeDetails(formattedCodeDetails);
   navigate('/problem', { replace: true });

  } catch (err) {
   secureLog.error('ProblemPreparation', err as Error, {
     companyId: data.company,
     difficulty: data.difficulty,
     problemSlug: data.specificProblemSlug
   });
   setError(err instanceof Error ? err.message : 'An unexpected error occurred');
   navigate('/form');
  }
 };

 const handleCodeChange = async (code: string) => {
  setCurrentCode(code);
  if (currentStudyPlanId && currentPlanProblemId) {
    setHasUnsyncedCode(true);
  }
  setCodeSaveStatus('saving'); // Show "Saving..." immediately

  // For non-study-plan problems, keep using cache.ts
  if (problem?.problemId && !currentStudyPlanId) {
   updateProblemSolution(problem.problemId, code);
  }

  // For study plan problems, use hybrid auto-save (all edits debounced)
  if (currentStudyPlanId && currentPlanProblemId) {
    autoSave({
      planId: currentStudyPlanId,
      problemId: currentPlanProblemId,
      code
    });
  }
 };

 const handleFinalSolutionSubmit = (code: string, executionResults: any) => {
  setSolutionFromSolver(code);

  if (problem?.problemId) {
   // Non-study-plan: keep using cache.ts
   if (!currentStudyPlanId) {
    markProblemAsSolved(problem.problemId, code);
   }

   // Study plan: update Firestore
   if (currentStudyPlanId && currentPlanProblemId) {
    // Trigger final code save via debounced auto-save
    autoSave({
      planId: currentStudyPlanId,
      problemId: currentPlanProblemId,
      code
    });

    // Mark as solved (optimistic update + queues debounced sync)
    updateStatusOptimistic(currentPlanProblemId, 'solved');

    // Both sync in background - no await, no latency!
   }
  }

  // Convert real execution results to the format expected by ResultsView
  const formattedResults: TestResultsFromParent = {
    passed: executionResults.passed,
    executionTime: executionResults.executionTime ? `${executionResults.executionTime.toFixed(1)}ms` : 'N/A',
    testCases: executionResults.testCaseResults.map((tcResult: any) => ({
      input: typeof tcResult.testCase.stdin === 'object' ? JSON.stringify(tcResult.testCase.stdin) : String(tcResult.testCase.stdin),
      output: typeof tcResult.testCase.expectedStdout === 'object' ? JSON.stringify(tcResult.testCase.expectedStdout) : String(tcResult.testCase.expectedStdout),
      passed: tcResult.passed
    })),
  };
  setEvaluationResults(formattedResults);
  setShowSaveProgress(true);
  navigate('/results');
};

 const handleGoBackToProblem = () => {
  // If in study plan context, stay in study plan routes
  if (currentStudyPlanId) {
    navigate('/study-plan/problem');
  } else {
    navigate('/problem');
  }
 };

 const handleResumeLoadingComplete = () => {
  navigate('/problem', { replace: true });
  setIsResuming(false);
  setResumeProblemId(null);
  setResumeDataLoaded(false);
 };

 // Study Plan handlers
 const handleGenerateStudyPlan = async (config: StudyPlanConfig) => {
  try {
   setIsGeneratingStudyPlan(true);
   setStudyPlanError(null);
   navigate('/study-plan-loading');

   // Check for duplicate while showing loading screen
   const duplicate = await findDuplicateStudyPlanInFirestore(config);
   if (duplicate) {
    setDuplicateStudyPlan(duplicate);
    setPendingStudyPlanConfig(config);
    setShowDuplicateModal(true);
    setIsGeneratingStudyPlan(false);
    navigate('/study-plan-form');
    return;
   }

   // No duplicate, proceed with generation
   await executeStudyPlanGeneration(config);
  } catch (err) {
   secureLog.error('StudyPlan', err as Error, { operation: 'generate', config });
   if (err instanceof APIRateLimitError) {
    setStudyPlanError(null);
   } else {
    setStudyPlanError(err instanceof Error ? err.message : 'Failed to generate study plan.');
   }
   setIsGeneratingStudyPlan(false);
   navigate('/study-plan-form');
 }
};

const handleGenerateStudyPlanRef = useRef<typeof handleGenerateStudyPlan>();

useEffect(() => {
  handleGenerateStudyPlanRef.current = handleGenerateStudyPlan;
});

// Execute the actual API call and save
const executeStudyPlanGeneration = async (config: StudyPlanConfig, overwritePlanId?: string) => {
  try {
   setStudyPlanConfig(config);
   setStudyPlanError(null);
   setIsGeneratingStudyPlan(true);
   navigate('/study-plan-loading');

   const response = await generateStudyPlanAPI(config);

   // Use optimistic plan creation - plan available immediately in localStorage
   // Syncs to Firestore in background
   const planId = await createPlanOptimistic(config, response);

   // Set plan ID and load from cache
   setCurrentStudyPlanId(planId);

   // Load progress from cache
   const cachedPlan = getPlanFromCache(planId);
   if (cachedPlan) {
     initializePlanProgressState(
       new Set(cachedPlan.progress.completedProblems),
       new Set(cachedPlan.progress.bookmarkedProblems),
       new Set(cachedPlan.progress.inProgressProblems)
     );
   }

   // 🎯 FIX: Reset to default view state for brand new plan
   // This ensures no stale highlighting from previous plans
   setStudyPlanViewState(createDefaultViewState());
   if (import.meta.env.DEV) {
     console.log('🔄 [ViewState] Reset to default for new plan');
   }
   secureLog.dev('ViewState', 'Reset to default for new plan', { planId });

   setStudyPlanResponse(response);
   syncPlanStructures(response);
   setCurrentPlanProblemId(null);
   setIsGeneratingStudyPlan(false);
   navigate('/study-plan-view');
  } catch (err) {
   secureLog.error('StudyPlan', err as Error, { operation: 'generateAPI', config });

   if (err instanceof APIRateLimitError) {
    setStudyPlanError(null);
   } else if (err instanceof APIAuthenticationError) {
    setStudyPlanError(err.message + ' Please refresh the page and try again.');
   } else {
    setStudyPlanError(err instanceof Error ? err.message : 'Failed to generate study plan. Please try again.');
   }

   setIsGeneratingStudyPlan(false);
   navigate('/study-plan-form');
  }
 };

useEffect(() => {
  if (typeof window === 'undefined') {
    return;
  }

  const handleInlineStudyPlanGeneration = async (event: Event): Promise<void> => {
    const customEvent = event as CustomEvent<string | StudyPlanConfig | null>;
    if (!customEvent.detail) {
      return;
    }

    let parsedConfig: StudyPlanConfig | null = null;

    if (typeof customEvent.detail === 'string') {
      try {
        parsedConfig = JSON.parse(customEvent.detail) as StudyPlanConfig;
      } catch (parseError) {
        secureLog.error('StudyPlan', parseError as Error, {
          operation: 'parseInlineStudyPlanConfig',
        });
        return;
      }
    } else {
      parsedConfig = customEvent.detail as StudyPlanConfig;
    }

    if (!parsedConfig) {
      return;
    }

    if (!handleGenerateStudyPlanRef.current) {
      secureLog.warn('StudyPlan', 'No handler available for inline study plan generation event');
      return;
    }

    await handleGenerateStudyPlanRef.current(parsedConfig);
  };

  window.addEventListener(
    'generate-study-plan',
    handleInlineStudyPlanGeneration as EventListener,
  );

  return () => {
    window.removeEventListener(
      'generate-study-plan',
      handleInlineStudyPlanGeneration as EventListener,
    );
  };
}, []);

// Duplicate modal handlers
const handleOverwriteStudyPlan = async () => {
  if (pendingStudyPlanConfig && duplicateStudyPlan) {
   setShowDuplicateModal(false);
   await executeStudyPlanGeneration(pendingStudyPlanConfig, duplicateStudyPlan.id);
   setPendingStudyPlanConfig(null);
   setDuplicateStudyPlan(null);
  }
 };

 const handleKeepOriginalStudyPlan = () => {
  if (duplicateStudyPlan) {
   setShowDuplicateModal(false);
   handleViewStudyPlan(duplicateStudyPlan.id);
   setPendingStudyPlanConfig(null);
   setDuplicateStudyPlan(null);
  }
 };

 const handleCancelDuplicateModal = () => {
  setShowDuplicateModal(false);
  setPendingStudyPlanConfig(null);
  setDuplicateStudyPlan(null);
 };

 const handleStudyPlanFormCancel = () => {
  navigate('/my-study-plans');
 };

 const handleBackToStudyPlanForm = () => {
  navigate('/study-plan-form');
 };

 const handleStartProblemFromPlan = async (problem: EnrichedProblem, planId?: string, forceRefresh?: boolean, skipNavigation?: boolean) => {
  try {
   const activePlanId = planId || currentStudyPlanId;
   let activeStudyPlanConfig = studyPlanConfig;
   const targetProblemId = problem?.problemId;

   if (!activePlanId) {
    throw new Error('Study plan ID not found');
   }

   if (!targetProblemId) {
    secureLog.warn('StudyPlan', 'Problem missing problemId', { problem });
    return;
   }

   // CRITICAL FIX: Update ref immediately to prevent race conditions
   activeProblemIdRef.current = targetProblemId;

   // 🎯 CAPTURE VIEW STATE BEFORE NAVIGATION
   const currentDayForProblem = findDayForProblem(targetProblemId);
   const capturedViewState: StudyPlanViewState = {
    scrollY: window.scrollY,
    expandedDays: [...expandedDaysInView],
    showTopics: filterStatesInView.showTopics,
    showDifficulty: filterStatesInView.showDifficulty,
    showSavedOnly: filterStatesInView.showSavedOnly,
    showGuidance: filterStatesInView.showGuidance,
    currentProblemId: targetProblemId,
    currentProblemDay: currentDayForProblem,
    lastUpdated: Date.now()
   };

   // Save to React state (primary)
   setStudyPlanViewState(capturedViewState);

   // Save to sessionStorage (backup for page reloads)
   if (activePlanId) {
    saveViewStateToSession(activePlanId, capturedViewState);
   }

   if (import.meta.env.DEV) {
     console.log('📸 Captured view state:', {
      scrollY: capturedViewState.scrollY,
      expandedDays: capturedViewState.expandedDays,
      currentProblemId: capturedViewState.currentProblemId,
      currentProblemDay: capturedViewState.currentProblemDay
     });
   }
   secureLog.dev('ViewState', 'Captured view state', {
     scrollY: capturedViewState.scrollY,
     expandedDaysCount: capturedViewState.expandedDays.length,
     currentProblemId: capturedViewState.currentProblemId,
     currentProblemDay: capturedViewState.currentProblemDay
   });

   if (!activeStudyPlanConfig) {
    const cachedPlan = getPlanFromCache(activePlanId);
    if (cachedPlan) {
     activeStudyPlanConfig = cachedPlan.config;
     setStudyPlanConfig(cachedPlan.config);
    }
   }

   if (!activeStudyPlanConfig) {
    throw new Error('Study plan configuration not found');
   }

   if (!planProblemMap[targetProblemId]) {
    syncPlanStructures();
   }

   setCurrentPlanProblemId(targetProblemId);

   // CRITICAL FIX: Clear state FIRST to prevent race condition
   // This ensures we don't briefly render with stale data
   setProblem(null);
   setCodeDetails(null);
   setEvaluationResults(null);
   setSolutionFromSolver(null);
   setApiResponseReceived(false);
   setIsResuming(false);
   setResumeProblemId(null);
   setError(null);

   setCurrentStudyPlanId(activePlanId);

   const companyId = activeStudyPlanConfig.companyId;

   // 🚀 Check cache BEFORE making API call (unless forcing refresh for regenerate)
   // This prevents unnecessary API calls when problem data already exists
   if (!forceRefresh) {
    if (import.meta.env.DEV) {
      console.log(`💾 [Start] Checking cache for problem ${targetProblemId}`);
    }
    secureLog.dev('Cache', 'Checking cache for problem', { planId: activePlanId, problemId: targetProblemId });
    const cachedProblem = getProblemFromCache(activePlanId, targetProblemId);

    if (cachedProblem && cachedProblem.problem && cachedProblem.codeDetails) {
     // Problem exists in cache, use it directly!
     if (import.meta.env.DEV) {
       console.log(`✅ [Start] Found problem in cache, skipping API call`);
     }
     secureLog.dev('Cache', 'Found problem in cache, skipping API call', { problemId: targetProblemId });

    // Navigate to problem page
    navigate('/loading');

    // Set all the necessary state from cache
    const uniqueProblemId = buildPlanProblemCacheKey(activePlanId, targetProblemId, companyId);

    // Update problem ID to include the unique cache key
    const cachedProblemWithUniqueId = {
     ...cachedProblem.problem,
     problemId: uniqueProblemId
    };

    setProblem(cachedProblemWithUniqueId);
    setCodeDetails(cachedProblem.codeDetails);
    setSolutionFromSolver(cachedProblem.userCode || cachedProblem.codeDetails.defaultUserCode || '');
    setCurrentCode(cachedProblem.userCode || cachedProblem.codeDetails.defaultUserCode || '');
    setHasUnsyncedCode(false);
    setCurrentCompanyId(companyId);
    setApiResponseReceived(true);

    // Mark as in-progress if not already
    if (!inProgressPlanProblems.has(targetProblemId) && !completedPlanProblems.has(targetProblemId)) {
     const updatedInProgress = new Set(inProgressPlanProblems);
     updatedInProgress.add(targetProblemId);
     initializePlanProgressState(
       completedPlanProblems,
       bookmarkedPlanProblems,
       updatedInProgress
     );
    }

     // Navigate to problem page
     navigate('/study-plan/problem', { replace: true });
     return;
    }
   } else {
    if (import.meta.env.DEV) {
      console.log(`🔄 [Start] Force refresh requested, bypassing cache and calling API`);
    }
    secureLog.dev('Cache', 'Force refresh requested, bypassing cache', { problemId: targetProblemId });
   }

   // No cache found (or force refresh), proceed with API call
   if (!forceRefresh) {
    if (import.meta.env.DEV) {
      console.log(`🌐 [Start] No cache found for problem ${targetProblemId}, calling API`);
    }
    secureLog.dev('Cache', 'No cache found, calling API', { problemId: targetProblemId });
   }

   // Now safe to navigate - state is clean (unless caller already navigated)
   if (!skipNavigation) {
    navigate('/loading');
   }
   const companyName = getCompanyDisplayName(companyId);

   // Call prepareProblem API with the specific problem ID
   const responseData = await prepareProblemAPI(
    targetProblemId,
    companyId,
    undefined,
    true, // isBlind75 - assume problems are from Blind75
    activeStudyPlanConfig.roleFamily
   );

   const apiTestCases = responseData.problem?.testCases || [];
   const formattedTestCases: TestCase[] = apiTestCases.map((tc: any) => ({
    id: tc.id || undefined,
    stdin: tc.input || tc.stdin,
    expectedStdout: tc.output || tc.expected_output || tc.expectedOutput || tc.expectedStdout,
    isSample: tc.isSample === true || tc.is_sample === true,
    explanation: tc.explanation || undefined,
   }));

   const uniqueProblemId = buildPlanProblemCacheKey(activePlanId, targetProblemId, companyId);

   const formattedProblem: Problem = {
    title: extractCleanProblemTitle(
      responseData.problem?.title || problem.title,
      companyId
    ),
    background: responseData.problem?.background || "",
    problemStatement: responseData.problem?.problemStatement || "",
    testCases: formattedTestCases,
    constraints: responseData.problem?.constraints || [],
    requirements: responseData.problem?.requirements || [],
    leetcodeUrl: responseData.problem?.leetcodeUrl || "",
    problemId: uniqueProblemId
   };

   const formattedCodeDetails: CodeDetails = {
    boilerplateCode: responseData.codeDetails?.boilerplateCode || "",
    defaultUserCode: responseData.codeDetails?.defaultUserCode || "",
    functionName: responseData.codeDetails?.functionName || "",
    solutionStructureHint: responseData.codeDetails?.solutionStructureHint || "",
    language: responseData.codeDetails?.language || "python"
   };

   if (!formattedProblem.problemStatement || !formattedProblem.testCases || formattedProblem.testCases.length === 0 || !formattedProblem.constraints) {
    throw new Error("Invalid problem data received from API. Missing statement, test cases, or constraints.");
   }

   // Save complete problem details to Firestore (with status)
   try {
    await saveProblemWithDetails(
      activePlanId,
      targetProblemId,
      formattedProblem,
      formattedCodeDetails,
      'in_progress'
    );

    // Update local state to match what was saved to Firestore
    const updatedInProgress = new Set(inProgressPlanProblems);
    updatedInProgress.add(targetProblemId);
    initializePlanProgressState(
      completedPlanProblems,
      bookmarkedPlanProblems,
      updatedInProgress
    );

    if (import.meta.env.DEV) {
      console.log('✅ Problem details and status saved to Firestore');
    }
    secureLog.dev('Firestore', 'Problem details and status saved', { planId: activePlanId, problemId: targetProblemId });
   } catch (error) {
    secureLog.error('Firestore', error as Error, {
      planId: activePlanId,
      problemId: targetProblemId,
      operation: 'saveProblem'
    });

    // Fallback: save to localStorage for backwards compatibility
    setCachedProblemData(uniqueProblemId, formattedProblem, formattedCodeDetails);
    addProblemToCache(
      targetProblemId,
      'in_progress',
      formattedCodeDetails.defaultUserCode || '',
      companyId,
      companyName,
      problem.difficulty,
      formattedProblem.title,
      activePlanId
    );

    // Update local state for localStorage fallback
    const updatedInProgress = new Set(inProgressPlanProblems);
    updatedInProgress.add(targetProblemId);
    initializePlanProgressState(
      completedPlanProblems,
      bookmarkedPlanProblems,
      updatedInProgress
    );

    secureLog.warn('Cache', 'Using localStorage fallback', { planId: activePlanId, problemId: targetProblemId });
   }

   // 💾 CRITICAL: Save to unified cache for instant future access (Next/Prev navigation)
   // This prevents re-fetching from API on subsequent navigation
   updateProblemInCache(activePlanId, targetProblemId, {
     problem: formattedProblem,
     codeDetails: formattedCodeDetails,
     userCode: formattedCodeDetails.defaultUserCode || ''
   });
   if (import.meta.env.DEV) {
     console.log('💾 Problem saved to unified cache for instant future access');
   }
   secureLog.dev('Cache', 'Problem saved to unified cache', { planId: activePlanId, problemId: targetProblemId });

   setApiResponseReceived(true);
   setProblem(formattedProblem);
   setCodeDetails(formattedCodeDetails);
   setCurrentCompanyId(companyId);
   setHasUnsyncedCode(false);
   navigate('/study-plan/problem', { replace: true });

  } catch (err) {
   secureLog.error('StudyPlan', err as Error, {
     planId: activePlanId,
     problemId: targetProblemId,
     operation: 'prepareProblem'
   });

  if (err instanceof APIRateLimitError) {
    setError(null);
  } else if (err instanceof APIAuthenticationError) {
    setError(err.message + ' Please refresh the page and try again.');
  } else {
    setError(err instanceof Error ? err.message : 'An unexpected error occurred');
  }

   navigate('/study-plan-view');
  }
 };

 const handleRegenerateCurrentPlanProblem = useCallback(async () => {
  if (!currentStudyPlanId || !currentPlanProblemId) return;

  const info = planProblemMap[currentPlanProblemId];
  if (!info) return;

  try {
   // 1. Navigate to loading IMMEDIATELY for instant feedback
   navigate('/loading');

   // 2. Clear local UI state for clean render
   setProblem(null);
   setCodeDetails(null);
   setSolutionFromSolver(null);
   setCurrentCode('');
   setHasUnsyncedCode(false);
   setEvaluationResults(null);
   setApiResponseReceived(false);

   // 3. Call with forceRefresh=true to bypass cache and hit API
   // This will:
   //   - Fetch fresh problem from prepareProblemAPI
   //   - Call saveProblemWithDetails() with status='in_progress'
   //   - Update cache via updateProblemInCache()
   //   - Set problem status to 'in_progress' (removes from completed)
   //   - Debouncing syncs to Firestore automatically
   await handleStartProblemFromPlan(info.problem, currentStudyPlanId, true, true);

   // Bookmark is preserved automatically (separate Set)
  } catch (error) {
   secureLog.error('StudyPlan', error as Error, {
     planId: currentStudyPlanId,
     problemId: currentPlanProblemId,
     operation: 'regenerate'
   });
   setError('Failed to regenerate problem');
  }
 }, [currentPlanProblemId, currentStudyPlanId, planProblemMap, handleStartProblemFromPlan]);

 const handleResumeStudyPlanProblem = useCallback(
  async (problem: EnrichedProblem, planId?: string) => {
   try {
    // CRITICAL FIX: Update ref immediately to prevent race conditions
    activeProblemIdRef.current = problem.problemId;

    // Clear visual state immediately (non-blocking)
    setProblem(null);
    setCodeDetails(null);
    setSolutionFromSolver(null);
    setEvaluationResults(null);

    const activePlanId = planId || currentStudyPlanId;
    let activeStudyPlanConfig = studyPlanConfig;

    if (!activePlanId) {
     throw new Error('Study plan ID not found for resume');
    }

    // Get config from cache first (instant, no network call)
    if (!activeStudyPlanConfig) {
     const cachedPlan = getPlanFromCache(activePlanId);
     if (cachedPlan) {
      activeStudyPlanConfig = cachedPlan.config;
      setStudyPlanConfig(cachedPlan.config);
     }
    }

    if (!activeStudyPlanConfig) {
     throw new Error('Study plan configuration not found for resume');
    }

    const companyId = activeStudyPlanConfig.companyId;

    // 🎯 CAPTURE VIEW STATE BEFORE NAVIGATION (Resume/Review flow)
    const currentDayForProblem = findDayForProblem(problem.problemId);
    const capturedViewState: StudyPlanViewState = {
     scrollY: window.scrollY,
     expandedDays: [...expandedDaysInView],
     showTopics: filterStatesInView.showTopics,
     showDifficulty: filterStatesInView.showDifficulty,
     showSavedOnly: filterStatesInView.showSavedOnly,
     showGuidance: filterStatesInView.showGuidance,
     currentProblemId: problem.problemId,
     currentProblemDay: currentDayForProblem,
     lastUpdated: Date.now()
    };

    // Save to React state (primary)
    setStudyPlanViewState(capturedViewState);

    // Save to sessionStorage (backup for page reloads)
    if (activePlanId) {
     saveViewStateToSession(activePlanId, capturedViewState);
    }

    if (import.meta.env.DEV) {
      console.log('📸 Captured view state (Resume/Review):', {
       scrollY: capturedViewState.scrollY,
       expandedDays: capturedViewState.expandedDays,
       currentProblemId: capturedViewState.currentProblemId,
       currentProblemDay: capturedViewState.currentProblemDay
      });
    }
    secureLog.dev('ViewState', 'Captured view state on resume/review', {
      scrollY: capturedViewState.scrollY,
      expandedDaysCount: capturedViewState.expandedDays.length,
      currentProblemId: capturedViewState.currentProblemId,
      currentProblemDay: capturedViewState.currentProblemDay
    });

    // SIMPLIFIED LOGIC: Check unified cache ONLY (single source of truth)
    if (import.meta.env.DEV) {
      console.log(`💾 [Resume] Checking unified cache for problem ${problem.problemId}`);
    }
    secureLog.dev('Cache', 'Checking unified cache for resume', { planId: activePlanId, problemId: problem.problemId });
    const cachedProblem = getProblemFromCache(activePlanId, problem.problemId);

    if (cachedProblem) {
      // Load from cache - this has the latest code from auto-save!
      if (import.meta.env.DEV) {
        console.log(`✅ [Resume] Loaded from cache with ${cachedProblem.userCode.length} chars of code`);
      }
      secureLog.dev('Cache', 'Loaded from cache on resume', {
        planId: activePlanId,
        problemId: problem.problemId,
        codeLength: cachedProblem.userCode.length
      });
      setCurrentStudyPlanId(activePlanId);
      setCurrentPlanProblemId(problem.problemId);
      setCurrentCompanyId(companyId);
      setIsCompanyContextFlow(false);

      // Set problem and code data directly from cache
      setProblem(cachedProblem.problem);
      setCodeDetails(cachedProblem.codeDetails);
      setSolutionFromSolver(cachedProblem.userCode);
      setCurrentCode(cachedProblem.userCode);
      setHasUnsyncedCode(false);
      setApiResponseReceived(true);
      navigate('/study-plan/problem', { replace: true });
      return;
    }

    // No cache - fetch fresh from API (same as starting new)
    if (import.meta.env.DEV) {
      console.log(`🆕 [Resume] No cached data found, starting fresh from API`);
    }
    secureLog.dev('Cache', 'No cached data found, starting fresh', { problemId: problem.problemId });
    await handleStartProblemFromPlan(problem, activePlanId);
   } catch (resumeErr) {
    secureLog.error('StudyPlan', resumeErr as Error, {
      planId: activePlanId,
      problemId: problem.problemId,
      operation: 'resume'
    });
    // Try to start fresh as fallback, but don't redirect to Blind75
    const fallbackPlanId = planId || currentStudyPlanId;
    if (fallbackPlanId) {
     try {
      await handleStartProblemFromPlan(problem, fallbackPlanId);
     } catch (fallbackErr) {
      secureLog.error('StudyPlan', fallbackErr as Error, {
        planId: fallbackPlanId,
        problemId: problem.problemId,
        operation: 'fallbackStart'
      });
      // Navigate back to study plan view instead of Blind75
      if (fallbackPlanId) {
        navigate('/study-plan-view');
      }
     }
    }
   }
  },
  [currentStudyPlanId, handleStartProblemFromPlan, studyPlanConfig, navigate, findDayForProblem, expandedDaysInView, filterStatesInView, saveViewStateToSession]
 );

 const handleNavigateStudyPlanProblem = useCallback(async (direction: 'next' | 'prev') => {
  // Prevent double navigation
  if (isNavigating) {
   if (import.meta.env.DEV) {
     console.log('[Navigation] Already navigating, ignoring request');
   }
   secureLog.dev('Navigation', 'Already navigating, ignoring request', { direction });
   return;
  }

  if (!currentStudyPlanId || !currentPlanProblemId || planProblems.length === 0) {
   return;
  }

  const currentInfo = planProblemMap[currentPlanProblemId];
  const currentIndex = currentInfo ? currentInfo.index : planProblems.findIndex(p => p.problemId === currentPlanProblemId);
  if (currentIndex === -1) return;

  const targetIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
  if (targetIndex < 0 || targetIndex >= planProblems.length) return;

  const targetProblem = planProblems[targetIndex];
  if (!targetProblem) return;

  setIsNavigating(true);
  try {
   // CRITICAL FIX: Update ref immediately to prevent race conditions
   // This ensures debounced saves don't fire for the wrong problem
   activeProblemIdRef.current = targetProblem.problemId;

   // Clear visual state immediately (non-blocking)
   setProblem(null);
   setCodeDetails(null);
   setSolutionFromSolver(null);
   setEvaluationResults(null);
   const activePlanId = currentStudyPlanId;

   // 🔍 CRITICAL FIX: ALWAYS check unified cache FIRST - it's the source of truth
   const cachedProblem = getProblemFromCache(activePlanId, targetProblem.problemId);

   // If we have ANY cached data (including completed problems), use resume flow (faster, no API call)
   const shouldResume = Boolean(cachedProblem) ||
                        inProgressPlanProblems.has(targetProblem.problemId) ||
                        completedPlanProblems.has(targetProblem.problemId);

   if (import.meta.env.DEV) {
     console.log(`[Navigation] ${direction} to ${targetProblem.title}:`, {
      hasCachedData: Boolean(cachedProblem),
      isInProgress: inProgressPlanProblems.has(targetProblem.problemId),
      isCompleted: completedPlanProblems.has(targetProblem.problemId),
      shouldResume
     });
   }
   secureLog.dev('Navigation', `Navigating ${direction} to problem`, {
     direction,
     problemTitle: targetProblem.title,
     problemId: targetProblem.problemId,
     hasCachedData: Boolean(cachedProblem),
     shouldResume
   });

   if (shouldResume) {
    await handleResumeStudyPlanProblem(targetProblem, currentStudyPlanId);
   } else {
    await handleStartProblemFromPlan(targetProblem, currentStudyPlanId);
   }
  } finally {
   setIsNavigating(false);
  }
 }, [
  isNavigating,
  currentPlanProblemId,
  currentStudyPlanId,
  handleResumeStudyPlanProblem,
  handleStartProblemFromPlan,
  inProgressPlanProblems,
  completedPlanProblems,
  planProblemMap,
  planProblems,
  studyPlanConfig
 ]);

 const handleToggleBookmarkForProblem = useCallback(
  (problemId: string) => {
   if (!currentStudyPlanId || !problemId) return;

   // Optimistic update - UI updates immediately, sync happens in background
   toggleBookmarkOptimistic(problemId);
  },
  [currentStudyPlanId, toggleBookmarkOptimistic]
 );

 const handleToggleBookmarkForCurrentProblem = useCallback(() => {
  if (!currentStudyPlanId || !currentPlanProblemId) return;
  handleToggleBookmarkForProblem(currentPlanProblemId);
 }, [currentPlanProblemId, currentStudyPlanId, handleToggleBookmarkForProblem]);

 const handleManualPlanCompletionToggle = useCallback(() => {
  if (!currentStudyPlanId || !currentPlanProblemId) return;

  // Optimistic update - UI updates immediately, sync happens in background
  // Code is already being auto-saved via handleCodeChange with debounce
  // No need to force save here - this is just a status toggle
  toggleCompletionOptimistic(currentPlanProblemId);
 }, [
  currentStudyPlanId,
  currentPlanProblemId,
  toggleCompletionOptimistic
 ]);

// Consolidated force sync: saves code, progress, and all study plan changes in one go
const forceFullSync = useCallback(async () => {
 const planId = currentStudyPlanId;
 const problemId = currentPlanProblemId;

 const needsCodeSync = Boolean(
   planId &&
   problemId &&
   (hasUnsyncedCode || codeSaveStatus === 'saving')
 );
 const needsProgressSync = hasPendingProgressChanges;
 const needsPlanSync = hasPendingPlanChanges;

 if (!needsCodeSync && !needsProgressSync && !needsPlanSync) {
   if (import.meta.env.DEV) {
     console.log('ℹ️ [Sync] No pending study plan changes to sync');
   }
   secureLog.dev('Sync', 'No pending study plan changes to sync', {});
   return;
 }

 try {
   const syncPromises: Promise<void>[] = [];

   if (needsCodeSync && planId && problemId) {
     syncPromises.push(
       forceSave({
         planId,
         problemId,
         code: currentCode
       }).catch((error) => {
         setHasUnsyncedCode(true);
         throw error;
       })
     );
   }

   if (needsProgressSync) {
     syncPromises.push(forceSyncPlanProgress());
   }

   if (needsPlanSync) {
     syncPromises.push(forceSyncStudyPlan());
   }

   await Promise.all(syncPromises);
   if (import.meta.env.DEV) {
     console.log('✅ Full sync complete');
   }
   secureLog.dev('Sync', 'Full sync complete', { planId, problemId });
 } catch (error) {
   secureLog.error('Sync', error as Error, { planId, problemId, operation: 'forceFullSync' });
   throw error; // Re-throw so caller can handle
 }
}, [
 codeSaveStatus,
 currentCode,
 currentPlanProblemId,
 currentStudyPlanId,
 forceSave,
 forceSyncPlanProgress,
 forceSyncStudyPlan,
 hasPendingPlanChanges,
 hasPendingProgressChanges,
 hasUnsyncedCode
]);

 // Direct navigation to plan view - no loading screen needed!
 const handleReturnToPlanViewImmediate = useCallback(() => {
  if (import.meta.env.DEV) {
    console.log('⚡ [Return to Plan] Navigating instantly without loading screen');
  }
  secureLog.dev('Navigation', 'Returning to plan view immediately', { planId: currentStudyPlanId });

  // Save in background (non-blocking) if needed
  const isCodeSyncInFlight =
    Boolean(currentStudyPlanId && currentPlanProblemId && codeSaveStatus === 'saving');
  const hasAnyPendingChanges =
    hasPendingProgressChanges ||
    hasPendingPlanChanges ||
    hasUnsyncedCode ||
    isCodeSyncInFlight;

  if (hasAnyPendingChanges) {
    if (import.meta.env.DEV) {
      console.log('💾 [View Plan] Starting background save...');
    }
    secureLog.dev('AutoSave', 'Starting background save', { planId: currentStudyPlanId });
    forceFullSync()
      .then(() => {
        if (import.meta.env.DEV) {
          console.log('✅ [Background Save] Completed');
        }
        secureLog.dev('AutoSave', 'Background save completed', { planId: currentStudyPlanId });
      })
      .catch(error => {
        secureLog.error('AutoSave', error as Error, { planId: currentStudyPlanId, operation: 'backgroundSave' });
      });
  }

  // Navigate IMMEDIATELY - no loading screen, no delays!
  if (studyPlanResponse && currentStudyPlanId) {
    // State already exists - instant navigation!
    navigate('/study-plan-view');
  } else if (currentStudyPlanId) {
    // Need to reload from cache - still instant, handleViewStudyPlan loads from cache
    handleViewStudyPlan(currentStudyPlanId);
  } else {
    // Fallback: just navigate
    navigate('/study-plan-view');
  }
}, [
  currentStudyPlanId,
  currentPlanProblemId,
  studyPlanResponse,
  forceFullSync,
  handleViewStudyPlan,
  navigate,
  hasPendingProgressChanges,
  hasPendingPlanChanges,
  hasUnsyncedCode,
  codeSaveStatus
]);

 // Helper: Force save before any navigation
const saveBeforeAction = useCallback(async (action: () => void | Promise<void>) => {
 const isCodeSyncInFlight =
   Boolean(currentStudyPlanId && currentPlanProblemId && codeSaveStatus === 'saving');

 const hasAnyPendingChanges =
   hasPendingProgressChanges ||
   hasPendingPlanChanges ||
   hasUnsyncedCode ||
   isCodeSyncInFlight;

 if (hasAnyPendingChanges) {
   try {
     await forceFullSync();
   } catch (error) {
     secureLog.error('Sync', error as Error, {
       planId: currentStudyPlanId,
       problemId: currentPlanProblemId,
       operation: 'saveBeforeAction'
     });
   }
 }
 await action();
}, [
  codeSaveStatus,
  currentPlanProblemId,
  currentStudyPlanId,
  forceFullSync,
  hasPendingPlanChanges,
  hasPendingProgressChanges,
  hasUnsyncedCode
]);

 // Non-blocking navigation with background save (like View Plan button)
const navigateWithBackgroundSave = useCallback((action: () => void | Promise<void>) => {
 // Save in background (non-blocking) if needed
 const isCodeSyncInFlight =
   Boolean(currentStudyPlanId && currentPlanProblemId && codeSaveStatus === 'saving');

 const hasAnyPendingChanges =
   hasPendingProgressChanges ||
   hasPendingPlanChanges ||
   hasUnsyncedCode ||
   isCodeSyncInFlight;

 if (hasAnyPendingChanges) {
   if (import.meta.env.DEV) {
     console.log('💾 [Navigation] Starting background save...');
   }
   secureLog.dev('AutoSave', 'Starting background save on navigation', { planId: currentStudyPlanId });
   forceFullSync()
     .then(() => {
       if (import.meta.env.DEV) {
         console.log('✅ [Background Save] Completed');
       }
       secureLog.dev('AutoSave', 'Background save completed on navigation', { planId: currentStudyPlanId });
     })
     .catch(error => {
       secureLog.error('AutoSave', error as Error, { planId: currentStudyPlanId, operation: 'navigationBackgroundSave' });
     });
 }

 // Execute action IMMEDIATELY - don't wait for save
 action();
}, [
  codeSaveStatus,
  currentPlanProblemId,
  currentStudyPlanId,
  forceFullSync,
  hasPendingPlanChanges,
  hasPendingProgressChanges,
  hasUnsyncedCode
]);

 // Force sync before sign-out to prevent data loss
const handleBeforeSignOut = useCallback(async () => {
 if (import.meta.env.DEV) {
   console.log('🔄 [Sign-Out] Force syncing before sign-out...');
 }
 secureLog.dev('Sync', 'Force syncing before sign-out', { planId: currentStudyPlanId });
 const isCodeSyncInFlight =
   Boolean(currentStudyPlanId && currentPlanProblemId && codeSaveStatus === 'saving');
 const shouldSync =
   hasPendingPlanChanges ||
   hasPendingProgressChanges ||
   hasUnsyncedCode ||
   isCodeSyncInFlight;

 if (!shouldSync) {
   if (import.meta.env.DEV) {
     console.log('ℹ️ [Sign-Out] No pending study plan changes, skipping sync');
   }
   secureLog.dev('Sync', 'No pending study plan changes, skipping sync', {});
   return;
 }

 try {
   await forceFullSync();
   if (import.meta.env.DEV) {
     console.log('✅ [Sign-Out] Sync complete');
   }
   secureLog.dev('Sync', 'Sign-out sync complete', { planId: currentStudyPlanId });
 } catch (error) {
   secureLog.error('Sync', error as Error, { planId: currentStudyPlanId, operation: 'signOutSync' });
   // Continue with sign-out even if sync fails (offline, network error, etc.)
 }
}, [
  codeSaveStatus,
  currentPlanProblemId,
  currentStudyPlanId,
  forceFullSync,
  hasPendingPlanChanges,
  hasPendingProgressChanges,
  hasUnsyncedCode
]);

 // Handle return to Blind75 with view state restoration
 const handleReturnToBlind75 = useCallback(() => {
  if (import.meta.env.DEV) {
    console.log('⚡ [Return to Blind75] Navigating with view state');
  }
  secureLog.dev('Navigation', 'Returning to Blind75 with view state', {});

  // Load view state from sessionStorage as backup (in case React state lost)
  const sessionViewState = loadBlind75ViewState();
  const viewStateToUse = sessionViewState || blind75ViewState;

  if (import.meta.env.DEV) {
    console.log('📜 Restoring Blind75 view state:', {
      scrollY: viewStateToUse.scrollY,
      problemSlug: viewStateToUse.lastViewedProblemSlug
    });
  }
  secureLog.dev('ViewState', 'Restoring Blind75 view state', {
    scrollY: viewStateToUse.scrollY,
    problemSlug: viewStateToUse.lastViewedProblemSlug
  });

  // Navigate to Blind75 with state
  navigate('/blind75', {
    state: {
      viewState: viewStateToUse,
      highlightedProblemSlug: viewStateToUse.lastViewedProblemSlug
    }
  });

  // Reset flag
  setReturnToBlind75(false);
 }, [navigate, blind75ViewState]);

 const studyPlanSolverContext = useMemo(() => {
  // CRITICAL FIX: Only provide context on study plan routes
  // This prevents study plan toolbar from appearing on Blind75 routes
  const isStudyPlanRoute = location.pathname.includes('study-plan');
  if (!isStudyPlanRoute) {
   return undefined;
  }

  if (!currentStudyPlanId || !currentPlanProblemId) {
   return undefined;
  }

  const info = planProblemMap[currentPlanProblemId];
  if (!info) return undefined;

  const total = planProblems.length;
  return {
   planId: currentStudyPlanId,
   problemId: currentPlanProblemId,
   problemTitle: info.problem.title,
   day: info.day,
   index: info.index,
   total,
   isCompleted: completedPlanProblems.has(currentPlanProblemId),
   isBookmarked: bookmarkedPlanProblems.has(currentPlanProblemId),
   isInProgress: inProgressPlanProblems.has(currentPlanProblemId),
   hasNext: info.index < total - 1,
   hasPrev: info.index > 0,
   onNext: () => navigateWithBackgroundSave(() => handleNavigateStudyPlanProblem('next')),
   onPrev: () => navigateWithBackgroundSave(() => handleNavigateStudyPlanProblem('prev')),
   onRegenerate: () => navigateWithBackgroundSave(handleRegenerateCurrentPlanProblem),
   onToggleBookmark: handleToggleBookmarkForCurrentProblem,
   onToggleCompletion: handleManualPlanCompletionToggle,
   onReturnToPlan: handleReturnToPlanViewImmediate, // Use immediate version - no blocking saves!
   onResume: () => saveBeforeAction(() => handleResumeStudyPlanProblem(info.problem, currentStudyPlanId || undefined))
  };
 }, [
  location.pathname, // Added for route-based guard
  inProgressPlanProblems,
  bookmarkedPlanProblems,
  completedPlanProblems,
  currentPlanProblemId,
  currentStudyPlanId,
  saveBeforeAction,
  navigateWithBackgroundSave,
  handleManualPlanCompletionToggle,
  handleNavigateStudyPlanProblem,
  handleRegenerateCurrentPlanProblem,
  handleReturnToPlanViewImmediate, // Changed to use immediate version
  handleToggleBookmarkForCurrentProblem,
  planProblemMap,
  planProblems.length,
  handleResumeStudyPlanProblem
 ]);

 return (
  <DarkModeProvider>
   <ErrorBoundary>
     <div className="min-h-screen font-sans text-content-subtle bg-surface dark:bg-surface transition-colors duration-200">
      <Navbar
       onHomeClick={handleHomeClick}
       onBlind75Click={handleBlind75Click}
       onStudyPlansClick={handleStudyPlansClick}
       onBeforeSignOut={handleBeforeSignOut}
       hideLogo={location.pathname === '/'}
      />

     {/* Duplicate Warning Modal */}
     {duplicateStudyPlan && (
      <DuplicateWarningModal
       isOpen={showDuplicateModal}
       existingPlan={duplicateStudyPlan}
       onOverwrite={handleOverwriteStudyPlan}
       onKeepOriginal={handleKeepOriginalStudyPlan}
       onCancel={handleCancelDuplicateModal}
      />
     )}

     <Routes>
      <Route path="/" element={<IntroSection />} />
      {flags.paymentsEnabled && (
        <Route path="/payment/status/:status" element={<PaymentStatusPage />} />
      )}

      <Route path="/my-study-plans" element={
      <PremiumGate feature="My Study Plans">
       <MyStudyPlansPage
        onCreateNew={handleCreateNewStudyPlan}
        onViewPlan={handleViewStudyPlan}
       />
      </PremiumGate>
     } />

     <Route path="/blind75" element={
      <Blind75
       onPracticeWithContext={handlePracticeWithContext}
       onResumeProblem={handleResumeProblem}
       highlightedProblemSlug={location.state?.highlightedProblemSlug}
       viewState={location.state?.viewState}
      />
     } />

     <Route path="/company-context-form" element={
      <CompanyContextForm
       onSubmit={handleCompanyContextSubmit}
       onCancel={handleCompanyContextCancel}
       problemSlug={selectedProblemSlug || undefined}
      />
     } />

     <Route path="/form" element={
      <>
       <ProblemForm initialData={{ company: 'meta', difficulty: 'Medium', topic: 'random' }} onSubmit={handleFormSubmit} />
       {error && (
        <div className="max-w-md mx-auto mt-4 p-3 bg-red-100 text-red-700 rounded-md">
         <p className="text-sm font-medium">Error: {error}</p>
        </div>
       )}
      </>
     } />

     <Route path="/loading" element={
      <ProblemSolver
       problem={problem}
       solution={solutionFromSolver}
       codeDetails={codeDetails}
       onSubmit={handleFinalSolutionSubmit}
       onCodeChange={handleCodeChange}
       testResults={evaluationResults}
       onReturnToBlind75={returnToBlind75 ? () => navigate('/blind75') : undefined}
       isLoading={!problem || !codeDetails || !apiResponseReceived}
       saveStatus={codeSaveStatus}
       lastSaveTime={codeSaveTimestamp}
      />
     } />

     <Route path="/resume-loading" element={
      <ResumeLoadingSequence
       onComplete={handleResumeLoadingComplete}
       isDataLoaded={resumeDataLoaded}
      />
     } />

     <Route path="/problem" element={
      problem && codeDetails ? (
       <ProblemSolver
        key={problem?.problemId || 'default'}
        problem={problem}
        solution={solutionFromSolver}
        codeDetails={codeDetails}
        onSubmit={handleFinalSolutionSubmit}
        onCodeChange={handleCodeChange}
        testResults={evaluationResults}
        studyPlanContext={studyPlanSolverContext}
        onReturnToBlind75={returnToBlind75 ? handleReturnToBlind75 : undefined}
        saveStatus={codeSaveStatus}
        lastSaveTime={codeSaveTimestamp}
       />
      ) : (
       <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
        <div className="text-center">
         <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mb-4"></div>
         <h2 className="text-xl font-medium font-playfair">Loading problem data...</h2>
         <p className="text-sm text-content-subtle mt-2">If this persists, please try again.</p>
        </div>
       </div>
      )
     } />

     {/* NEW: Study plan problem route - WRAPPED in PremiumGate */}
     <Route path="/study-plan/problem" element={
      <PremiumGate feature="Study Plans" message="Please sign in to access My Study Plans.">
       {problem && codeDetails ? (
        <ProblemSolver
         key={problem?.problemId || 'default'}
         problem={problem}
         solution={solutionFromSolver}
         codeDetails={codeDetails}
         onSubmit={handleFinalSolutionSubmit}
         onCodeChange={handleCodeChange}
         testResults={evaluationResults}
         studyPlanContext={studyPlanSolverContext}
         saveStatus={codeSaveStatus}
         lastSaveTime={codeSaveTimestamp}
        />
       ) : (
        <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
         <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mb-4"></div>
          <h2 className="text-xl font-medium font-playfair">Loading problem data...</h2>
          <p className="text-sm text-content-subtle mt-2">If this persists, please try again.</p>
         </div>
        </div>
       )}
      </PremiumGate>
     } />

     <Route path="/results" element={
      evaluationResults && problem ? (
       <ResultsView
        results={evaluationResults}
        problem={problem}
        onGoBackToProblem={handleGoBackToProblem}
        totalTestCases={problem.testCases.length}
        executedTestCases={Math.min(20, problem.testCases.length)}
       />
      ) : (
       <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
        <div className="text-center">
         <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mb-4"></div>
         <h2 className="text-xl font-medium font-playfair">Loading results...</h2>
        </div>
       </div>
      )
     } />

     {/* Study Plan Routes */}
     <Route path="/study-plan-form" element={
      <PremiumGate feature="Study Plans" message="Please sign in to access My Study Plans.">
       <StudyPlanForm
        onSubmit={handleGenerateStudyPlan}
        onCancel={handleStudyPlanFormCancel}
        isLoading={isGeneratingStudyPlan}
        error={studyPlanError}
       />
      </PremiumGate>
     } />

     <Route path="/study-plan-loading" element={
      <PremiumGate feature="Study Plans" message="Please sign in to access My Study Plans.">
       <StudyPlanLoading />
      </PremiumGate>
     } />

     <Route path="/study-plan-view" element={
      <PremiumGate feature="Study Plans" message="Please sign in to access My Study Plans.">
       {studyPlanResponse && studyPlanConfig ? (
        <StudyPlanView
         studyPlan={studyPlanResponse}
         companyId={studyPlanConfig.companyId}
         studyPlanId={currentStudyPlanId}
         datasetType={studyPlanConfig.datasetType}
         onBack={handleBackToStudyPlanForm}
         onStartProblem={handleStartProblemFromPlan}
         completedProblems={completedPlanProblems}
         bookmarkedProblems={bookmarkedPlanProblems}
         onToggleBookmark={handleToggleBookmarkForProblem}
         inProgressProblems={inProgressPlanProblems}
         onResumeProblem={handleResumeStudyPlanProblem}
         viewState={studyPlanViewState}
         onExpandedDaysChange={setExpandedDaysInView}
         onFilterStatesChange={setFilterStatesInView}
        />
       ) : (
        <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
         <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mb-4"></div>
          <h2 className="text-xl font-medium font-playfair">Loading study plan...</h2>
          <p className="text-sm text-content-subtle mt-2">If this persists, please return to the form.</p>
         </div>
        </div>
       )}
     </PremiumGate>
    } />
   </Routes>

    {rateLimitTooltip.visible && (
     <div
      role="status"
      aria-live="assertive"
      className="fixed bottom-6 right-6 z-50 max-w-xs rounded-lg border border-border-subtle bg-surface-strong p-4 shadow-lg"
     >
      <div className="flex items-start gap-3">
       <div className="mt-1 h-2.5 w-2.5 rounded-full bg-red-500" aria-hidden="true" />
       <p className="flex-1 text-sm font-medium text-content-strong">
        {rateLimitTooltip.message}
       </p>
       <button
        type="button"
        onClick={dismissRateLimitTooltip}
        className="text-xs font-medium text-content-subtle transition hover:text-content-strong"
        aria-label="Dismiss rate limit notice"
       >
        Dismiss
       </button>
      </div>
     </div>
    )}
    </div>
   </ErrorBoundary>
  </DarkModeProvider>
 );
}
