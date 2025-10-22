import React from 'react';
import { CheckCircleIcon, XCircleIcon, Edit3Icon } from 'lucide-react';
import { Problem } from '../types';

// Define a more specific props interface for ResultsView
interface ResultsViewProps {
 results: {
  passed: boolean;
  executionTime: string;
  testCases: Array<{
   input: string;
   output: string;
   passed: boolean;
  }>;
 };
 problem: Problem;
 onGoBackToProblem?: () => void; // New optional prop
 totalTestCases?: number; // Total number of test cases in the problem (for display purposes)
 executedTestCases?: number; // Number of test cases actually executed (for submission limit)
}

export function ResultsView({
 results,
 problem, // problem prop is available but not directly used in this snippet for brevity
 onGoBackToProblem, // Destructure the new prop
 totalTestCases,
 executedTestCases
}: ResultsViewProps) {
 // Calculate the number of passed test cases if results are not overall passed
 const passedCount = results.passed ? results.testCases.length : results.testCases.filter(tc => tc.passed).length;
 
 // Use executedTestCases if provided, otherwise fall back to results.testCases.length
 const actualExecutedCount = executedTestCases || results.testCases.length;

 return (
  <div className="min-h-[calc(100vh-3.5rem)] bg-surface dark:bg-surface flex flex-col items-center justify-center p-4">
   <div className="w-full max-w-2xl bg-panel-muted dark:bg-panel-300 rounded-lg shadow-lg border border-panel-200 dark:border-panel-300 p-6">
    <div className="text-center mb-6">
     {results.passed ? (
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
       <CheckCircleIcon className="w-10 h-10 text-green-600 dark:text-green-400" />
      </div>
     ) : (
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
       <XCircleIcon className="w-10 h-10 text-red-600 dark:text-red-400" />
      </div>
     )}
     {/* <h2 className="text-2xl font-bold text-content">
      {results.passed ? 'All Tests Passed!' : 'Some Tests Failed'}
     </h2> */}
     <p className={`text-2xl font-bold mt-2 ${results.passed ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
      {results.passed 
       ? `Awesome! All ${actualExecutedCount}/${actualExecutedCount} test cases passed!`
       : `Oops! ${passedCount}/${actualExecutedCount} test cases passed.`}
     </p>
     <p className="text-content-muted dark:text-content-subtle mt-2">
      {results.passed 
       ? 'Great job! Your solution works correctly.'
       : (totalTestCases && actualExecutedCount < totalTestCases
         ? `Your solution needs some adjustments. (${actualExecutedCount} of ${totalTestCases} total test cases were run)`
         : 'Your solution needs some adjustments.')}
     </p>
    </div>

    <div className="space-y-4 mb-6">
     <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
      <span className="text-content-muted dark:text-content-subtle">Execution Time:</span>
      <span className="font-mono text-content-muted dark:text-content-subtle">{results.executionTime}</span>
     </div>

     {/* Only show detailed test cases if results did not pass overall */}
     {!results.passed && results.testCases && results.testCases.length > 0 && (
      <>
       <h3 className="font-medium text-lg mt-6 mb-2 text-content">Test Results:</h3>
       {results.testCases.map((test, index) => (
        <div key={index} className={`p-3 rounded-md flex items-start ${test.passed ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
         <div className="mr-3 mt-0.5">
          {test.passed ? <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400" /> : <XCircleIcon className="w-5 h-5 text-red-600 dark:text-red-400" />}
         </div>
         <div>
          <p className="font-mono text-sm text-content-muted dark:text-content-subtle">Input: {test.input}</p>
          <p className="font-mono text-sm text-content-muted dark:text-content-subtle">Expected: {test.output}</p>
          {/* Optionally, show actual output if tests failed and it's available */}
         </div>
        </div>
       ))}
      </>
     )}
    </div>

    <div className="flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-3">
     {onGoBackToProblem && (
      <button 
       onClick={onGoBackToProblem} 
       className="flex items-center justify-center w-full sm:w-auto px-4 py-2 border border-indigo-600 text-indigo-600 dark:border-indigo-500 dark:text-indigo-400 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
      >
       <Edit3Icon className="w-4 h-4 mr-2" />
       Review Solution
      </button>
     )}
    </div>
   </div>
  </div>
 );
}
