import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { IntroSection } from './pages/IntroSection';
import { ProblemForm } from './pages/ProblemForm';
import { LoadingSequence } from './LoadingSequence';
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
import { StudyPlanConfig, StudyPlanResponse, EnrichedProblem, CachedStudyPlan } from '../types/studyPlan';
import { prepareProblem as prepareProblemAPI, generateStudyPlan as generateStudyPlanAPI } from '../utils/api-service';
import { APIAuthenticationError } from '../utils/api-errors';
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
  saveProblemWithDetails,
  getProblemDetailsFromFirestore
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

interface TestResultsFromParent {
 passed: boolean;
 executionTime: string;
 memoryUsed: string;
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
    // Save to Firestore
    await saveProblemCode(data.planId, data.problemId, data.code);
    setLastSaveTime(Date.now());
  },
  onError: (error) => {
    console.error('[Auto-Save] Error:', error);
  }
 });

 const clearPlanSessionContext = useCallback(() => {
  setCurrentPlanProblemId(null);
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
   // Load from cache first for instant display
   const cachedPlan = getPlanFromCache(planId);

   if (cachedPlan) {
     // Instant load from cache
     console.log(`💾 [Cache] Loading plan ${planId} from cache`);
     setCurrentStudyPlanId(planId);
     setStudyPlanConfig(cachedPlan.config);
     setStudyPlanResponse(cachedPlan.response);
     syncPlanStructures(cachedPlan.response);

     // Initialize progress from cache
     initializePlanProgressState(
       new Set(cachedPlan.progress.completedProblems),
       new Set(cachedPlan.progress.bookmarkedProblems),
       new Set(cachedPlan.progress.inProgressProblems)
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

     // Save to cache for next time
     const cachedData = migrateToCachedPlanData(plan);
     savePlanToCache(cachedData);

     setCurrentStudyPlanId(planId);
     setStudyPlanConfig(plan.config);
     setStudyPlanResponse(plan.response);
     syncPlanStructures(plan.response);

     // Initialize progress from Firestore data (already fetched, no need for blocking call)
     initializePlanProgressState(
       new Set(plan.progress.completedProblems || []),
       new Set(plan.progress.bookmarkedProblems || []),
       new Set(plan.progress.inProgressProblems || [])
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
  clearPlanSessionContext();
  setSelectedProblemSlug(problemSlug);
  setIsCompanyContextFlow(true);
  navigate('/company-context-form');
 };

 // Company context form submission
 const handleCompanyContextSubmit = async (data: CompanyContextFormData) => {
  try {
   clearPlanSessionContext();
   setCompanyContextFormData(data);
   setCurrentCompanyId(data.company);
   if (!planProblemMap[problem.problemId]) {
    syncPlanStructures();
   }

   setCurrentPlanProblemId(problem.problemId);

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
    title: responseData.problem?.title || "Algorithm Challenge",
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
    title: responseData.problem?.title || "Algorithm Challenge",
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
    title: responseData.problem?.title || "Algorithm Challenge",
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

 const handleFinalSolutionSubmit = async (code: string) => {
  setSolutionFromSolver(code);

  if (problem?.problemId) {
   // Non-study-plan: keep using cache.ts
   if (!currentStudyPlanId) {
    markProblemAsSolved(problem.problemId, code);
   }

   // Study plan: update Firestore
   if (currentStudyPlanId && currentPlanProblemId) {
    try {
      // Force save code immediately
      await forceSave({
        planId: currentStudyPlanId,
        problemId: currentPlanProblemId,
        code
      });

      // Mark as solved (optimistic update)
      updateStatusOptimistic(currentPlanProblemId, 'solved');

      // Force sync to ensure it's persisted
      await forceSyncPlanProgress();
    } catch (error) {
      console.error('Failed to mark problem as solved:', error);
    }
   }
  }

  // Limit test cases to match what was actually executed (default 20 from ProblemSolver)
  const maxTestCasesExecuted = 20;
  const executedTestCases = problem?.testCases.slice(0, maxTestCasesExecuted) || [];

  const mockFinalResults: TestResultsFromParent = {
    passed: true,
    executionTime: executedTestCases.length > 0 ? Math.floor(Math.random() * 100) + 'ms' : 'N/A',
    memoryUsed: executedTestCases.length > 0 ? Math.floor(Math.random() * 10) + 'MB' : 'N/A',
    testCases: executedTestCases.map(tc => ({
      input: typeof tc.stdin === 'object' ? JSON.stringify(tc.stdin) : String(tc.stdin),
      output: typeof tc.expectedStdout === 'object' ? JSON.stringify(tc.expectedStdout) : String(tc.expectedStdout),
      passed: true
    })),
  };
  setEvaluationResults(mockFinalResults);
  setShowSaveProgress(true);
  navigate('/results');
 };

 const handleTryAgain = () => {
  navigate('/form');
  setIsCompanyContextFlow(false);
  setSolutionFromSolver(null);
  setEvaluationResults(null);
  setProblem(null);
  setCodeDetails(null);
  setError(null);
  setApiResponseReceived(false);
  setIsResuming(false);
  setResumeProblemId(null);
  setResumeDataLoaded(false);
  clearPlanSessionContext();
 };

 const handleGoBackToProblem = () => {
  navigate('/problem');
 };

 const handleSolveAnother = () => {
  navigate('/form');
  setIsCompanyContextFlow(false);
  setSolutionFromSolver(null);
  setEvaluationResults(null);
  setProblem(null);
  setCodeDetails(null);
  setError(null);
  setApiResponseReceived(false);
  setIsResuming(false);
  setResumeProblemId(null);
  setResumeDataLoaded(false);
  clearPlanSessionContext();
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
  navigate('/');
 };

 const handleBackToStudyPlanForm = () => {
  navigate('/study-plan-form');
 };

 const handleStartProblemFromPlan = async (problem: EnrichedProblem, planId?: string) => {
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

   navigate('/loading');
   setError(null);
   setProblem(null);
   setCodeDetails(null);
   setEvaluationResults(null);
   setSolutionFromSolver(null);
   setApiResponseReceived(false);
   setIsResuming(false);
   setResumeProblemId(null);

   setCurrentStudyPlanId(activePlanId);

   const companyId = activeStudyPlanConfig.companyId;
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
    title: responseData.problem?.title || problem.title,
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

 const handleRegenerateCurrentPlanProblem = useCallback(() => {
  if (!currentStudyPlanId || !currentPlanProblemId) return;
  const info = planProblemMap[currentPlanProblemId];
  if (info) {
   handleStartProblemFromPlan(info.problem, currentStudyPlanId);
  }
 }, [currentPlanProblemId, currentStudyPlanId, planProblemMap, handleStartProblemFromPlan]);

 const handleResumeStudyPlanProblem = useCallback(
  async (problem: EnrichedProblem, planId?: string) => {
   try {
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

    // 1. Check unified cache first (instant - has latest code from auto-save)
    console.log(`💾 [Resume] Checking cache for problem ${problem.problemId}`);
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

    // 2. Check old localStorage format (migration path)
    console.log(`💾 [Resume] Checking old localStorage format`);
    const oldKey = `problem_${activePlanId}_${problem.problemId}`;
    const oldCachedCode = localStorage.getItem(oldKey);

    if (oldCachedCode) {
      console.log(`💾 [Resume] Found old format cache with ${oldCachedCode.length} chars of code`);
      // Instead of calling handleResumeProblem (which can redirect to Blind75 on error),
      // fetch problem details from Firestore and migrate the code
      const firestoreData = await getProblemDetailsFromFirestore(activePlanId, problem.problemId);

      if (firestoreData) {
        console.log(`✅ [Resume] Migrated old code to new format`);
        setCurrentStudyPlanId(activePlanId);
        setCurrentPlanProblemId(problem.problemId);
        setCurrentCompanyId(companyId);
        setIsCompanyContextFlow(false);

        setProblem(firestoreData.problem);
        setCodeDetails(firestoreData.codeDetails);
        // Use the old cached code (it might be newer than Firestore)
        setSolutionFromSolver(oldCachedCode);
        setCurrentCode(oldCachedCode);
        setApiResponseReceived(true);

        // Migrate to new cache format
        updateProblemInCache(activePlanId, problem.problemId, {
          problem: firestoreData.problem,
          codeDetails: firestoreData.codeDetails,
          userCode: oldCachedCode
        });

        navigate('/study-plan/problem', { replace: true });
        return;
      } else {
        // Firestore doesn't have the problem - fall through to fresh API call
        console.log(`⚠️ [Resume] Old code found but no Firestore data, starting fresh`);
      }
    }

    // 3. Try Firestore as fallback (first access, not in cache yet)
    console.log(`☁️ [Resume] Not in cache, checking Firestore for first access`);
    const firestoreData = await getProblemDetailsFromFirestore(activePlanId, problem.problemId);

    if (firestoreData) {
      console.log(`✅ [Resume] Loaded from Firestore with ${firestoreData.code.length} chars of code`);
      setCurrentStudyPlanId(activePlanId);
      setCurrentPlanProblemId(problem.problemId);
      setCurrentCompanyId(companyId);
      setIsCompanyContextFlow(false);

      setProblem(firestoreData.problem);
      setCodeDetails(firestoreData.codeDetails);
      setSolutionFromSolver(firestoreData.code);
      setCurrentCode(firestoreData.code);
      setApiResponseReceived(true);
      navigate('/study-plan/problem', { replace: true });
      return;
    }

    // 4. No cached data anywhere, start problem fresh from API
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
  [currentStudyPlanId, handleStartProblemFromPlan, studyPlanConfig, navigate]
 );

 const handleNavigateStudyPlanProblem = useCallback(async (direction: 'next' | 'prev') => {
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

  let shouldResume = inProgressPlanProblems.has(targetProblem.problemId);

  if (!shouldResume) {
   const activePlanId = currentStudyPlanId;
   if (activePlanId) {
    let companyForPlan = studyPlanConfig?.companyId;
    if (!companyForPlan) {
     const cachedPlan = getPlanFromCache(activePlanId);
     companyForPlan = cachedPlan?.config.companyId;
    }

    if (companyForPlan) {
     const cacheKey = buildPlanProblemCacheKey(activePlanId, targetProblem.problemId, companyForPlan);
     const cachedEntry = getCachedProblem(cacheKey);
     shouldResume = Boolean(cachedEntry);
    }
   }
  }

  if (shouldResume) {
   handleResumeStudyPlanProblem(targetProblem, currentStudyPlanId);
  } else {
   handleStartProblemFromPlan(targetProblem, currentStudyPlanId);
  }
 }, [
  currentPlanProblemId,
  currentStudyPlanId,
  handleResumeStudyPlanProblem,
  handleStartProblemFromPlan,
  inProgressPlanProblems,
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

 const studyPlanSolverContext = useMemo(() => {
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
   onNext: () => saveBeforeAction(() => handleNavigateStudyPlanProblem('next')),
   onPrev: () => saveBeforeAction(() => handleNavigateStudyPlanProblem('prev')),
   onRegenerate: () => saveBeforeAction(handleRegenerateCurrentPlanProblem),
   onToggleBookmark: handleToggleBookmarkForCurrentProblem,
   onToggleCompletion: handleManualPlanCompletionToggle,
   onReturnToPlan: handleReturnToPlanViewImmediate, // Use immediate version - no blocking saves!
   onResume: () => saveBeforeAction(() => handleResumeStudyPlanProblem(info.problem, currentStudyPlanId || undefined))
  };
 }, [
  inProgressPlanProblems,
  bookmarkedPlanProblems,
  completedPlanProblems,
  currentPlanProblemId,
  currentStudyPlanId,
  saveBeforeAction,
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
     {location.pathname !== '/' && (
      <Navbar
       onHomeClick={handleHomeClick}
       onBlind75Click={handleBlind75Click}
       onStudyPlansClick={handleStudyPlansClick}
       onBeforeSignOut={handleBeforeSignOut}
      />
     )}

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
      <LoadingSequence
       company={getCompanyDisplayName(isCompanyContextFlow ? companyContextFormData.company : currentCompanyId)}
       maxTotalDuration={MAX_LOADING_DURATION_SECONDS}
       forceComplete={apiResponseReceived}
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
        problem={problem}
        solution={solutionFromSolver}
        codeDetails={codeDetails}
        onSubmit={handleFinalSolutionSubmit}
        onCodeChange={handleCodeChange}
        testResults={evaluationResults}
        onSolveAnother={handleSolveAnother}
        studyPlanContext={studyPlanSolverContext}
       />
      ) : (
       <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
        <div className="text-center">
         <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mb-4"></div>
         <h2 className="text-xl font-medium">Loading problem data...</h2>
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
         problem={problem}
         solution={solutionFromSolver}
         codeDetails={codeDetails}
         onSubmit={handleFinalSolutionSubmit}
         onCodeChange={handleCodeChange}
         testResults={evaluationResults}
         onSolveAnother={handleSolveAnother}
         studyPlanContext={studyPlanSolverContext}
        />
       ) : (
        <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
         <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mb-4"></div>
          <h2 className="text-xl font-medium">Loading problem data...</h2>
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
        onTryAgain={handleTryAgain}
        onGoBackToProblem={handleGoBackToProblem}
        totalTestCases={problem.testCases.length}
        executedTestCases={Math.min(20, problem.testCases.length)}
       />
      ) : (
       <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
        <div className="text-center">
         <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mb-4"></div>
         <h2 className="text-xl font-medium">Loading results...</h2>
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
       <LoadingSequence
        company={studyPlanConfig ? getCompanyDisplayName(studyPlanConfig.companyId) : 'Company'}
        maxTotalDuration={MAX_LOADING_DURATION_SECONDS}
        forceComplete={!isGeneratingStudyPlan}
       />
      </PremiumGate>
     } />

     <Route path="/study-plan-view" element={
      <PremiumGate feature="Study Plans" message="Please sign in to access My Study Plans.">
       {studyPlanResponse && studyPlanConfig ? (
        <StudyPlanView
         studyPlan={studyPlanResponse}
         companyId={studyPlanConfig.companyId}
         studyPlanId={currentStudyPlanId}
         onBack={handleBackToStudyPlanForm}
         onStartProblem={handleStartProblemFromPlan}
         completedProblems={completedPlanProblems}
         bookmarkedProblems={bookmarkedPlanProblems}
         onToggleBookmark={handleToggleBookmarkForProblem}
         inProgressProblems={inProgressPlanProblems}
         onResumeProblem={handleResumeStudyPlanProblem}
        />
       ) : (
        <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
         <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mb-4"></div>
          <h2 className="text-xl font-medium">Loading study plan...</h2>
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
