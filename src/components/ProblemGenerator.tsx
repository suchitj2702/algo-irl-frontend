import { useState, useEffect } from 'react';
import { IntroSection } from './IntroSection';
import { ProblemForm, FormData } from './ProblemForm';
import { LoadingSequence } from './LoadingSequence';
import { ResumeLoadingSequence } from './ResumeLoadingSequence';
import { ProblemSolver } from './ProblemSolver';
import { ResultsView } from './ResultsView';
import { Blind75 } from './Blind75';
import { CompanyContextForm, CompanyContextFormData } from './CompanyContextForm';
import { DarkModeProvider } from './DarkModeContext';
import { Navbar } from './Navbar';
import { TestCase } from '../utils/codeExecution';
import { API_CONFIG, buildApiUrl } from '../config/api';
import { 
  addCompanyToCache, 
  addProblemToCache, 
  getCachedProblem, 
  markProblemAsSolved, 
  updateProblemSolution,
  getRecentCompanies
} from '../utils/cache';
import { blind75Data } from '../constants/blind75';

interface Problem {
  title: string;
  background: string;
  problemStatement: string;
  testCases: TestCase[];
  constraints: string[];
  requirements: string[];
  leetcodeUrl: string;
  problemId?: string; // Add problemId to Problem interface
}

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

interface CodeDetails {
  defaultUserCode?: string;
  functionName?: string;
  solutionStructureHint?: string;
  boilerplateCode: string;
  language: string;
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
  return 'random'; // fallback if not found
};

export function ProblemGenerator() {
  const [currentStep, setCurrentStep] = useState('intro');
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
  
  // New state for Blind75 functionality
  const [companyContextFormData, setCompanyContextFormData] = useState<CompanyContextFormData>({
    company: 'meta',
    customCompany: ''
  });
  const [selectedProblemSlug, setSelectedProblemSlug] = useState<string | null>(null);
  const [isCompanyContextFlow, setIsCompanyContextFlow] = useState(false);

  const handleStartClick = () => {
    setIsCompanyContextFlow(false);
    setCurrentStep('form');
  };
  const handleHomeClick = () => setCurrentStep('intro');
  const handleBlind75Click = () => setCurrentStep('blind75');

  // Updated handler for "Practice with company context" button to accept problem slug
  const handlePracticeWithContext = (problemSlug: string) => {
    setSelectedProblemSlug(problemSlug);
    setIsCompanyContextFlow(true);
    setCurrentStep('company-context-form');
  };

  // New handler for company context form submission
  const handleCompanyContextSubmit = async (data: CompanyContextFormData) => {
    try {
      setCompanyContextFormData(data);
      setCurrentStep('loading');
      setError(null);
      setProblem(null);
      setCodeDetails(null);
      setEvaluationResults(null);
      setSolutionFromSolver(null);
      setApiResponseReceived(false);
      setIsResuming(false);
      setResumeProblemId(null);
      
      const { company, customCompany } = data;
      const isBlind75 = true; // Always true for context practice
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
          const companyResponse = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.COMPANIES_INITIALIZE), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ companyName: customCompany }),
          });
          if (!companyResponse.ok) throw new Error(`Failed to initialize company: ${await companyResponse.text()}`);
          const companyData = await companyResponse.json();
          if (!companyData.success) throw new Error(companyData.message || 'Failed to initialize company');
          companyId = companyData.company.id;
          companyName = companyData.company.name || companyData.company.displayName || customCompany;
          shouldCacheCompany = true; // New company, should cache
        }
      } else {
        // For standard companies, use the proper display name
        companyName = getCompanyDisplayName(company);
        shouldCacheCompany = false; // Predefined companies don't get cached
      }
      
      // Use selected problem slug or get a random difficulty
      let apiPayload: any = { companyId, isBlind75 };
      if (selectedProblemSlug) {
        apiPayload.problemId = selectedProblemSlug;
      } else {
        const difficulties = ['Easy', 'Medium', 'Hard'];
        apiPayload.difficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
      }
      
      const prepareResponse = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.PROBLEM_PREPARE), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiPayload),
      });
      
      if (!prepareResponse.ok) {
        const errorText = await prepareResponse.text();
        console.error('API Error Response:', errorText);
        throw new Error(`Failed to prepare problem: ${errorText}`);
      }
      
      const responseData = await prepareResponse.json();

      const apiTestCases = responseData.problem?.testCases || [];
      const formattedTestCases: TestCase[] = apiTestCases.map((tc: any) => ({
        id: tc.id || undefined,
        stdin: tc.input || tc.stdin,
        expectedStdout: tc.output || tc.expected_output || tc.expectedOutput || tc.expectedStdout,
        isSample: tc.isSample === true || tc.is_sample === true,
        explanation: tc.explanation || undefined,
      }));

      // Get base problemId from API response or generate fallback
      const baseProblemId = responseData.problem?.id || responseData.problem?.problemId || `${selectedProblemSlug || 'random'}_${Date.now()}`;
      
      // Generate unique problemId that matches what cache will store
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
      
      // Cache the problem as "in_progress" when first viewed
      // Use base problemId (without company context) - let cache function add company identifier
      addProblemToCache(
        baseProblemId,
        'in_progress',
        formattedCodeDetails.defaultUserCode || '',
        companyId,
        companyName,
        selectedProblemSlug ? 'Mixed' : 'Random', // Use 'Mixed' for specific problems, 'Random' for random selection
        formattedProblem.title
      );
      
      setApiResponseReceived(true);
      setProblem(formattedProblem);
      setCodeDetails(formattedCodeDetails);
      setCurrentStep('problem');

    } catch (err) {
      console.error('Error preparing contextualized problem:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setCurrentStep('company-context-form');
    }
  };

  // New handler for canceling company context form
  const handleCompanyContextCancel = () => {
    setSelectedProblemSlug(null);
    setIsCompanyContextFlow(false);
    setCurrentStep('blind75');
  };

  const handleResumeProblem = async (problemId: string) => {
    try {
      setIsResuming(true);
      setResumeProblemId(problemId);
      setResumeDataLoaded(false);
      setCurrentStep('resume-loading');
      
      // Get cached problem data
      const cachedProblem = getCachedProblem(problemId);
      if (!cachedProblem) {
        throw new Error('Cached problem not found');
      }

      // Extract the base problemId from the unique identifier for API calls
      // The cached problemId format is: ${baseProblemId}_${companyId}
      const baseProblemId = problemId.includes('_') 
        ? problemId.substring(0, problemId.lastIndexOf('_'))
        : problemId;

      // Prepare API request with base problemId instead of the full unique identifier
      const prepareResponse = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.PROBLEM_PREPARE), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          problemId: baseProblemId, // Use base problemId for API call
          companyId: cachedProblem.companyId,
          isBlind75: true 
        }),
      });

      if (!prepareResponse.ok) {
        throw new Error(`Failed to prepare problem: ${await prepareResponse.text()}`);
      }

      const responseData = await prepareResponse.json();

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
        problemId: problemId // Keep the full unique problemId for cache operations
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
      
      // Signal that data is loaded
      setResumeDataLoaded(true);
      
    } catch (err) {
      console.error('Error resuming problem:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred while resuming');
      setCurrentStep('blind75'); // Go back to blind75 instead of 'progress'
      setIsResuming(false);
      setResumeProblemId(null);
      setResumeDataLoaded(false);
    }
  };

  const handleFormSubmit = async (data: FormData) => {
    try {
      setFormData(data);
      setIsCompanyContextFlow(false);
      setCurrentStep('loading');
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
          const companyResponse = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.COMPANIES_INITIALIZE), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ companyName: customCompany }),
          });
          if (!companyResponse.ok) throw new Error(`Failed to initialize company: ${await companyResponse.text()}`);
          const companyData = await companyResponse.json();
          if (!companyData.success) throw new Error(companyData.message || 'Failed to initialize company');
          companyId = companyData.company.id;
          companyName = companyData.company.name || companyData.company.displayName || customCompany;
          shouldCacheCompany = true; // New company, should cache
        }
      } else {
        // For standard companies, use the proper display name
        companyName = getCompanyDisplayName(company);
        shouldCacheCompany = false; // Predefined companies don't get cached
      }
      
      // Prepare API payload for specific problem or difficulty-based selection
      let apiPayload: any = { companyId, isBlind75 };
      if (specificProblemSlug) {
        apiPayload.problemId = specificProblemSlug;
      } else {
        apiPayload.difficulty = difficulty;
      }
      
      const prepareResponse = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.PROBLEM_PREPARE), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiPayload),
      });
      if (!prepareResponse.ok) throw new Error(`Failed to prepare problem: ${await prepareResponse.text()}`);
      const responseData = await prepareResponse.json();

      const apiTestCases = responseData.problem?.testCases || [];
      const formattedTestCases: TestCase[] = apiTestCases.map((tc: any) => ({
        id: tc.id || undefined,
        stdin: tc.input || tc.stdin,
        expectedStdout: tc.output || tc.expected_output || tc.expectedOutput || tc.expectedStdout,
        isSample: tc.isSample === true || tc.is_sample === true,
        explanation: tc.explanation || undefined,
      }));

      // Get base problemId from API response or generate fallback
      const baseProblemId = responseData.problem?.id || responseData.problem?.problemId || specificProblemSlug || `${difficulty}_${Date.now()}`;
      
      // Generate unique problemId that matches what cache will store
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
      
      // Cache the problem as "in_progress" when first viewed
      // Use base problemId (without company context) - let cache function add company identifier
      addProblemToCache(
        baseProblemId,
        'in_progress',
        formattedCodeDetails.defaultUserCode || '',
        companyId,
        companyName,
        specificProblemSlug ? 'Mixed' : difficulty, // Use 'Mixed' for topic-based selections, actual difficulty for manual selection
        formattedProblem.title
      );
      
      setApiResponseReceived(true);
      setProblem(formattedProblem);
      setCodeDetails(formattedCodeDetails);
      setCurrentStep('problem');

    } catch (err) {
      console.error('Error preparing problem:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setCurrentStep('form');
    }
  };

  const handleCodeChange = (code: string) => {
    // Update cache with current solution for in-progress problems
    if (problem?.problemId) {
      updateProblemSolution(problem.problemId, code);
    }
  };

  const handleFinalSolutionSubmit = (code: string) => {
    setSolutionFromSolver(code);
    
    // Mark problem as solved in cache
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
    setCurrentStep('results');
  };

  const handleTryAgain = () => {
    setCurrentStep('form');
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
    setCurrentStep('problem');
  };

  const handleSolveAnother = () => {
    // Current progress is already saved via handleCodeChange
    // Get current problem's cached information to preserve context
    let currentCompanyInfo = { company: 'meta', customCompany: '' };
    let currentDifficulty = 'Medium';
    let currentTopic = 'random';
    
    // First, determine the topic based on the flow and selected problem
    if (isCompanyContextFlow && selectedProblemSlug) {
      // User came from Blind75 list - preserve the topic of the selected problem
      currentTopic = findTopicForProblem(selectedProblemSlug);
    } else if (isCompanyContextFlow) {
      // Company context flow but no specific problem - keep random
      currentTopic = 'random';
    } else {
      // Regular form flow - preserve the current topic selection
      currentTopic = formData.topic || 'random';
    }
    
    // Also preserve the current difficulty from form state as fallback
    const fallbackDifficulty = isCompanyContextFlow ? 'Medium' : (formData.difficulty || 'Medium');
    
    // Try to get current problem info from cache
    if (problem?.problemId) {
      const cachedProblem = getCachedProblem(problem.problemId);
      if (cachedProblem) {
        // Use cached company information
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
        
        // Use cached difficulty, but if it's 'Mixed' or 'Random', use fallback
        currentDifficulty = ['Mixed', 'Random'].includes(cachedProblem.difficulty) 
          ? fallbackDifficulty 
          : cachedProblem.difficulty;
        
        // Topic is determined above based on the flow, not from cache
      } else {
        // Use current form state for company/difficulty
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
      // Use current form state for company/difficulty
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
    
    // Update form data with preserved information
    setFormData(newFormData);
    
    // Reset state and go back to form
    setCurrentStep('form');
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
    setCurrentStep('problem');
    setIsResuming(false);
    setResumeProblemId(null);
    setResumeDataLoaded(false);
  };

  return (
    <DarkModeProvider>
      <div className="min-h-screen font-sans text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        {currentStep !== 'intro' && (
        <Navbar 
          onHomeClick={handleHomeClick} 
          onBlind75Click={handleBlind75Click}
        />
        )}
        {currentStep === 'intro' && <IntroSection onStartClick={handleStartClick} />}
        {currentStep === 'blind75' && (
          <Blind75 
            onPracticeWithContext={handlePracticeWithContext}
            onResumeProblem={handleResumeProblem}
          />
        )}
        {currentStep === 'company-context-form' && (
          <CompanyContextForm 
            onSubmit={handleCompanyContextSubmit}
            onCancel={handleCompanyContextCancel}
            problemSlug={selectedProblemSlug || undefined}
          />
        )}
        {currentStep === 'form' && (
          <>
            <ProblemForm initialData={formData} onSubmit={handleFormSubmit} />
            {error && <div className="max-w-md mx-auto mt-4 p-3 bg-red-100 text-red-700 rounded-md"><p className="text-sm font-medium">Error: {error}</p></div>}
          </>
        )}
        {currentStep === 'loading' && <LoadingSequence 
            company={
              isCompanyContextFlow
                ? (companyContextFormData.company === 'custom' ? companyContextFormData.customCompany : getCompanyDisplayName(companyContextFormData.company))
                : (formData.company === 'custom' ? formData.customCompany : getCompanyDisplayName(formData.company))
            }
            maxTotalDuration={MAX_LOADING_DURATION_SECONDS}
            forceComplete={apiResponseReceived}
        />}
        {currentStep === 'resume-loading' && (
          <ResumeLoadingSequence 
            onComplete={handleResumeLoadingComplete} 
            isDataLoaded={resumeDataLoaded}
          />
        )}
        {currentStep === 'problem' && problem && codeDetails && (
          <ProblemSolver 
            problem={problem} 
            solution={solutionFromSolver} 
            codeDetails={codeDetails}
            onSubmit={handleFinalSolutionSubmit}
            onCodeChange={handleCodeChange}
            testResults={evaluationResults}
            onSolveAnother={handleSolveAnother}
          />
        )}
        {currentStep === 'problem' && (!problem || !codeDetails) && (
            <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]"><div className="text-center"><div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mb-4"></div><h2 className="text-xl font-medium">Loading problem data...</h2><p className="text-sm text-gray-500 mt-2">If this persists, please try again.</p></div></div>
        )}
        {currentStep === 'results' && evaluationResults && problem && (
          <ResultsView 
            results={evaluationResults} 
            problem={problem} 
            onTryAgain={handleTryAgain} 
            onGoBackToProblem={handleGoBackToProblem}
            totalTestCases={problem.testCases.length}
            executedTestCases={Math.min(20, problem.testCases.length)}
          />
        )}
      </div>
    </DarkModeProvider>
  );
}