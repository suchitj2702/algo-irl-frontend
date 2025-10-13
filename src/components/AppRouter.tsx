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
import { DuplicateWarningModal } from './DuplicateWarningModal';
import { DarkModeProvider } from './DarkModeContext';
import { Navbar } from './Navbar';
import { ErrorBoundary } from './ErrorBoundary';
import { Problem, CodeDetails, TestCase, FormData, Company } from '../types';
import { StudyPlanConfig, StudyPlanResponse, EnrichedProblem, CachedStudyPlan } from '../types/studyPlan';
import { prepareProblem as prepareProblemAPI, generateStudyPlan as generateStudyPlanAPI } from '../utils/api-service';
import { APIAuthenticationError } from '../utils/api-signing';
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
import {
 saveStudyPlan,
 generateStudyPlanId,
 findDuplicateStudyPlan,
 updateStudyPlan,
 getStudyPlan,
 updateStudyPlanProgress,
 toggleStudyPlanBookmark,
 setStudyPlanProblemInProgress,
 buildPlanProblemCacheKey
} from '../utils/studyPlanCache';
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
 const [completedPlanProblems, setCompletedPlanProblems] = useState<Set<string>>(new Set());
 const [bookmarkedPlanProblems, setBookmarkedPlanProblems] = useState<Set<string>>(new Set());
 const [inProgressPlanProblems, setInProgressPlanProblems] = useState<Set<string>>(new Set());
 const [currentPlanProblemId, setCurrentPlanProblemId] = useState<string | null>(null);

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

 const syncPlanProgress = useCallback((planId?: string) => {
  const activePlanId = planId || currentStudyPlanId;
  if (!activePlanId) {
   setCompletedPlanProblems(new Set());
   setBookmarkedPlanProblems(new Set());
   setInProgressPlanProblems(new Set());
   return;
  }

  const cachedPlan = getStudyPlan(activePlanId);
  if (!cachedPlan) return;

  setCompletedPlanProblems(new Set(cachedPlan.progress.completedProblems || []));
  setBookmarkedPlanProblems(new Set(cachedPlan.progress.bookmarkedProblems || []));
  setInProgressPlanProblems(new Set(cachedPlan.progress.inProgressProblems || []));
 }, [currentStudyPlanId]);

 useEffect(() => {
  syncPlanStructures();
 }, [studyPlanResponse, syncPlanStructures]);

 useEffect(() => {
  syncPlanProgress();
 }, [currentStudyPlanId, syncPlanProgress]);

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

 const handleViewStudyPlan = (planId: string) => {
  const plan = getStudyPlan(planId);
  if (!plan) {
   console.error('Study plan not found:', planId);
   return;
  }

  setCurrentStudyPlanId(planId);
  setStudyPlanConfig(plan.config);
  setStudyPlanResponse(plan.response);
  syncPlanStructures(plan.response);
  syncPlanProgress(planId);
  setCurrentPlanProblemId(null);
  navigate('/study-plan-view');
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

 const handleCodeChange = (code: string) => {
  if (problem?.problemId) {
   updateProblemSolution(problem.problemId, code);
  }

  if (currentStudyPlanId && currentPlanProblemId) {
   if (!inProgressPlanProblems.has(currentPlanProblemId)) {
    const updatedProgress = setStudyPlanProblemInProgress(currentStudyPlanId, currentPlanProblemId, true);
    if (updatedProgress) {
     setInProgressPlanProblems(new Set(updatedProgress.inProgressProblems || []));
     setCompletedPlanProblems(new Set(updatedProgress.completedProblems || []));
    } else {
     setInProgressPlanProblems(prev => new Set(prev).add(currentPlanProblemId));
    }
   }
  }
 };

 const handleFinalSolutionSubmit = (code: string) => {
  setSolutionFromSolver(code);

  if (problem?.problemId) {
   markProblemAsSolved(problem.problemId, code);

   // If we're working on a study plan problem, update progress
   if (currentStudyPlanId && currentPlanProblemId) {
    const updatedProgress = updateStudyPlanProgress(currentStudyPlanId, currentPlanProblemId, true);

    if (updatedProgress) {
     setCompletedPlanProblems(new Set(updatedProgress.completedProblems || []));
     setInProgressPlanProblems(new Set(updatedProgress.inProgressProblems || []));
    } else {
     setCompletedPlanProblems(prev => {
      const next = new Set(prev);
      next.add(currentPlanProblemId);
      return next;
     });
     setInProgressPlanProblems(prev => {
      const next = new Set(prev);
      next.delete(currentPlanProblemId);
      return next;
     });
    }

    syncPlanProgress(currentStudyPlanId);
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
   const duplicate = findDuplicateStudyPlan(config);
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

   let resultingPlanId = overwritePlanId;

   if (overwritePlanId) {
    // Overwrite existing plan
    updateStudyPlan(overwritePlanId, response, false);
   } else {
    // Create new plan
    const planId = generateStudyPlanId(config);
    saveStudyPlan(planId, config, response);
    resultingPlanId = planId;
   }

   if (resultingPlanId) {
    setCurrentStudyPlanId(resultingPlanId);
    syncPlanProgress(resultingPlanId);
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
    const cachedPlan = getStudyPlan(activePlanId);
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

   const updatedProgress = setStudyPlanProblemInProgress(activePlanId, targetProblemId, true);
   if (updatedProgress) {
    setInProgressPlanProblems(new Set(updatedProgress.inProgressProblems || []));
    setCompletedPlanProblems(new Set(updatedProgress.completedProblems || []));
   } else {
    setInProgressPlanProblems(prev => {
     const next = new Set(prev);
     next.add(targetProblemId);
     return next;
    });
    setCompletedPlanProblems(prev => {
     if (!prev.has(targetProblemId)) return prev;
     const next = new Set(prev);
     next.delete(targetProblemId);
     return next;
    });
   }
   syncPlanProgress(activePlanId);

   setApiResponseReceived(true);
   setProblem(formattedProblem);
   setCodeDetails(formattedCodeDetails);
   setCurrentCompanyId(companyId);
   navigate('/problem', { replace: true });

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

    if (!activeStudyPlanConfig) {
     const cachedPlan = getStudyPlan(activePlanId);
     if (cachedPlan) {
      activeStudyPlanConfig = cachedPlan.config;
      setStudyPlanConfig(cachedPlan.config);
     }
    }

    if (!activeStudyPlanConfig) {
     throw new Error('Study plan configuration not found for resume');
    }

    const companyId = activeStudyPlanConfig.companyId;
    const uniqueProblemId = buildPlanProblemCacheKey(activePlanId, problem.problemId, companyId);
    const cached = getCachedProblem(uniqueProblemId);

    if (!cached) {
     await handleStartProblemFromPlan(problem, activePlanId);
     return;
    }

    setCurrentStudyPlanId(activePlanId);
    setCurrentPlanProblemId(problem.problemId);
    setCurrentCompanyId(companyId);
    setIsCompanyContextFlow(false);
    handleResumeProblem(uniqueProblemId);
   } catch (resumeErr) {
    console.error('Error resuming study plan problem:', resumeErr);
    const fallbackPlanId = planId || currentStudyPlanId;
    if (fallbackPlanId) {
     await handleStartProblemFromPlan(problem, fallbackPlanId);
    }
   }
  },
  [currentStudyPlanId, handleResumeProblem, handleStartProblemFromPlan, studyPlanConfig]
 );

 const handleNavigateStudyPlanProblem = useCallback((direction: 'next' | 'prev') => {
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
     const cachedPlan = getStudyPlan(activePlanId);
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
   toggleStudyPlanBookmark(currentStudyPlanId, problemId);
   syncPlanProgress(currentStudyPlanId);
  },
  [currentStudyPlanId, syncPlanProgress]
 );

 const handleToggleBookmarkForCurrentProblem = useCallback(() => {
  if (!currentStudyPlanId || !currentPlanProblemId) return;
  handleToggleBookmarkForProblem(currentPlanProblemId);
 }, [currentPlanProblemId, currentStudyPlanId, handleToggleBookmarkForProblem]);

 const handleManualPlanCompletionToggle = useCallback(() => {
  if (!currentStudyPlanId || !currentPlanProblemId) return;

  const isAlreadyCompleted = completedPlanProblems.has(currentPlanProblemId);
  const nextCompletedState = !isAlreadyCompleted;

  const progressAfterCompletionToggle = updateStudyPlanProgress(
   currentStudyPlanId,
   currentPlanProblemId,
   nextCompletedState
  );

  const progressAfterInProgressUpdate = setStudyPlanProblemInProgress(
   currentStudyPlanId,
   currentPlanProblemId,
   !nextCompletedState
  );

  const latestProgress = progressAfterInProgressUpdate || progressAfterCompletionToggle;

  if (latestProgress) {
   setCompletedPlanProblems(new Set(latestProgress.completedProblems || []));
   setInProgressPlanProblems(new Set(latestProgress.inProgressProblems || []));
  } else {
   setCompletedPlanProblems(prev => {
    const next = new Set(prev);
    if (nextCompletedState) {
     next.add(currentPlanProblemId);
    } else {
     next.delete(currentPlanProblemId);
    }
    return next;
   });
   setInProgressPlanProblems(prev => {
    const next = new Set(prev);
    if (nextCompletedState) {
     next.delete(currentPlanProblemId);
    } else {
     next.add(currentPlanProblemId);
    }
    return next;
   });
  }

  syncPlanProgress(currentStudyPlanId);
 }, [completedPlanProblems, currentPlanProblemId, currentStudyPlanId, syncPlanProgress]);

 const handleReturnToPlanView = useCallback(() => {
  if (currentStudyPlanId) {
   handleViewStudyPlan(currentStudyPlanId);
  } else {
   navigate('/study-plan-view');
  }
 }, [currentStudyPlanId, handleViewStudyPlan, navigate]);

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
   onNext: () => handleNavigateStudyPlanProblem('next'),
   onPrev: () => handleNavigateStudyPlanProblem('prev'),
   onRegenerate: handleRegenerateCurrentPlanProblem,
   onToggleBookmark: handleToggleBookmarkForCurrentProblem,
   onToggleCompletion: handleManualPlanCompletionToggle,
   onReturnToPlan: handleReturnToPlanView,
   onResume: () => handleResumeStudyPlanProblem(info.problem, currentStudyPlanId || undefined)
  };
 }, [
  inProgressPlanProblems,
  bookmarkedPlanProblems,
  completedPlanProblems,
  currentPlanProblemId,
  currentStudyPlanId,
  handleManualPlanCompletionToggle,
  handleNavigateStudyPlanProblem,
  handleRegenerateCurrentPlanProblem,
  handleReturnToPlanView,
  handleToggleBookmarkForCurrentProblem,
  planProblemMap,
  planProblems.length
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
      <MyStudyPlansPage
       onCreateNew={handleCreateNewStudyPlan}
       onViewPlan={handleViewStudyPlan}
      />
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
      <StudyPlanForm
       onSubmit={handleGenerateStudyPlan}
       onCancel={handleStudyPlanFormCancel}
       isLoading={isGeneratingStudyPlan}
       error={studyPlanError}
      />
     } />

     <Route path="/study-plan-loading" element={
      <LoadingSequence
       company={studyPlanConfig ? getCompanyDisplayName(studyPlanConfig.companyId) : 'Company'}
       maxTotalDuration={MAX_LOADING_DURATION_SECONDS}
       forceComplete={!isGeneratingStudyPlan}
      />
     } />

     <Route path="/study-plan-view" element={
      studyPlanResponse && studyPlanConfig ? (
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
      )
     } />
    </Routes>
    </div>
   </ErrorBoundary>
  </DarkModeProvider>
 );
}
