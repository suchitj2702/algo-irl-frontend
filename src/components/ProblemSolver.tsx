import React, { useEffect, useState, useRef } from 'react';
import { PlayIcon, SendIcon, RotateCcwIcon, InfoIcon } from 'lucide-react';
import CodeEditor from './CodeEditor';
import { executeCodeAndPoll, ExecutionResults, ExecutionTestResult, TestCase } from '../utils/codeExecution';

interface Problem {
  title: string;
  background: string;
  problemStatement: string;
  testCases: TestCase[];
  constraints: string[];
  requirements: string[];
  leetcodeUrl: string;
}

interface CodeDetails {
  boilerplateCode: string;
  language: string;
  defaultUserCode?: string;
}

interface ProblemSolverProps {
  problem: Problem;
  solution: string | null;
  codeDetails: CodeDetails;
  onSubmit: (code: string) => void;
  testResults: {
    passed: boolean;
    executionTime: string;
    memoryUsed: string;
    testCases: Array<{
      input: string;
      output: string;
      passed: boolean;
    }>;
  } | null;
}

// Helper function to render text with backtick and bold markdown support
const renderTextWithBackticks = (text: string, keyPrefix: string) => {
  if (!text) return null;
  
  // First split by backticks to handle code formatting
  const backtickParts = text.split('`');
  
  return backtickParts.map((part, backtickIndex) => {
    if (backtickIndex % 2 === 1) {
      // Content inside backticks - render as code
      return <code key={`${keyPrefix}-bt-${backtickIndex}`} className="font-mono bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-sm">{part}</code>;
    } else {
      // Normal text - check for bold formatting
      const boldParts = part.split('**');
      return boldParts.map((boldPart, boldIndex) => {
        if (boldIndex % 2 === 1) {
          // Content inside ** - render as bold
          return <strong key={`${keyPrefix}-bt-${backtickIndex}-bold-${boldIndex}`} className="font-semibold">{boldPart}</strong>;
        } else {
          // Regular text
          return <span key={`${keyPrefix}-bt-${backtickIndex}-txt-${boldIndex}`}>{boldPart}</span>;
        }
      });
    }
  });
};

export function ProblemSolver({
  problem,
  solution,
  codeDetails,
  onSubmit,
}: ProblemSolverProps) {
  const processedProblem = useRef<Problem>(problem);
  
  if (!problem || !problem.title || !problem.testCases) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="bg-red-100 text-red-700 p-4 rounded-md mb-4">
              <p className="font-medium">Error: Invalid problem data</p>
              <p className="text-sm mt-2">The problem data is incomplete. Please ensure test cases are provided.</p>
            </div>
            <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
              Reload Page
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  const getInitialCode = () => {
    return solution || codeDetails.defaultUserCode || `function solution(input) {
  // Your solution here
  return null;
}`;
  };
  
  const getBoilerplateCode = () => {
    return codeDetails.defaultUserCode || `function solution(input) {
  // Your solution here
  return null;
}`;
  };
  
  const [code, setCode] = useState(getInitialCode());
  const initialCode = useRef(getInitialCode());
  const boilerplateCode = useRef(getBoilerplateCode());
  const [typingComplete, setTypingComplete] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [typedText, setTypedText] = useState("");
  const [isLoadingRun, setIsLoadingRun] = useState(false);
  const [isLoadingSubmit, setIsLoadingSubmit] = useState(false);
  const [executionResults, setExecutionResults] = useState<ExecutionResults | null>(null);
  const [lastActionType, setLastActionType] = useState<'run' | 'submit' | null>(null);
  
  useEffect(() => {
    processedProblem.current = problem;
    const newInitialCode = getInitialCode();
    const newBoilerplateCode = getBoilerplateCode();
    setCode(newInitialCode);
    initialCode.current = newInitialCode;
    boilerplateCode.current = newBoilerplateCode;
    setTypedText("");
    setTypingComplete(false);
    setShowEditor(false);
    setExecutionResults(null);
    setLastActionType(null);
    setIsLoadingRun(false);
    setIsLoadingSubmit(false);
  }, [problem, solution, codeDetails]);

  useEffect(() => {
    if (!problem || !problem.title) return;
    let fullTextContent = "";
    fullTextContent += problem.title + "\n\n";
    if (problem.background) fullTextContent += problem.background + "\n\n";
    if (problem.problemStatement) fullTextContent += problem.problemStatement + "\n\n";
    const sampleTestCases = problem.testCases?.filter(tc => tc.isSample) || [];
    if (sampleTestCases.length > 0) {
      fullTextContent += "Examples: \n";
      sampleTestCases.forEach((example, index) => {
        fullTextContent += `Example ${index + 1}:\n`;
        fullTextContent += `Input: ${typeof example.stdin === 'object' ? JSON.stringify(example.stdin) : example.stdin}\n`;
        fullTextContent += `Expected Output: ${typeof example.expectedStdout === 'object' ? JSON.stringify(example.expectedStdout) : example.expectedStdout}\n`;
        if (example.explanation) fullTextContent += `Explanation: ${typeof example.explanation === 'object' ? JSON.stringify(example.explanation) : example.explanation}\n`;
        fullTextContent += "\n";
      });
    }
    if (problem.constraints && problem.constraints.length > 0) { fullTextContent += "Constraints: \n"; problem.constraints.forEach(c => fullTextContent += `• ${c}\n`); fullTextContent += "\n"; }
    if (problem.requirements && problem.requirements.length > 0) { fullTextContent += "Requirements: \n"; problem.requirements.forEach(r => fullTextContent += `• ${r}\n`); fullTextContent += "\n"; }
    if (problem.leetcodeUrl) fullTextContent += "Original LeetCode problem for this problem statement";
    
    // Display text immediately without typing animation
    setTypedText(fullTextContent);
    setTypingComplete(true);
    setShowEditor(true);
  }, [problem]);
  
  const handleReset = () => { 
    setCode(boilerplateCode.current); 
    setExecutionResults(null); 
    setLastActionType(null); 
    setIsLoadingRun(false); 
    setIsLoadingSubmit(false); 
  };
  const commonExecutionHandler = (results: ExecutionResults) => setExecutionResults(results);
  
  const commonErrorHandler = (errorMsg: string, submissionId?: string, intendedTestCasesCount?: number) => {
    setExecutionResults({
      passed: false,
      testCasesPassed: 0,
      testCasesTotal: typeof intendedTestCasesCount === 'number' ? intendedTestCasesCount : (problem.testCases?.length || 0),
      executionTime: null,
      memoryUsage: null,
      error: errorMsg,
      testCaseResults: [],
      submissionId
    });
  };
  
  const handleRun = () => {
    if (!problem || !problem.testCases || !codeDetails) {
      commonErrorHandler("Missing critical data to run tests.", undefined, 0);
      setIsLoadingRun(false);
      return;
    }
    setLastActionType('run');
    const samplesToRun = problem.testCases.filter(tc => tc.isSample);
    if (samplesToRun.length === 0) { 
      setExecutionResults({ 
        passed: true, testCasesPassed: 0, testCasesTotal: 0, 
        executionTime: null, memoryUsage: null, 
        error: "No sample test cases available to run.", testCaseResults: [] 
      }); 
      setIsLoadingRun(false); 
      return; 
    }
    setExecutionResults(null); 
    executeCodeAndPoll({ 
      code, 
      language: codeDetails.language, 
      boilerplateCode: codeDetails.boilerplateCode, 
      testCases: samplesToRun,
      onResults: commonExecutionHandler, 
      onError: (errorMsg, submissionId) => commonErrorHandler(errorMsg, submissionId, samplesToRun.length),
      onLoadingChange: setIsLoadingRun 
    });
  };

  const handleSubmit = () => {
    if (!problem || !problem.testCases || !codeDetails) { 
      commonErrorHandler("Missing critical data to submit.", undefined, problem.testCases?.length || 0);
      setIsLoadingSubmit(false);
      return; 
    }
    setLastActionType('submit');
    setExecutionResults(null); 
    executeCodeAndPoll({ 
      code, 
      language: codeDetails.language, 
      boilerplateCode: codeDetails.boilerplateCode, 
      testCases: problem.testCases,
      onResults: r => { commonExecutionHandler(r); if (r.passed) onSubmit(code); }, 
      onError: (errorMsg, submissionId) => commonErrorHandler(errorMsg, submissionId, problem.testCases.length),
      onLoadingChange: setIsLoadingSubmit 
    });
  };
  
  const formatTypedText = () => {
    if (!typedText) return null;
    let sections: { type: string; content: string[]; }[] = [];
    let currentSection: { type: string; content: string[]; } = { type: 'title', content: [] };

    typedText.split('\n').forEach((line, i) => {
      if (i === 0) currentSection.content.push(line); // Title
      else if (line.startsWith('Examples:')) {
        sections.push({ ...currentSection });
        currentSection = { type: 'examples-header', content: [line] };
      } else if (line.startsWith('Example ')) {
        if (currentSection.type !== 'example') sections.push({ ...currentSection }); // Push previous if not already an example part
        currentSection = { type: 'example', content: (currentSection.type === 'example' ? currentSection.content : []) }; // Start new or continue example
        currentSection.content.push(line);
      } else if (line.startsWith('Input:') || line.startsWith('Expected Output:') || line.startsWith('Explanation:')) {
        if (currentSection.type !== 'example') { // Should be part of an example
          sections.push({ ...currentSection });
          currentSection = { type: 'example', content: [] };
        }
        currentSection.content.push(line);
      } else if (line.startsWith('Constraints:')) {
        sections.push({ ...currentSection });
        currentSection = { type: 'constraints-header', content: [line] };
      } else if (line.startsWith('• ') && (currentSection.type === 'constraints-header' || currentSection.type === 'constraints-item')) {
        if (currentSection.type === 'constraints-header') {
          sections.push({ ...currentSection });
          currentSection = { type: 'constraints-item', content: [] };
        }
        currentSection.content.push(line);
      } else if (line.startsWith('Requirements:')) {
        sections.push({ ...currentSection });
        currentSection = { type: 'requirements-header', content: [line] };
      } else if (line.startsWith('• ') && (currentSection.type === 'requirements-header' || currentSection.type === 'requirements-item')) {
        if (currentSection.type === 'requirements-header') {
          sections.push({ ...currentSection });
          currentSection = { type: 'requirements-item', content: [] };
        }
        currentSection.content.push(line);
      } else if (line === 'Original LeetCode problem for this problem statement') {
        sections.push({ ...currentSection });
        currentSection = { type: 'leetcode', content: [line] };
      } else if (line.trim() !== '') { // General paragraph content
        if (['title', 'examples-header', 'example', 'constraints-header', 'constraints-item', 'requirements-header', 'requirements-item', 'leetcode'].includes(currentSection.type)) {
          sections.push({ ...currentSection });
          currentSection = { type: 'paragraph', content: [] };
        }
        currentSection.content.push(line);
      }
    });
    if (currentSection.content.length > 0 && currentSection.content.some(c => c.trim() !== '')) sections.push(currentSection);

    return sections.map((s, idx) => {
      switch (s.type) {
        case 'title': return s.content.length > 0 ? <h2 key={`s-${idx}`} className="text-2xl font-bold mt-4 mb-2">{renderTextWithBackticks(s.content.join('\n'), `s-${idx}-title`)}</h2> : null;
        case 'examples-header': case 'constraints-header': case 'requirements-header': return s.content.length > 0 ? <h3 key={`s-${idx}`} className="text-xl font-medium mt-4 mb-2">{renderTextWithBackticks(s.content[0], `s-${idx}-header`)}</h3> : null;
        case 'example': 
          return <div key={`s-${idx}`} className="mt-2">{s.content.map((l,i) => 
            l.startsWith('Example ') ? <h4 key={`l-${i}`} className="text-lg font-medium mt-3 mb-1">{renderTextWithBackticks(l, `s-${idx}-l-${i}`)}</h4> : 
            (l.startsWith('Input:') || l.startsWith('Expected Output:') || l.startsWith('Explanation:') ? 
              <p key={`l-${i}`} className="font-mono text-sm ml-4">{renderTextWithBackticks(l, `s-${idx}-l-${i}`)}</p> : null)
          )}</div>;
        case 'constraints-item': case 'requirements-item': 
          return <ul key={`s-${idx}`} className="list-disc pl-5 mt-2">{s.content.map((item, i) => 
            <li key={`li-${i}`} className="ml-2 font-mono text-sm">{renderTextWithBackticks(item.startsWith('• ') ? item.substring(2) : item, `s-${idx}-li-${i}`)}</li>
          )}</ul>;
        case 'leetcode': return s.content.length > 0 && problem.leetcodeUrl ? <div key={`s-${idx}`} className="mt-8 text-sm text-neutral-500"><a href={problem.leetcodeUrl} target="_blank" rel="noopener noreferrer" className="hover:text-brand-primary transition-colors">{renderTextWithBackticks(s.content[0], `s-${idx}-leetcode`)}</a></div> : null;
        default: // paragraph
          return s.content.length > 0 && s.content.some(c=>c.trim()!=='') ? 
            <div key={`s-${idx}`} className="mt-2">{s.content.map((l, i) => 
              <p key={`p-${i}`} className="mb-2">{renderTextWithBackticks(l, `s-${idx}-p-${i}`)}</p>
            )}</div> : null;
      }
    });
  };

  const resultsToShow = executionResults?.testCaseResults.filter(tc => {
    if (lastActionType === 'run') return true;
    if (lastActionType === 'submit' && executionResults?.passed) return false;
    if (lastActionType === 'submit') return !tc.passed;
    return false;
  }) || [];

  const showResultsPanel = executionResults && (isLoadingRun || isLoadingSubmit || resultsToShow.length > 0 || !!executionResults.error || (lastActionType === 'submit' && executionResults.passed));

  return (
    <div className="h-[calc(100vh-64px)] max-h-[calc(100vh-64px)] flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <div className="flex flex-1 md:flex-row overflow-hidden">
        <div className="w-full md:w-1/2 h-full flex flex-col bg-white dark:bg-neutral-850"><div className="flex-1 overflow-y-auto"><div className="p-6">{problem && problem.title ? <div className="prose dark:prose-invert max-w-none">{formatTypedText()}</div> : <div className="flex items-center justify-center h-full"><p className="text-lg text-gray-500">Loading problem...</p></div>}</div></div></div>
        <div className={`w-full md:w-1/2 h-full flex flex-col bg-neutral-800 dark:bg-neutral-900 transition-all duration-500 transform ${showEditor ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'}`}>
          <div className="flex-shrink-0 p-3 bg-neutral-700 dark:bg-neutral-800 flex justify-between items-center border-b border-neutral-600"><div className="flex items-center"><h3 className="font-medium text-white">Solution Editor</h3><div className="ml-3 flex items-center text-xs text-neutral-400 border-l border-neutral-600 pl-3"><InfoIcon className="h-3 w-3 mr-1 flex-shrink-0" /><span>{codeDetails?.language || 'python'}</span><div className="ml-2 text-xs text-neutral-400">(support for more languages coming soon...)</div></div></div><button onClick={handleReset} disabled={isLoadingRun || isLoadingSubmit} className="flex items-center px-3 py-1 text-sm text-neutral-300 hover:text-white transition-colors disabled:opacity-50"><RotateCcwIcon className="w-4 h-4 mr-1" /> Reset</button></div>
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className={`${showResultsPanel ? 'h-3/4' : 'h-full'} bg-neutral-900 overflow-hidden transition-all duration-300`}>
              <CodeEditor code={code} language={codeDetails?.language || 'python'} onChange={setCode} height="100%" width="100%"/>
            </div>
            {showResultsPanel && executionResults && (
              <div className={'h-1/4 flex-shrink-0 border-t border-neutral-700 bg-neutral-800 overflow-y-auto p-3 transition-all duration-300 opacity-100'}>
                {(isLoadingRun || isLoadingSubmit) ? (
                   <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div><p className="ml-3 text-sm text-white">{isLoadingRun ? "Running sample tests..." : "Submitting and running all tests..."}</p></div>
                ) : (
                  <div>
                    <h4 className="text-sm font-medium text-white mb-1">
                      Results: <span className={`ml-1 ${executionResults.passed ? 'text-green-400' : 'text-red-400'}`}>{executionResults.testCasesPassed}/{executionResults.testCasesTotal} Passed</span>
                      {lastActionType === 'submit' && executionResults.passed && <span className="ml-2 text-green-400">- All tests passed!</span>}
                    </h4>
                    {executionResults.error && <p className="text-xs text-red-400 bg-red-900/30 p-1 rounded my-1">Error: {executionResults.error}</p>}
                    {(executionResults.testCaseResults.length > 0 || !executionResults.error) && (
                        <div className="text-xs text-neutral-400 mb-1">
                            {typeof executionResults.executionTime === 'number' && <span className="mr-2">Time: {executionResults.executionTime.toFixed(1)}ms</span>}
                            {/* {typeof executionResults.memoryUsage === 'number' && <span>Memory: {executionResults.memoryUsage.toFixed(1)}MB</span>} */}
                        </div>
                    )}
                    {resultsToShow.length > 0 && (
                        <div className="space-y-1 mt-1">
                        {resultsToShow.map((tcResult) => {
                            const originalTestInput = executionResults.testCaseResults.find(r => r.testCase.stdin === tcResult.testCase.stdin && r.testCase.expectedStdout === tcResult.testCase.expectedStdout && r.actualOutput === tcResult.actualOutput )?.testCase;
                            const originalIndex = originalTestInput ? problem.testCases.findIndex(ptc => ptc.stdin === originalTestInput.stdin && ptc.expectedStdout === originalTestInput.expectedStdout) : -1;
                            return (
                                <div key={`tc-${originalIndex}-${tcResult.status}-${tcResult.testCase.stdin}`} className={`p-1.5 rounded text-xs ${tcResult.passed ? 'bg-green-900/25' : 'bg-red-900/25'} text-neutral-200`}>
                                <p className="font-mono font-medium">Test Case #{originalIndex !== -1 ? originalIndex + 1 : 'Custom'}: <span className={tcResult.passed ? 'text-green-300' : 'text-red-300'}>{tcResult.passed ? "Passed" : "Failed"}</span> ({tcResult.status})</p>
                                <p className="font-mono mt-0.5">Input: <span className="text-neutral-300">{typeof tcResult.testCase.stdin === 'object' ? JSON.stringify(tcResult.testCase.stdin) : String(tcResult.testCase.stdin)}</span></p>
                                <p className="font-mono">Expected: <span className="text-neutral-300">{typeof tcResult.testCase.expectedStdout === 'object' ? JSON.stringify(tcResult.testCase.expectedStdout) : String(tcResult.testCase.expectedStdout)}</span></p>
                                
                                { (lastActionType === 'run' || !tcResult.passed) && 
                                  <p className={`font-mono ${!tcResult.passed ? 'text-red-300' : 'text-neutral-300'}`}>
                                    Actual: <span className={`${!tcResult.passed ? 'text-red-300' : 'text-green-300'}`}>{typeof tcResult.actualOutput === 'object' ? JSON.stringify(tcResult.actualOutput) : String(tcResult.actualOutput)}</span>
                                  </p>
                                }

                                {tcResult.error && <p className="font-mono text-red-300">Detail: {tcResult.error}</p>}
                                {/* {tcResult.stdout && <pre className="font-mono text-xs text-neutral-300 bg-neutral-700/50 p-1 my-0.5 rounded max-h-20 overflow-y-auto whitespace-pre-wrap">Stdout: {tcResult.stdout}</pre>} */}
                                {tcResult.stderr && <pre className="font-mono text-xs text-red-300 bg-neutral-700/50 p-1 my-0.5 rounded max-h-20 overflow-y-auto whitespace-pre-wrap">Stderr: {tcResult.stderr}</pre>}
                                </div>
                            );
                        })}
                        </div>
                    )}
                    {/* Message if submitting and all passed, but no specific failed cases to show (because resultsToShow is empty) */}
                    {lastActionType === 'submit' && executionResults.passed && resultsToShow.length === 0 && 
                        <p className="mt-2 text-sm text-green-400 flex items-center justify-center h-full">
                            All submission tests passed successfully!
                        </p>
                    }
                    {lastActionType === 'run' && executionResults.passed && executionResults.testCaseResults.length > 0 && resultsToShow.length > 0 && resultsToShow.every(tc => tc.passed) && <p className="mt-2 text-sm text-green-400">All sample tests passed!</p>}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex-shrink-0 p-3 bg-neutral-700 dark:bg-neutral-800 border-t border-neutral-600 dark:border-neutral-700 flex justify-end space-x-3"><button onClick={handleRun} disabled={isLoadingRun || isLoadingSubmit} className="flex items-center px-4 py-2 bg-neutral-600 text-white rounded hover:bg-neutral-500 transition-colors disabled:opacity-50">{isLoadingRun ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div> : <PlayIcon className="w-4 h-4 mr-2" />}Run Code</button><button onClick={handleSubmit} disabled={isLoadingRun || isLoadingSubmit} className="flex items-center px-4 py-2 bg-brand-primary text-white rounded hover:bg-brand-secondary transition-colors disabled:opacity-50">{isLoadingSubmit ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div> : <SendIcon className="w-4 h-4 mr-2" />}Submit</button></div>
        </div>
      </div>
    </div>
  );
}