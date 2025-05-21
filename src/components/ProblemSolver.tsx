import React, { useEffect, useState, useRef } from 'react';
import { PlayIcon, SendIcon, RotateCcwIcon, InfoIcon } from 'lucide-react';
import CodeEditor from './CodeEditor';

interface Problem {
  title: string;
  background: string;
  problemStatement: string;
  examples: Array<{input: string; output: string, expected?: string}>;
  constraints: string[];
  requirements: string[];
  leetcodeUrl: string;
}

interface TestResult {
  passed: boolean;
  testCases: Array<{
    input: string;
    expected: string;
    actual: string;
    passed: boolean;
  }>;
}

interface ProblemSolverProps {
  problem: Problem;
  solution: string | null;
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

export function ProblemSolver({
  problem,
  solution,
  onSubmit,
  testResults
}: ProblemSolverProps) {
  console.log("ProblemSolver render with problem:", problem);
  
  // Process problem data for safety, without parsing description
  const processedProblem = useRef<Problem>({
    ...problem,
    // Ensure defaults if missing
    examples: problem.examples && problem.examples.length > 0 
      ? problem.examples 
      : [{ input: 'Sample input', output: 'Expected output' }],
    constraints: problem.constraints && problem.constraints.length > 0
      ? problem.constraints
      : ['Solution must be efficient']
  });
  
  // Verify required problem properties exist
  if (!problem || !problem.title) {
    console.error("ProblemSolver received incomplete problem data:", problem);
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="bg-red-100 text-red-700 p-4 rounded-md mb-4">
              <p className="font-medium">Error: Invalid problem data</p>
              <p className="text-sm mt-2">The problem data is incomplete. Please try selecting a different problem.</p>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Add a safety check for the initial code state
  const getInitialCode = () => {
    // Default function template if solution is not provided
    return solution || `function solution(input) {\n  // Your solution here\n  return null;\n}`;
  };
  
  const [code, setCode] = useState(getInitialCode());
  const [runResults, setRunResults] = useState<TestResult | null>(null);
  const [showError, setShowError] = useState(false);
  const initialCode = useRef(code);
  const [typingComplete, setTypingComplete] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  
  // Simplified typing state
  const [typedText, setTypedText] = useState("");
  
  // Update code when problem or solution changes
  useEffect(() => {
    // Update processedProblem when problem changes
    processedProblem.current = {
      ...problem,
      examples: problem.examples && problem.examples.length > 0 
        ? problem.examples 
        : [{ input: 'Sample input', output: 'Expected output' }],
      constraints: problem.constraints && problem.constraints.length > 0
        ? problem.constraints
        : ['Solution must be efficient']
    };
    
    setCode(getInitialCode());
    initialCode.current = getInitialCode();
    
    // Reset typing state when problem changes
    setTypedText("");
    setTypingComplete(false);
    setShowEditor(false);
  }, [problem, solution]);

  // Create the full text to be typed out
  useEffect(() => {
    if (!problem) return;
    
    // Build the complete text content for display
    let fullTextContent = "";
    
    // Add Title (without "Problem:" prefix)
    fullTextContent += problem.title + "\n\n";
    
    // Add Background if it exists (without "Background:" prefix)
    if (problem.background) {
      fullTextContent += problem.background + "\n\n";
    }
    
    // Add Problem Statement if it exists (without "Problem Statement:" prefix)
    if (problem.problemStatement) {
      fullTextContent += problem.problemStatement + "\n\n";
    }
    
    // Add Examples
    fullTextContent += "Examples: \n";
    if (problem.examples && problem.examples.length > 0) {
      problem.examples.forEach((example, index) => {
        fullTextContent += `Example ${index + 1}:\n`;
        fullTextContent += `Input: ${example.input}\n`;
        fullTextContent += `Output: ${example.output}\n`;
        if (example.expected) {
          fullTextContent += `Expected: ${example.expected}\n`;
        }
        fullTextContent += "\n";
      });
    }
    
    // Add Constraints
    if (problem.constraints && problem.constraints.length > 0) {
      fullTextContent += "Constraints: \n";
      problem.constraints.forEach((constraint) => {
        fullTextContent += `• ${constraint}\n`;
      });
      fullTextContent += "\n";
    }
    
    // Add Requirements
    if (problem.requirements && problem.requirements.length > 0) {
      fullTextContent += "Requirements: \n";
      problem.requirements.forEach((requirement) => {
        fullTextContent += `• ${requirement}\n`;
      });
      fullTextContent += "\n";
    }
    
    // Add LeetCode Link
    if (problem.leetcodeUrl) {
      fullTextContent += "Original LeetCode problem for this problem statement";
    }
    
    // Skip animation in development mode
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    if (isDevelopment) {
      // In development mode, skip typing animation
      setTypedText(fullTextContent);
      setTypingComplete(true);
      setShowEditor(true);
    } else {
      // In production mode, use typing animation
      let index = 0;
      
      const typingInterval = setInterval(() => {
        // Type exactly one character at a time for smooth typing
        index += 1;
        
        setTypedText(fullTextContent.substring(0, index));
        
        // Check if we've reached the end
        if (index >= fullTextContent.length) {
          clearInterval(typingInterval);
          setTimeout(() => {
            setTypingComplete(true);
            setTimeout(() => {
              setShowEditor(true);
            }, 300);
          }, 500);
        }
      }, 25); // moderate typing speed that feels natural
      
      return () => clearInterval(typingInterval);
    }
  }, [problem]);

  const handleReset = () => {
    setCode(initialCode.current);
    setRunResults(null);
    setShowError(false);
  };

  const handleRun = () => {
    // Safety check - don't run if problem is undefined
    if (!problem) {
      console.error("Cannot run tests - problem is undefined");
      return;
    }
    
    const exampleData = processedProblem.current.examples || [];
    if (exampleData.length === 0) {
      console.error("Cannot run tests - no examples available");
      return;
    }
    
    // Simulate running test cases
    const results: TestResult = {
      passed: true,
      testCases: exampleData.map((example, i) => ({
        input: example.input,
        expected: example.output,
        actual: Math.random() > 0.8 && i > 0 ? '[0, 1]' : example.output, 
        passed: Math.random() > 0.8 || i === 0 // First test always passes, others have 80% chance
      }))
    };
    
    // Update the overall passed status based on individual test cases
    results.passed = results.testCases.every(test => test.passed);
    setRunResults(results);
  };

  const handleSubmit = () => {
    // Run all test cases and show results page
    onSubmit(code);
  };
  
      // Helper function to format the typed text with proper HTML
    const formatTypedText = () => {
      if (!typedText) return null;
      
      // Pre-process the text to handle sections better
      let sections: { type: string; content: string[]; }[] = [];
      let currentSection: { type: string; content: string[]; } = { type: 'title', content: [] };
      
      // Split the text by line breaks
      const lines = typedText.split('\n');
      
      // Group lines into coherent sections to avoid partial rendering issues
      lines.forEach((line, i) => {
        if (i === 0) {
          // Title is first line
          currentSection.content.push(line);
        }
        else if (line.startsWith('Examples:')) {
          sections.push({ ...currentSection });
          currentSection = { type: 'examples-header', content: [line] };
        }
        else if (line.startsWith('Example ')) {
          if (currentSection.type !== 'example') {
            sections.push({ ...currentSection });
            currentSection = { type: 'example', content: [] };
          }
          currentSection.content.push(line);
        }
        else if (line.startsWith('Input:') || line.startsWith('Output:') || line.startsWith('Expected:')) {
          if (currentSection.type !== 'example') {
            sections.push({ ...currentSection });
            currentSection = { type: 'example', content: [] };
          }
          currentSection.content.push(line);
        }
        else if (line.startsWith('Constraints:')) {
          sections.push({ ...currentSection });
          currentSection = { type: 'constraints-header', content: [line] };
        }
        else if (line.startsWith('• ') && (currentSection.type === 'constraints-header' || currentSection.type === 'constraints-item')) {
          if (currentSection.type === 'constraints-header') {
            sections.push({ ...currentSection });
            currentSection = { type: 'constraints-item', content: [] };
          }
          currentSection.content.push(line);
        }
        else if (line.startsWith('Requirements:')) {
          sections.push({ ...currentSection });
          currentSection = { type: 'requirements-header', content: [line] };
        }
        else if (line.startsWith('• ') && (currentSection.type === 'requirements-header' || currentSection.type === 'requirements-item')) {
          if (currentSection.type === 'requirements-header') {
            sections.push({ ...currentSection });
            currentSection = { type: 'requirements-item', content: [] };
          }
          currentSection.content.push(line);
        }
        else if (line === 'Original LeetCode problem for this problem statement') {
          sections.push({ ...currentSection });
          currentSection = { type: 'leetcode', content: [line] };
        }
        else if (line.trim() === '') {
          // Skip empty lines for now, they're handled as part of section rendering
        }
        else {
          if (currentSection.type === 'title') {
            sections.push({ ...currentSection });
            currentSection = { type: 'paragraph', content: [] };
          }
          currentSection.content.push(line);
        }
      });
      
      // Add the last section
      if (currentSection.content.length > 0) {
        sections.push(currentSection);
      }
      
      // Render each section properly
      return sections.map((section, sectionIndex) => {
        switch (section.type) {
          case 'title':
            return section.content.length > 0 ? (
              <h2 key={`section-${sectionIndex}`} className="text-2xl font-bold mt-4 mb-2">
                {section.content[0]}
              </h2>
            ) : null;
            
          case 'examples-header':
          case 'constraints-header':
          case 'requirements-header':
            return section.content.length > 0 ? (
              <h3 key={`section-${sectionIndex}`} className="text-xl font-medium mt-4 mb-2">
                {section.content[0]}
              </h3>
            ) : null;
            
          case 'example':
            return (
              <div key={`section-${sectionIndex}`} className="mt-2">
                {section.content.map((line, i) => {
                  if (line.startsWith('Example ')) {
                    return (
                      <h4 key={`line-${i}`} className="text-lg font-medium mt-3 mb-1">
                        {line}
                      </h4>
                    );
                  } else if (line.startsWith('Input:') || line.startsWith('Output:') || line.startsWith('Expected:')) {
                    return (
                      <p key={`line-${i}`} className="font-mono text-sm ml-4">
                        {line}
                      </p>
                    );
                  } else {
                    return <p key={`line-${i}`}>{line}</p>;
                  }
                })}
              </div>
            );
            
          case 'constraints-item':
          case 'requirements-item':
            return (
              <ul key={`section-${sectionIndex}`} className="list-disc pl-5 mt-2">
                {section.content.map((line, i) => (
                  <li key={`item-${i}`} className="ml-2 font-mono text-sm">
                    {line.startsWith('• ') ? line.substring(2) : line}
                  </li>
                ))}
              </ul>
            );
            
          case 'leetcode':
            return section.content.length > 0 && problem.leetcodeUrl ? (
              <div key={`section-${sectionIndex}`} className="mt-8 text-sm text-neutral-500">
                <a 
                  href={problem.leetcodeUrl} 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-brand-primary transition-colors"
                >
                  {section.content[0]}
                </a>
              </div>
            ) : null;
            
          case 'paragraph':
          default:
            return (
              <div key={`section-${sectionIndex}`} className="mt-2">
                {section.content.map((line, i) => (
                  <p key={`line-${i}`} className="mb-2">
                    {line}
                  </p>
                ))}
              </div>
            );
        }
      });
    };

  return (
    <div className="h-[calc(100vh-64px)] max-h-[calc(100vh-64px)] flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <div className="flex flex-1 md:flex-row overflow-hidden">
        {/* Problem Description - Independently Scrollable */}
        <div className="w-full md:w-1/2 h-full flex flex-col bg-white dark:bg-neutral-850">
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              {problem ? (
                <div className="prose dark:prose-invert max-w-none">
                  {formatTypedText()}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-lg text-gray-500">Loading problem...</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Code Editor - Independently Scrollable with Fixed Buttons */}
        <div className={`w-full md:w-1/2 h-full flex flex-col bg-neutral-800 dark:bg-neutral-900 transition-all duration-500 transform ${showEditor ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'}`}>
          {/* Header - Fixed */}
          <div className="flex-shrink-0 p-3 bg-neutral-700 dark:bg-neutral-800 flex justify-between items-center border-b border-neutral-600">
            <div className="flex items-center">
              <h3 className="font-medium text-white">Solution Editor</h3>
              <div className="ml-3 flex items-center text-xs text-neutral-400 border-l border-neutral-600 pl-3">
                <InfoIcon className="h-3 w-3 mr-1 flex-shrink-0" />
                <span>Python</span>
              </div>
            </div>
            <button onClick={handleReset} className="flex items-center px-3 py-1 text-sm text-neutral-300 hover:text-white transition-colors">
              <RotateCcwIcon className="w-4 h-4 mr-1" />
              Reset
            </button>
          </div>
          
          {/* Editor and Results Area - Monaco handles its own scrolling */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Code Editor - Limit height to ensure buttons are visible */}
            <div className="flex-1 bg-neutral-900" style={{ maxHeight: 'calc(100vh - 180px)' }}>
              <CodeEditor
                code={code}
                language="python"
                onChange={setCode}
                height="100%"
                width="100%"
              />
            </div>
            
            {/* Test Results - Scrollable if needed */}
            {runResults && (
              <div className="flex-shrink-0 border-t border-neutral-700 bg-neutral-800 overflow-y-auto max-h-[150px]">
                <div className="p-3">
                  <h4 className="text-sm font-medium text-white mb-2">
                    Test Results:
                  </h4>
                  <div className="space-y-2">
                    {runResults.testCases.map((test, index) => (
                      <div 
                        key={index} 
                        className={`p-2 rounded ${test.passed ? 'bg-green-900/20 text-green-400' : 'bg-red-900/20 text-red-400'}`}
                      >
                        <p className="font-mono text-xs">Input: {test.input}</p>
                        <p className="font-mono text-xs">
                          Expected: {test.expected}
                        </p>
                        <p className="font-mono text-xs">Actual: {test.actual}</p>
                      </div>
                    ))}
                  </div>
                  {runResults.passed && (
                    <p className="mt-3 text-sm text-green-400">
                      All test cases passed! Ready to submit.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Action Buttons - Fixed */}
          <div className="flex-shrink-0 p-3 bg-neutral-700 dark:bg-neutral-800 border-t border-neutral-600 dark:border-neutral-700 flex justify-end space-x-3">
            <button 
              onClick={handleRun} 
              className="flex items-center px-4 py-2 bg-neutral-600 text-white rounded hover:bg-neutral-500 transition-colors"
            >
              <PlayIcon className="w-4 h-4 mr-2" />
              Run Code
            </button>
            <button 
              onClick={handleSubmit} 
              className="flex items-center px-4 py-2 bg-brand-primary text-white rounded hover:bg-brand-secondary transition-colors"
            >
              <SendIcon className="w-4 h-4 mr-2" />
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}