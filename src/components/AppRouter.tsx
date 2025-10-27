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
import { PremiumGate } from './PremiumGate';
import { DuplicateWarningModal } from './DuplicateWarningModal';
import { DarkModeProvider } from './DarkModeContext';
import { Navbar } from './Navbar';
import { ErrorBoundary } from './ErrorBoundary';
import { Problem, CodeDetails, TestCase, FormData, Company } from '../types';
import { StudyPlanConfig, StudyPlanResponse, EnrichedProblem, CachedStudyPlan, StudyPlanViewState } from '../types/studyPlan';
import { prepareProblem as prepareProblemAPI, generateStudyPlan as generateStudyPlanAPI } from '../utils/api-service';
import { APIAuthenticationError } from '../utils/api-errors';
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
import { buildPlanProblemCacheKey } from '../utils/studyPlanCache';
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

export function AppRouter() {
 const navigate = useNavigate();
 const location = useLocation();

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
  company: 'meta'
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
     console.error('[Plan Progress] Error:', error);
   }
 });

 // Auto-save state
 const [lastSaveTime, setLastSaveTime] = useState<number>(Date.now());
 const [currentCode, setCurrentCode] = useState<string>('');
 const [codeSaveStatus, setCodeSaveStatus] = useState<'saving' | 'saved' | 'error' | undefined>();
 const [codeSaveTimestamp, setCodeSaveTimestamp] = useState<number | null>(null);

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
     console.error('[Study Plan Auto-Save] Error:', error);
   },
   onSyncComplete: (planId) => {
     console.log(`[Study Plan Auto-Save] Sync complete for plan ${planId}`);
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
      console.log(`⚠️ [Auto-Save] Skipping stale save - problem changed (${data.problemId} → ${activeProblemIdRef.current})`);
      return;
    }

    try {
      // Save to Firestore
      await saveProblemCode(data.planId, data.problemId, data.code);
      const now = Date.now();
      setLastSaveTime(now);
      setCodeSaveTimestamp(now);
      setCodeSaveStatus('saved');

      // Auto-hide "saved" indicator after 2 seconds
      setTimeout(() => {
        setCodeSaveStatus(undefined);
      }, 2000);
    } catch (error) {
      console.error('[Auto-Save] Cloud save error:', error);
      setCodeSaveStatus('error');

      // Auto-hide error after 3 seconds
      setTimeout(() => {
        setCodeSaveStatus(undefined);
      }, 3000);
    }
  },
  onError: (error) => {
    console.error('[Auto-Save] Error:', error);
    setCodeSaveStatus('error');
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
     console.log(`💾 [Progress Sync] Loading from cache for plan ${activePlanId}`);
     initializePlanProgressState(
       new Set(cachedPlan.progress.completedProblems || []),
       new Set(cachedPlan.progress.bookmarkedProblems || []),
       new Set(cachedPlan.progress.inProgressProblems || [])
     );
     return;
   }

   // Fallback to Firestore only if not cached
   console.log(`☁️ [Progress Sync] Loading from Firestore for plan ${activePlanId}`);
   const firestorePlan = await getStudyPlanFromFirestore(activePlanId);
   if (!firestorePlan) return;

   initializePlanProgressState(
     new Set(firestorePlan.progress.completedProblems || []),
     new Set(firestorePlan.progress.bookmarkedProblems || []),
     new Set(firestorePlan.progress.inProgressProblems || [])
   );
  } catch (error) {
   console.error('Failed to sync plan progress:', error);
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

 // Navigation handlers
 const handleStartClick = () => {
  setIsCompanyContextFlow(false);
  navigate('/form');
 };

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
   console.log(`🔄 [ViewState] ${savedViewState ? 'Restored' : 'Reset to default'} view state for plan ${planId}`);

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
     console.log(`💾 [Cache] Loading plan ${planId} from cache`);
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
     console.log(`☁️ [Firestore] Loading plan ${planId} from Firestore (not cached)`);
     const plan = await getStudyPlanFromFirestore(planId);

     if (!plan) {
       console.error('Study plan not found:', planId);
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
   console.error('Failed to load study plan:', error);
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

  console.log('📸 Captured Blind75 view state:', {
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

   const { company } = data;
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
   if (import.meta.env.DEV) {
    console.error('Error preparing contextualized problem:', err);
   }

   if (err instanceof APIAuthenticationError) {
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

   console.log('📸 Captured Blind75 view state (Resume):', {
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
   console.error('Error resuming problem:', err);

   if (err instanceof APIAuthenticationError) {
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
   console.error('Error preparing problem:', err);
   setError(err instanceof Error ? err.message : 'An unexpected error occurred');
   navigate('/form');
  }
 };

 const handleCodeChange = async (code: string) => {
  setCurrentCode(code);
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
   // Check for duplicate first
   const duplicate = await findDuplicateStudyPlanInFirestore(config);
   if (duplicate) {
    setDuplicateStudyPlan(duplicate);
    setPendingStudyPlanConfig(config);
    setShowDuplicateModal(true);
    return; // Don't proceed with API call yet
   }

   // No duplicate, proceed with generation
   await executeStudyPlanGeneration(config);
  } catch (err) {
   console.error('Error in handleGenerateStudyPlan:', err);
   setStudyPlanError(err instanceof Error ? err.message : 'Failed to generate study plan.');
   navigate('/study-plan-form');
  }
 };

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
   console.log('🔄 [ViewState] Reset to default for new plan');

   setStudyPlanResponse(response);
   syncPlanStructures(response);
   setCurrentPlanProblemId(null);
   setIsGeneratingStudyPlan(false);
   navigate('/study-plan-view');
  } catch (err) {
   console.error('Error generating study plan:', err);

   if (err instanceof APIAuthenticationError) {
    setStudyPlanError(err.message + ' Please refresh the page and try again.');
   } else {
    setStudyPlanError(err instanceof Error ? err.message : 'Failed to generate study plan. Please try again.');
   }

   setIsGeneratingStudyPlan(false);
   navigate('/study-plan-form');
  }
 };

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
    console.warn('Study plan problem is missing problemId');
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

   console.log('📸 Captured view state:', {
    scrollY: capturedViewState.scrollY,
    expandedDays: capturedViewState.expandedDays,
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
    console.log(`💾 [Start] Checking cache for problem ${targetProblemId}`);
    const cachedProblem = getProblemFromCache(activePlanId, targetProblemId);

    if (cachedProblem && cachedProblem.problem && cachedProblem.codeDetails) {
     // Problem exists in cache, use it directly!
     console.log(`✅ [Start] Found problem in cache, skipping API call`);

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
    console.log(`🔄 [Start] Force refresh requested, bypassing cache and calling API`);
   }

   // No cache found (or force refresh), proceed with API call
   if (!forceRefresh) {
    console.log(`🌐 [Start] No cache found for problem ${targetProblemId}, calling API`);
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

    console.log('✅ Problem details and status saved to Firestore');
   } catch (error) {
    console.error('Failed to save problem to Firestore:', error);

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

    console.warn('⚠️ Using localStorage fallback');
   }

   // 💾 CRITICAL: Save to unified cache for instant future access (Next/Prev navigation)
   // This prevents re-fetching from API on subsequent navigation
   updateProblemInCache(activePlanId, targetProblemId, {
     problem: formattedProblem,
     codeDetails: formattedCodeDetails,
     userCode: formattedCodeDetails.defaultUserCode || ''
   });
   console.log('💾 Problem saved to unified cache for instant future access');

   setApiResponseReceived(true);
   setProblem(formattedProblem);
   setCodeDetails(formattedCodeDetails);
   setCurrentCompanyId(companyId);
   navigate('/study-plan/problem', { replace: true });

  } catch (err) {
   console.error('Error preparing problem from study plan:', err);

   if (err instanceof APIAuthenticationError) {
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
   console.error('Failed to regenerate:', error);
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

    console.log('📸 Captured view state (Resume/Review):', {
     scrollY: capturedViewState.scrollY,
     expandedDays: capturedViewState.expandedDays,
     currentProblemId: capturedViewState.currentProblemId,
     currentProblemDay: capturedViewState.currentProblemDay
    });

    // SIMPLIFIED LOGIC: Check unified cache ONLY (single source of truth)
    console.log(`💾 [Resume] Checking unified cache for problem ${problem.problemId}`);
    const cachedProblem = getProblemFromCache(activePlanId, problem.problemId);

    if (cachedProblem) {
      // Load from cache - this has the latest code from auto-save!
      console.log(`✅ [Resume] Loaded from cache with ${cachedProblem.userCode.length} chars of code`);
      setCurrentStudyPlanId(activePlanId);
      setCurrentPlanProblemId(problem.problemId);
      setCurrentCompanyId(companyId);
      setIsCompanyContextFlow(false);

      // Set problem and code data directly from cache
      setProblem(cachedProblem.problem);
      setCodeDetails(cachedProblem.codeDetails);
      setSolutionFromSolver(cachedProblem.userCode);
      setCurrentCode(cachedProblem.userCode);
      setApiResponseReceived(true);
      navigate('/study-plan/problem', { replace: true });
      return;
    }

    // No cache - fetch fresh from API (same as starting new)
    console.log(`🆕 [Resume] No cached data found, starting fresh from API`);
    await handleStartProblemFromPlan(problem, activePlanId);
   } catch (resumeErr) {
    console.error('Error resuming study plan problem:', resumeErr);
    // Try to start fresh as fallback, but don't redirect to Blind75
    const fallbackPlanId = planId || currentStudyPlanId;
    if (fallbackPlanId) {
     try {
      await handleStartProblemFromPlan(problem, fallbackPlanId);
     } catch (fallbackErr) {
      console.error('Failed to start problem as fallback:', fallbackErr);
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
   console.log('[Navigation] Already navigating, ignoring request');
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

   console.log(`[Navigation] ${direction} to ${targetProblem.title}:`, {
    hasCachedData: Boolean(cachedProblem),
    isInProgress: inProgressPlanProblems.has(targetProblem.problemId),
    isCompleted: completedPlanProblems.has(targetProblem.problemId),
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
  if (!currentStudyPlanId || !currentPlanProblemId) {
    return;
  }

  try {
    // Run all syncs in parallel for better performance
    const syncPromises: Promise<void>[] = [];

    // 1. Force save code if there's current code
    if (currentCode) {
      syncPromises.push(
        forceSave({
          planId: currentStudyPlanId,
          problemId: currentPlanProblemId,
          code: currentCode
        })
      );
    }

    // 2. Force sync plan progress (bookmarks, completion status)
    syncPromises.push(forceSyncPlanProgress());

    // 3. Force sync all study plan changes (problems, metadata)
    syncPromises.push(forceSyncStudyPlan());

    // Wait for all syncs to complete
    await Promise.all(syncPromises);
    console.log('✅ Full sync complete');
  } catch (error) {
    console.error('❌ Force full sync failed:', error);
    throw error; // Re-throw so caller can handle
  }
 }, [currentCode, currentStudyPlanId, currentPlanProblemId, forceSave, forceSyncPlanProgress, forceSyncStudyPlan]);

 // Direct navigation to plan view - no loading screen needed!
 const handleReturnToPlanViewImmediate = useCallback(() => {
  console.log('⚡ [Return to Plan] Navigating instantly without loading screen');

  // Save in background (non-blocking) if needed
  if (currentStudyPlanId && currentPlanProblemId) {
    const hasAnyPendingChanges = hasPendingProgressChanges || hasPendingPlanChanges;
    if (hasAnyPendingChanges) {
      console.log('💾 [View Plan] Starting background save...');
      forceFullSync()
        .then(() => console.log('✅ [Background Save] Completed'))
        .catch(error => console.error('❌ [Background Save] Failed:', error));
    }
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
  hasPendingPlanChanges
 ]);

 // Helper: Force save before any navigation
 const saveBeforeAction = useCallback(async (action: () => void | Promise<void>) => {
  if (currentStudyPlanId && currentPlanProblemId) {
    try {
      await forceFullSync();
    } catch (error) {
      console.error('Failed to save before action:', error);
    }
  }
  await action();
 }, [currentStudyPlanId, currentPlanProblemId, forceFullSync]);

 // Non-blocking navigation with background save (like View Plan button)
 const navigateWithBackgroundSave = useCallback((action: () => void | Promise<void>) => {
  // Save in background (non-blocking) if needed
  if (currentStudyPlanId && currentPlanProblemId) {
    const hasAnyPendingChanges = hasPendingProgressChanges || hasPendingPlanChanges;
    if (hasAnyPendingChanges) {
      console.log('💾 [Navigation] Starting background save...');
      forceFullSync()
        .then(() => console.log('✅ [Background Save] Completed'))
        .catch(error => console.error('❌ [Background Save] Failed:', error));
    }
  }

  // Execute action IMMEDIATELY - don't wait for save
  action();
 }, [currentStudyPlanId, currentPlanProblemId, forceFullSync, hasPendingProgressChanges, hasPendingPlanChanges]);

 // Force sync before sign-out to prevent data loss
 const handleBeforeSignOut = useCallback(async () => {
  console.log('🔄 [Sign-Out] Force syncing before sign-out...');

  // Only sync if user is actively working on study plan
  if (currentStudyPlanId && currentPlanProblemId && currentCode) {
    try {
      await forceFullSync();
      console.log('✅ [Sign-Out] Sync complete');
    } catch (error) {
      console.error('❌ [Sign-Out] Sync failed:', error);
      // Continue with sign-out even if sync fails (offline, network error, etc.)
    }
  } else {
    console.log('ℹ️ [Sign-Out] No active study plan, skipping sync');
  }
 }, [currentStudyPlanId, currentPlanProblemId, currentCode, forceFullSync]);

 // Handle return to Blind75 with view state restoration
 const handleReturnToBlind75 = useCallback(() => {
  console.log('⚡ [Return to Blind75] Navigating with view state');

  // Load view state from sessionStorage as backup (in case React state lost)
  const sessionViewState = loadBlind75ViewState();
  const viewStateToUse = sessionViewState || blind75ViewState;

  console.log('📜 Restoring Blind75 view state:', {
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
     <Route path="/" element={<IntroSection onStartClick={handleStartClick} />} />

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
    </div>
   </ErrorBoundary>
  </DarkModeProvider>
 );
}
