import React from 'react';
export function LoadingAnimation() {
  return <div className="bg-white shadow-lg rounded-lg p-8">
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Transforming abstract problem into company context...
        </h3>
        <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden max-w-md mx-auto">
          <div className="animate-pulse-indigo absolute top-0 left-0 h-full bg-indigo-600 rounded-full"></div>
        </div>
        <div className="mt-8 space-y-4">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-2/5 animate-pulse"></div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-3/5 animate-pulse"></div>
          </div>
        </div>
        <p className="text-gray-500 mt-6">
          Adding company-specific context and requirements...
        </p>
      </div>
    </div>;
}