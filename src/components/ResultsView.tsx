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
  <div className="min-h-[calc(100vh-3.5rem)] bg-gradient-to-br from-slate-50 via-background to-slate-50/50 dark:bg-surface flex flex-col items-center justify-center p-4">
   <div className="w-full max-w-2xl bg-white dark:bg-panel-300 rounded-xl shadow-xl border border-slate-200/60 dark:border-panel-300 p-8 backdrop-blur-sm animate-fade-in">
    <div className="text-center mb-8">
     {results.passed ? (
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-50 to-green-100 dark:bg-green-900/30 mb-5 shadow-lg shadow-green-200/50 dark:shadow-green-900/30">
       <CheckCircleIcon className="w-12 h-12 text-green-600 dark:text-green-400" />
      </div>
     ) : (
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-red-50 to-red-100 dark:bg-red-900/30 mb-5 shadow-lg shadow-red-200/50 dark:shadow-red-900/30">
       <XCircleIcon className="w-12 h-12 text-red-600 dark:text-red-400" />
      </div>
     )}
     <p className={`text-3xl font-bold mt-2 ${results.passed ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
      {results.passed
       ? `Awesome! All ${actualExecutedCount}/${actualExecutedCount} test cases passed!`
       : `Oops! ${passedCount}/${actualExecutedCount} test cases passed.`}
     </p>
     <p className="text-slate-600 dark:text-content-subtle mt-3 text-base">
      {results.passed
       ? 'Great job! Your solution works correctly.'
       : (totalTestCases && actualExecutedCount < totalTestCases
         ? `Your solution needs some adjustments. (${actualExecutedCount} of ${totalTestCases} total test cases were run)`
         : 'Your solution needs some adjustments.')}
     </p>
    </div>

    <div className="space-y-4 mb-8">
     <div className="flex justify-between items-center p-4 bg-slate-50/80 dark:bg-gray-700 rounded-lg border border-slate-200/60 dark:border-gray-600">
      <span className="text-slate-700 dark:text-content-subtle font-medium">Execution Time:</span>
      <span className="font-mono text-slate-900 dark:text-content-subtle font-semibold">{results.executionTime}</span>
     </div>

     {/* Only show detailed test cases if results did not pass overall */}
     {!results.passed && results.testCases && results.testCases.length > 0 && (
      <>
       <h3 className="font-semibold text-lg mt-8 mb-3 text-slate-900 dark:text-content">Test Results:</h3>
       {results.testCases.map((test, index) => (
        <div key={index} className={`p-4 rounded-lg flex items-start border ${test.passed ? 'bg-green-50/50 dark:bg-green-900/20 border-green-200/60 dark:border-green-800/40' : 'bg-red-50/50 dark:bg-red-900/20 border-red-200/60 dark:border-red-800/40'}`}>
         <div className="mr-3 mt-0.5">
          {test.passed ? <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400" /> : <XCircleIcon className="w-5 h-5 text-red-600 dark:text-red-400" />}
         </div>
         <div className="flex-1">
          <p className="font-mono text-sm text-slate-700 dark:text-content-subtle mb-1"><span className="font-semibold">Input:</span> {test.input}</p>
          <p className="font-mono text-sm text-slate-700 dark:text-content-subtle"><span className="font-semibold">Expected:</span> {test.output}</p>
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
       className="flex items-center justify-center w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 dark:from-indigo-500 dark:to-indigo-600 text-white rounded-lg hover:from-indigo-700 hover:to-indigo-800 dark:hover:from-indigo-600 dark:hover:to-indigo-700 shadow-md hover:shadow-lg transition-all duration-200 font-medium"
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
