import { Routes, Route, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { IntroSection } from './pages/IntroSection';
import { ProblemForm } from './pages/ProblemForm';
import { LoadingSequence } from './LoadingSequence';
import { ResumeLoadingSequence } from './ResumeLoadingSequence';
import { ProblemSolver } from './ProblemSolver';
import { ResultsView } from './ResultsView';
import { Blind75 } from './pages/Blind75';
import { CompanyContextForm, CompanyContextFormData } from './pages/CompanyContextForm';
import { DarkModeProvider } from './DarkModeContext';
import { Navbar } from './Navbar';
import { ErrorBoundary } from './ErrorBoundary';
import { Problem, CodeDetails, TestCase, FormData } from '../types';
import { prepareProblem as prepareProblemAPI, createCustomCompany as createCustomCompanyAPI } from '../utils/api-service';
import { APIAuthenticationError } from '../utils/api-signing';
import { 
  addCompanyToCache, 
  addProblemToCache, 
  getCachedProblem, 
  markProblemAsSolved, 
  updateProblemSolution,
  getRecentCompanies
} from '../utils/cache';
import { blind75Data } from '../constants/blind75';



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

// Helper function to get the proper display name for a company
const getCompanyDisplayName = (companyId: string): string => {
  const companyMap: { [key: string]: string } = {
    'meta': 'Meta',
    'apple': 'Apple', 
    'amazon': 'Amazon',
    'netflix': 'Netflix',
    'google': 'Google',
    'microsoft': 'Microsoft'
  };
  
  return companyMap[companyId] || companyId;
};

// Helper function to find which topic a problem belongs to
const findTopicForProblem = (problemSlug: string): string => {
  for (const [topic, problems] of Object.entries(blind75Data)) {
    if (problems.some(p => p.slug === problemSlug)) {
      return topic;
    }
  }
  return 'random';
};

export function AppRouter() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // All the state from ProblemGenerator
  const [formData, setFormData] = useState<FormData>({
    dataset: 'blind75',
    company: 'openai',
    customCompany: '',
    difficulty: 'Medium',
    topic: 'random'
  });
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
  
  // Blind75 functionality state
  const [companyContextFormData, setCompanyContextFormData] = useState<CompanyContextFormData>({
    company: 'meta',
    customCompany: ''
  });
  const [selectedProblemSlug, setSelectedProblemSlug] = useState<string | null>(null);
  const [isCompanyContextFlow, setIsCompanyContextFlow] = useState(false);
  
  // Track the source page for proper back navigation from ProblemSolver
  const [sourcePageForBackNav, setSourcePageForBackNav] = useState<string>('/form');

  // Effect to restore state from URL parameters
  useEffect(() => {
    const problemId = searchParams.get('problemId');
    const company = searchParams.get('company');
    const difficulty = searchParams.get('difficulty');
    const topic = searchParams.get('topic');
    const isContext = searchParams.get('context') === 'true';
    const selectedSlug = searchParams.get('slug');

    // Restore form data if present in URL
    if (company || difficulty || topic) {
      setFormData(prev => ({
        ...prev,
        ...(company && { company }),
        ...(difficulty && { difficulty }),
        ...(topic && { topic })
      }));
    }

    // Restore context flow state
    if (isContext) {
      setIsCompanyContextFlow(true);
    }

    if (selectedSlug) {
      setSelectedProblemSlug(selectedSlug);
    }

    // Auto-resume problem if problemId is in URL and we're on the problem page
    if (problemId && location.pathname === '/problem' && !problem) {
      handleResumeProblem(problemId);
    }
  }, [searchParams, location.pathname]);

  // Helper function to update URL with state preservation
  const navigateWithState = (path: string, additionalParams: Record<string, string> = {}, replace: boolean = false) => {
    const newSearchParams = new URLSearchParams();
    
    // Preserve important state in URL
    if (problem?.problemId) {
      newSearchParams.set('problemId', problem.problemId);
    }
    
    if (isCompanyContextFlow) {
      newSearchParams.set('context', 'true');
      if (companyContextFormData.company) {
        newSearchParams.set('company', companyContextFormData.company);
      }
    } else {
      if (formData.company) {
        newSearchParams.set('company', formData.company);
      }
      if (formData.difficulty) {
        newSearchParams.set('difficulty', formData.difficulty);
      }
      if (formData.topic) {
        newSearchParams.set('topic', formData.topic);
      }
    }
    
    if (selectedProblemSlug) {
      newSearchParams.set('slug', selectedProblemSlug);
    }

    // Add any additional parameters
    Object.entries(additionalParams).forEach(([key, value]) => {
      newSearchParams.set(key, value);
    });

    navigate({
      pathname: path,
      search: newSearchParams.toString()
    }, { replace });
  };

  // Navigation handlers
  const handleStartClick = () => {
    setIsCompanyContextFlow(false);
    setSourcePageForBackNav('/form'); // Back should go to form for regular flow
    navigateWithState('/form');
  };
  
  const handleHomeClick = () => navigate('/');
  const handleBlind75Click = () => navigate('/blind75');

  // Handle practice with company context
  const handlePracticeWithContext = (problemSlug: string) => {
    setSelectedProblemSlug(problemSlug);
    setIsCompanyContextFlow(true);
    setSourcePageForBackNav('/blind75'); // Back should go to Blind75
    navigateWithState('/company-context-form', { slug: problemSlug, context: 'true' });
  };

  // Company context form submission
  const handleCompanyContextSubmit = async (data: CompanyContextFormData) => {
    try {
      setCompanyContextFormData(data);
      navigateWithState('/loading', { context: 'true' }); // Normal navigation to loading
      setError(null);
      setProblem(null);
      setCodeDetails(null);
      setEvaluationResults(null);
      setSolutionFromSolver(null);
      setApiResponseReceived(false);
      setIsResuming(false);
      setResumeProblemId(null);
      
      const { company, customCompany } = data;
      const isBlind75 = true;
      let companyId = company;
      let companyName = company;
      let shouldCacheCompany = false;
      
      if (company === 'custom' && customCompany) {
        // Check if this custom company is already in cache
        const recentCompanies = getRecentCompanies();
        const cachedCompany = recentCompanies.find(c => c.name === customCompany);
        
        if (cachedCompany) {
          // Use cached company info instead of calling API again
          companyId = cachedCompany.id;
          companyName = cachedCompany.name;
          shouldCacheCompany = false; // Already in cache
        } else {
          // Company not in cache, call API to initialize
          const companyData = await createCustomCompanyAPI(customCompany);
          if (!companyData.success) throw new Error(companyData.message || 'Failed to initialize company');
          companyId = companyData.company.id;
          companyName = companyData.company.name || companyData.company.displayName || customCompany;
          shouldCacheCompany = true; // New company, should cache
        }
      } else {
        companyName = getCompanyDisplayName(company);
        shouldCacheCompany = false; // Predefined companies don't get cached
      }
      
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
      const uniqueProblemId = `${baseProblemId}_${companyId}`;

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
      
      // Only add to cache if we made an API call to get new company info
      if (shouldCacheCompany) {
        addCompanyToCache(companyId, companyName);
      }
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
      navigateWithState('/problem', { problemId: uniqueProblemId }, true); // Replace loading sequence, keeping source page in history

    } catch (err) {
      // Only log errors in development to avoid exposing sensitive information
      if (import.meta.env.DEV) {
        console.error('Error preparing contextualized problem:', err);
      }
      
      if (err instanceof APIAuthenticationError) {
        setError(err.message + ' Please refresh the page and try again.');
      } else {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      }
      navigateWithState('/company-context-form');
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
      setSourcePageForBackNav('/blind75'); // Back should go to Blind75 for resumed problems
      navigateWithState('/resume-loading', { problemId }); // Normal navigation to loading
      
      const cachedProblem = getCachedProblem(problemId);
      if (!cachedProblem) {
        throw new Error('Cached problem not found');
      }

      const baseProblemId = problemId.includes('_') 
        ? problemId.substring(0, problemId.lastIndexOf('_'))
        : problemId;

      const responseData = await prepareProblemAPI(
        baseProblemId,
        cachedProblem.companyId,
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

  const initializeCustomCompany = async (customCompany: string): Promise<{ companyId: string; companyName: string }> => {
    // Check if this custom company is already in cache
    const recentCompanies = getRecentCompanies();
    const cachedCompany = recentCompanies.find(c => c.name === customCompany);
    
    if (cachedCompany) {
      // Use cached company info instead of calling API again
      return {
        companyId: cachedCompany.id,
        companyName: cachedCompany.name
      };
    } else {
      // Company not in cache, call API to initialize
      const companyData = await createCustomCompanyAPI(customCompany);
      if (!companyData.success) throw new Error(companyData.message || 'Failed to initialize company');
      return {
        companyId: companyData.company.id,
        companyName: companyData.company.name || companyData.company.displayName || customCompany
      };
    }
  };

  const handleFormSubmit = async (data: FormData) => {
    try {
      setFormData(data);
      setIsCompanyContextFlow(false);
      navigateWithState('/loading', {
        company: data.company,
        difficulty: data.difficulty,
        topic: data.topic
      }); // Normal navigation to loading
      setError(null);
      setProblem(null);
      setCodeDetails(null);
      setEvaluationResults(null);
      setSolutionFromSolver(null);
      setApiResponseReceived(false);
      setIsResuming(false);
      setResumeProblemId(null);
      
      const { company, customCompany, difficulty, specificProblemSlug } = data;
      const isBlind75 = data.dataset === 'blind75';
      let companyId = company;
      let companyName = company;
      let shouldCacheCompany = false;
      
      if (company === 'custom' && customCompany) {
        const companyInfo = await initializeCustomCompany(customCompany);
        companyId = companyInfo.companyId;
        companyName = companyInfo.companyName;
        shouldCacheCompany = true;
      } else {
        companyName = getCompanyDisplayName(company);
        shouldCacheCompany = false; // Predefined companies don't get cached
      }
      
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
      const uniqueProblemId = `${baseProblemId}_${companyId}`;

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
      
      // Only add to cache if we made an API call to get new company info
      if (shouldCacheCompany) {
        addCompanyToCache(companyId, companyName);
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
      navigateWithState('/problem', { problemId: uniqueProblemId }, true); // Replace loading sequence, keeping source page in history

    } catch (err) {
      console.error('Error preparing problem:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      navigateWithState('/form');
    }
  };

  const handleCodeChange = (code: string) => {
    if (problem?.problemId) {
      updateProblemSolution(problem.problemId, code);
    }
  };

  const handleFinalSolutionSubmit = (code: string) => {
    setSolutionFromSolver(code);
    
    if (problem?.problemId) {
      markProblemAsSolved(problem.problemId, code);
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
    navigateWithState('/results');
  };

  const handleTryAgain = () => {
    navigateWithState('/form');
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
  };

  const handleGoBackToProblem = () => {
    navigateWithState('/problem');
  };

  const handleSolveAnother = () => {
    let currentCompanyInfo = { company: 'meta', customCompany: '' };
    let currentDifficulty = 'Medium';
    let currentTopic = 'random';
    
    if (isCompanyContextFlow && selectedProblemSlug) {
      currentTopic = findTopicForProblem(selectedProblemSlug);
    } else if (isCompanyContextFlow) {
      currentTopic = 'random';
    } else {
      currentTopic = formData.topic || 'random';
    }
    
    const fallbackDifficulty = isCompanyContextFlow ? 'Medium' : (formData.difficulty || 'Medium');
    
    if (problem?.problemId) {
      const cachedProblem = getCachedProblem(problem.problemId);
      if (cachedProblem) {
        // Check if this is a predefined company or a custom one
        const predefinedCompanies = ['meta', 'apple', 'amazon', 'netflix', 'google', 'microsoft'];
        if (cachedProblem.companyId === 'custom' || !predefinedCompanies.includes(cachedProblem.companyId)) {
          // This is a custom company (either stored as 'custom' or any other non-predefined ID)
          currentCompanyInfo = {
            company: 'custom',
            customCompany: cachedProblem.companyName
          };
        } else {
          // This is a predefined company
          currentCompanyInfo = {
            company: cachedProblem.companyId,
            customCompany: ''
          };
        }
        
        currentDifficulty = ['Mixed', 'Random'].includes(cachedProblem.difficulty) 
          ? fallbackDifficulty 
          : cachedProblem.difficulty;
      } else {
        if (isCompanyContextFlow) {
          currentCompanyInfo = {
            company: companyContextFormData.company,
            customCompany: companyContextFormData.customCompany || ''
          };
          currentDifficulty = fallbackDifficulty;
        } else {
          currentCompanyInfo = {
            company: formData.company,
            customCompany: formData.customCompany || ''
          };
          currentDifficulty = fallbackDifficulty;
        }
      }
    } else {
      if (isCompanyContextFlow) {
        currentCompanyInfo = {
          company: companyContextFormData.company,
          customCompany: companyContextFormData.customCompany || ''
        };
        currentDifficulty = fallbackDifficulty;
      } else {
        currentCompanyInfo = {
          company: formData.company,
          customCompany: formData.customCompany || ''
        };
        currentDifficulty = fallbackDifficulty;
      }
    }
    
    const newFormData = {
      dataset: 'blind75',
      company: currentCompanyInfo.company,
      customCompany: currentCompanyInfo.customCompany,
      difficulty: currentDifficulty,
      topic: currentTopic,
    };
    
    setFormData(newFormData);
    navigateWithState('/form', {
      company: newFormData.company,
      difficulty: newFormData.difficulty,
      topic: newFormData.topic
    });
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
  };

  const handleResumeLoadingComplete = () => {
    navigateWithState('/problem', {}, true); // Use replace=true to replace the loading sequence
    setIsResuming(false);
    setResumeProblemId(null);
    setResumeDataLoaded(false);
  };

  return (
    <DarkModeProvider>
      <ErrorBoundary>
        <div className="min-h-screen font-sans text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
          {location.pathname !== '/' && (
            <Navbar 
              onHomeClick={handleHomeClick} 
              onBlind75Click={handleBlind75Click}
            />
          )}
          
          <Routes>
          <Route path="/" element={<IntroSection onStartClick={handleStartClick} />} />
          
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
              <ProblemForm initialData={formData} onSubmit={handleFormSubmit} />
              {error && (
                <div className="max-w-md mx-auto mt-4 p-3 bg-red-100 text-red-700 rounded-md">
                  <p className="text-sm font-medium">Error: {error}</p>
                </div>
              )}
            </>
          } />
          
          <Route path="/loading" element={
            <LoadingSequence 
              company={
                isCompanyContextFlow
                  ? (companyContextFormData.company === 'custom' ? companyContextFormData.customCompany : getCompanyDisplayName(companyContextFormData.company))
                  : (formData.company === 'custom' ? formData.customCompany : getCompanyDisplayName(formData.company))
              }
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
              />
            ) : (
              <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mb-4"></div>
                  <h2 className="text-xl font-medium">Loading problem data...</h2>
                  <p className="text-sm text-gray-500 mt-2">If this persists, please try again.</p>
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
        </Routes>
        </div>
      </ErrorBoundary>
    </DarkModeProvider>
  );
} 