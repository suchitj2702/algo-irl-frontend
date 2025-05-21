import { useState } from 'react';
import { IntroSection } from './IntroSection';
import { ProblemForm, FormData } from './ProblemForm';
import { LoadingSequence } from './LoadingSequence';
import { ProblemSolver } from './ProblemSolver';
import { ResultsView } from './ResultsView';
import { DarkModeProvider } from './DarkModeContext';
import { Navbar } from './Navbar';

interface Problem {
  title: string;
  background: string;
  problemStatement: string;
  examples: Array<{input: string; output: string, expected?: string}>;
  constraints: string[];
  requirements: string[];
  leetcodeUrl: string;
}

interface TestResults {
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
  code?: string;
  defaultUserCode?: string;
  functionName?: string;
  solutionStructureHint?: string;
  boilerplateCode?: string;
  language: string;
}

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
  const [solution, setSolution] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<TestResults | null>(null);
  const [showSaveProgress, setShowSaveProgress] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartClick = () => {
    setCurrentStep('form');
  };

  const handleFormSubmit = async (data: FormData) => {
    try {
      console.log("Form submitted with data:", data);
      setFormData(data);
      setCurrentStep('loading');
      setError(null);
      
      const { company, customCompany, difficulty } = data;
      const isBlind75 = data.dataset === 'blind75';
      console.log(`Using dataset: ${data.dataset}, isBlind75 flag: ${isBlind75}`);
      let companyId = '';
      
      console.log("Processing company:", company, customCompany);
      
      // If it's a custom company, initialize it first
      if (company === 'custom' && customCompany) {
        console.log("Initializing custom company");
        try {
          // Try to initialize custom company with the API
          const companyResponse = await fetch('/api/companies/initialize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ companyName: customCompany }),
          });

          console.log("Company response status:", companyResponse.status);
          
          if (!companyResponse.ok) {
            const errorText = await companyResponse.text();
            console.error("Company initialization failed:", errorText);
            throw new Error(`Failed to initialize company: ${errorText}`);
          }

          const companyData = await companyResponse.json();
          console.log("Company data:", companyData);
          
          if (!companyData.success) {
            throw new Error(companyData.message || 'Failed to initialize company');
          }
          
          companyId = companyData.company.id;
        } catch (companyError) {
          console.error("Error in company initialization:", companyError);
          throw companyError;
        }
      } else {
        // Use the selected company ID directly
        companyId = company;
      }
      
      console.log("Using company ID:", companyId);
      
      // Use our prepare API to handle problem selection, transformation, and code preparation
      try {
        console.log("Preparing problem with params:", { difficulty, companyId, isBlind75 });
        const prepareResponse = await fetch('/api/problem/prepare', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            difficulty,
            companyId,
            isBlind75
          }),
        });
        
        console.log("Prepare response status:", prepareResponse.status);
        
        if (!prepareResponse.ok) {
          const errorText = await prepareResponse.text();
          console.error("Problem preparation failed:", errorText);
          throw new Error(`Failed to prepare problem: ${errorText}`);
        }
        
        const responseData = await prepareResponse.json();
        console.log("Problem preparation successful:", responseData);
        console.log("Problem test cases:", responseData.problem?.testCases);
        
        // Log each test case to see their structure
        if (responseData.problem?.testCases?.length > 0) {
          console.log("Test case example:", responseData.problem.testCases[0]);
        }
        
        let finalExamples = responseData.problem?.examples;
        // Check if there are examples in the new API response format
        if (finalExamples.length === 0) {
          // Extract test cases from the response and format them as examples
          // Try different possible fields for identifying sample test cases
          const examples = responseData.problem?.testCases
            ?.filter((testCase: any) => 
              testCase.isSample === true)
            ?.map((testCase: any) => ({
              input: testCase.input || "",
              output: testCase.output || ""
            })) || [];
          
          console.log("Filtered examples:", examples);
          finalExamples = examples;
        }
        
        // Create a properly formatted problem object that matches ProblemSolver expectations
        // This addresses the format mismatch between API and component
        const formattedProblem: Problem = {
          title: responseData.problem?.title || "Algorithm Challenge",
          background: responseData.problem?.background || "",
          problemStatement: responseData.problem?.problemStatement || "",
          examples: finalExamples,
          constraints: responseData.problem?.constraints || [],
          requirements: responseData.problem?.requirements || [],
          leetcodeUrl: responseData.problem?.leetcodeUrl || ""
        };
        
        console.log("Formatted problem:", formattedProblem);
        
        // Format code details and ensure defaultUserCode is available
        const formattedCodeDetails: CodeDetails = {
          code: responseData.codeDetails?.boilerplateCode || "",
          defaultUserCode: responseData.codeDetails?.defaultUserCode || "",
          functionName: responseData.codeDetails?.functionName || "",
          solutionStructureHint: responseData.codeDetails?.solutionStructureHint || "",
          boilerplateCode: responseData.codeDetails?.boilerplateCode || "",
          language: responseData.codeDetails?.language || "python"
        };
        
        console.log("Formatted code details:", formattedCodeDetails);
        
        // Validate the problem data before proceeding
        if (!formattedProblem.problemStatement || !formattedProblem.examples || !formattedProblem.constraints) {
          console.error("Formatted problem is missing required fields");
          throw new Error("Invalid problem data format from API");
        }
        
        // Set all the state from the response before moving to the next screen
        setProblem(formattedProblem);
        setCodeDetails(formattedCodeDetails);
        
        // Wait for state to update before proceeding
        await new Promise(resolve => setTimeout(resolve, 500));
        setCurrentStep('problem');
      } catch (prepareError) {
        console.error("Error in problem preparation:", prepareError);
        throw prepareError;
      }
    } catch (err) {
      console.error('Error preparing problem:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setCurrentStep('form');
    }
  };

  const handleSolutionSubmit = (code: string) => {
    setSolution(code);
    setCurrentStep('evaluating');
    
    // Simulate code evaluation - this would be replaced with an actual API call
    setTimeout(() => {
      const passed = Math.random() > 0.3; // 70% chance of passing
      setTestResults({
        passed,
        executionTime: Math.floor(Math.random() * 100) + 'ms',
        memoryUsed: Math.floor(Math.random() * 10) + 'MB',
        testCases: [{
          input: problem?.examples[0].input || '',
          output: problem?.examples[0].output || '',
          passed: true
        }, {
          input: 'Custom test case',
          output: 'Expected output',
          passed
        }]
      });
      
      if (passed) {
        setShowSaveProgress(true);
        setCurrentStep('results');
      } else {
        setCurrentStep('problem');
      }
    }, 3000);
  };

  const handleTryAgain = () => {
    setCurrentStep('form');
    setSolution(null);
    setTestResults(null);
    setProblem(null);
    setCodeDetails(null);
  };

  return (
    <DarkModeProvider>
      <div className="min-h-screen font-sans text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <Navbar />
        {currentStep === 'intro' && <IntroSection onStartClick={handleStartClick} />}
        
        {currentStep === 'form' && (
          <>
            <ProblemForm initialData={formData} onSubmit={handleFormSubmit} />
            {error && (
              <div className="max-w-md mx-auto mt-4 p-3 bg-red-100 text-red-700 rounded-md">
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}
          </>
        )}
        
        {currentStep === 'loading' && <LoadingSequence company={formData.company === 'custom' ? formData.customCompany : formData.company} />}
        
        {currentStep === 'problem' && (
          <>
            {problem ? (
              <ProblemSolver 
                problem={problem} 
                solution={codeDetails?.defaultUserCode || solution} 
                onSubmit={handleSolutionSubmit} 
                testResults={testResults} 
              />
            ) : (
              <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mb-4"></div>
                  <h2 className="text-xl font-medium">
                    Loading problem data...
                  </h2>
                </div>
              </div>
            )}
          </>
        )}
        
        {currentStep === 'evaluating' && (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mb-4"></div>
              <h2 className="text-xl font-medium">
                Evaluating your solution...
              </h2>
            </div>
          </div>
        )}
        
        {currentStep === 'results' && (
          <ResultsView 
            results={testResults} 
            problem={problem} 
            onTryAgain={handleTryAgain} 
            showSaveProgress={showSaveProgress} 
            onCloseSaveProgress={() => setShowSaveProgress(false)} 
          />
        )}
      </div>
    </DarkModeProvider>
  );
}