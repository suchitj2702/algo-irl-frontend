import React, { useState, memo } from 'react';
import { CheckCircleIcon, XCircleIcon, SaveIcon } from 'lucide-react';
export function ResultsView({
  results,
  problem,
  onTryAgain,
  showSaveProgress,
  onCloseSaveProgress
}) {
  return <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="text-center mb-6">
          {results.passed ? <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
              <CheckCircleIcon className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div> : <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
              <XCircleIcon className="w-10 h-10 text-red-600 dark:text-red-400" />
            </div>}
          <h2 className="text-2xl font-bold text-neutral-750 dark:text-white">
            {results.passed ? 'All Tests Passed!' : 'Some Tests Failed'}
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            {results.passed ? 'Great job! Your solution works correctly.' : 'Your solution needs some adjustments.'}
          </p>
        </div>
        <div className="space-y-4 mb-6">
          <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
            <span className="text-gray-700 dark:text-gray-200">
              Execution Time:
            </span>
            <span className="font-mono text-gray-700 dark:text-gray-200">
              {results.executionTime}
            </span>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
            <span className="text-gray-700 dark:text-gray-200">
              Memory Used:
            </span>
            <span className="font-mono text-gray-700 dark:text-gray-200">
              {results.memoryUsed}
            </span>
          </div>
          <h3 className="font-medium text-lg mt-6 mb-2 text-neutral-750 dark:text-white">
            Test Results:
          </h3>
          {results.testCases.map((test, index) => <div key={index} className={`p-3 rounded-md flex items-start ${test.passed ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
              <div className="mr-3 mt-0.5">
                {test.passed ? <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400" /> : <XCircleIcon className="w-5 h-5 text-red-600 dark:text-red-400" />}
              </div>
              <div>
                <p className="font-mono text-sm text-gray-700 dark:text-gray-200">
                  Input: {test.input}
                </p>
                <p className="font-mono text-sm text-gray-700 dark:text-gray-200">
                  Expected: {test.output}
                </p>
              </div>
            </div>)}
        </div>
        <div className="flex justify-center">
          <button onClick={onTryAgain} className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors">
            Try Another Problem
          </button>
        </div>
      </div>
      {showSaveProgress && <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center sm:items-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md transform transition-all animate-slide-up">
            <h3 className="text-lg font-medium text-neutral-750 dark:text-white mb-4">
              Save Your Progress
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Great job solving this problem! Would you like to save your
              progress?
            </p>
            <div className="flex justify-end space-x-3">
              <button onClick={onCloseSaveProgress} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                Skip
              </button>
              <button onClick={onCloseSaveProgress} className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors">
                <SaveIcon className="w-4 h-4 mr-2" />
                Save Progress
              </button>
            </div>
          </div>
        </div>}
    </div>;
}