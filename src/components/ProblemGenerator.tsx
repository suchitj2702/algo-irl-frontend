import { useState, useEffect } from 'react';
import { IntroSection } from './IntroSection';
import { ProblemForm, FormData } from './ProblemForm';
import { LoadingSequence } from './LoadingSequence';
import { ProblemSolver } from './ProblemSolver';
import { ResultsView } from './ResultsView';
import { DarkModeProvider } from './DarkModeContext';
import { Navbar } from './Navbar';
import { TestCase } from '../utils/codeExecution';
import { API_CONFIG, buildApiUrl } from '../config/api';

interface Problem {
  title: string;
  background: string;
  problemStatement: string;
  testCases: TestCase[];
  constraints: string[];
  requirements: string[];
  leetcodeUrl: string;
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

export const MAX_LOADING_DURATION_SECONDS = 40;

export function ProblemGenerator() {
  const [currentStep, setCurrentStep] = useState('intro');
  const [formData, setFormData] = useState<FormData>({
    dataset: 'blind75',
    company: 'openai',
    customCompany: '',
    difficulty: 'Medium'
  });
  const [problem, setProblem] = useState<Problem | null>(null);
  const [codeDetails, setCodeDetails] = useState<CodeDetails | null>(null);
  const [solutionFromSolver, setSolutionFromSolver] = useState<string | null>(null);
  const [evaluationResults, setEvaluationResults] = useState<TestResultsFromParent | null>(null);
  const [showSaveProgress, setShowSaveProgress] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiResponseReceived, setApiResponseReceived] = useState(false);

  const handleStartClick = () => setCurrentStep('form');

  const handleFormSubmit = async (data: FormData) => {
    try {
      setFormData(data);
      setCurrentStep('loading');
      setError(null);
      setProblem(null);
      setCodeDetails(null);
      setEvaluationResults(null); // Clear previous evaluation results
      setSolutionFromSolver(null); // Clear previous solution
      setApiResponseReceived(false); // Reset API response flag
      
      const { company, customCompany, difficulty } = data;
      const isBlind75 = data.dataset === 'blind75';
      let companyId = company;
      
      if (company === 'custom' && customCompany) {
        const companyResponse = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.COMPANIES_INITIALIZE), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ companyName: customCompany }),
        });
        if (!companyResponse.ok) throw new Error(`Failed to initialize company: ${await companyResponse.text()}`);
        const companyData = await companyResponse.json();
        if (!companyData.success) throw new Error(companyData.message || 'Failed to initialize company');
        companyId = companyData.company.id;
      }
      
      const prepareResponse = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.PROBLEM_PREPARE), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ difficulty, companyId, isBlind75 }),
      });
      if (!prepareResponse.ok) throw new Error(`Failed to prepare problem: ${await prepareResponse.text()}`);
      const responseData = await prepareResponse.json();

      const apiTestCases = responseData.problem?.testCases || [];
      const formattedTestCases: TestCase[] = apiTestCases.map((tc: any) => ({
        id: tc.id || undefined,
        stdin: tc.input || tc.stdin, // Accommodate both 'input' and 'stdin' from API
        expectedStdout: tc.output || tc.expected_output || tc.expectedOutput || tc.expectedStdout, // Accommodate variations
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
        leetcodeUrl: responseData.problem?.leetcodeUrl || ""
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
      
      // Mark that API response has been received
      setApiResponseReceived(true);
      
      // Immediately proceed to problem step once data is ready
      setProblem(formattedProblem);
      setCodeDetails(formattedCodeDetails);
      setCurrentStep('problem');

    } catch (err) {
      console.error('Error preparing problem:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setCurrentStep('form');
    }
  };

  const handleFinalSolutionSubmit = (code: string) => {
    setSolutionFromSolver(code);
    // Since ProblemSolver confirms all tests passed, its internal results reflect this.
    // We construct TestResultsFromParent for ResultsView.
    const mockFinalResults: TestResultsFromParent = {
        passed: true, 
        executionTime: problem?.testCases && problem.testCases.length > 0 ? Math.floor(Math.random() * 100) + 'ms' : 'N/A', // Example metric
        memoryUsed: problem?.testCases && problem.testCases.length > 0 ? Math.floor(Math.random() * 10) + 'MB' : 'N/A',    // Example metric
        // Populate with all test cases from the problem, marked as passed
        testCases: problem?.testCases.map(tc => ({
            input: typeof tc.stdin === 'object' ? JSON.stringify(tc.stdin) : String(tc.stdin),
            output: typeof tc.expectedStdout === 'object' ? JSON.stringify(tc.expectedStdout) : String(tc.expectedStdout),
            passed: true // Mark all as passed since this is the success path
        })) || [],
    };
    setEvaluationResults(mockFinalResults);
    setShowSaveProgress(true); 
    setCurrentStep('results');
  };

  const handleTryAgain = () => {
    setCurrentStep('form');
    setSolutionFromSolver(null);
    setEvaluationResults(null);
    setProblem(null);
    setCodeDetails(null);
    setError(null);
    setApiResponseReceived(false);
  };

  const handleGoBackToProblem = () => {
    setCurrentStep('problem');
    // evaluationResults is kept so if user navigates back from browser history, they see results
    // but if they click this button, we assume they want to re-solve, so ProblemSolver won't show old results.
    // ProblemSolver clears its own executionResults state when the problem prop changes or on reset.
  };

  return (
    <DarkModeProvider>
      <div className="min-h-screen font-sans text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <Navbar />
        {currentStep === 'intro' && <IntroSection onStartClick={handleStartClick} />}
        {currentStep === 'form' && (
          <>
            <ProblemForm initialData={formData} onSubmit={handleFormSubmit} />
            {error && <div className="max-w-md mx-auto mt-4 p-3 bg-red-100 text-red-700 rounded-md"><p className="text-sm font-medium">Error: {error}</p></div>}
          </>
        )}
        {currentStep === 'loading' && <LoadingSequence 
            company={formData.company === 'custom' ? formData.customCompany : formData.company} 
            maxTotalDuration={MAX_LOADING_DURATION_SECONDS}
            forceComplete={apiResponseReceived}
        />}
        {currentStep === 'problem' && problem && codeDetails && (
          <ProblemSolver 
            problem={problem} 
            solution={solutionFromSolver} 
            codeDetails={codeDetails}
            onSubmit={handleFinalSolutionSubmit}
            testResults={evaluationResults} // This prop is for ProblemSolver to potentially use if needed.
          />
        )}
        {currentStep === 'problem' && (!problem || !codeDetails) && (
            <div className="flex items-center justify-center min-h-screen"><div className="text-center"><div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mb-4"></div><h2 className="text-xl font-medium">Loading problem data...</h2><p className="text-sm text-gray-500 mt-2">If this persists, please try again.</p></div></div>
        )}
        {/* Evaluating step is removed as ProblemSolver handles evaluation before calling handleFinalSolutionSubmit */}
        {currentStep === 'results' && evaluationResults && problem && (
          <ResultsView 
            results={evaluationResults} 
            problem={problem} 
            onTryAgain={handleTryAgain} 
            onGoBackToProblem={handleGoBackToProblem} // Pass the new handler
          />
        )}
      </div>
    </DarkModeProvider>
  );
}