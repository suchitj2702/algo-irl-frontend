import { useState, useEffect } from 'react';
import { getAllCachedProblems, CachedProblem } from '../utils/cache';
import { PlayIcon, CheckCircleIcon, ClockIcon } from 'lucide-react';

interface ProgressPageProps {
  onResumeProblem: (problemId: string) => void;
}

export function ProgressPage({ onResumeProblem }: ProgressPageProps) {
  const [problems, setProblems] = useState<CachedProblem[]>([]);

  useEffect(() => {
    const cachedProblems = getAllCachedProblems();
    setProblems(cachedProblems);
  }, []);

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
      case 'hard':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const getStatusIcon = (status: 'solved' | 'in_progress') => {
    if (status === 'solved') {
      return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
    } else {
      return <ClockIcon className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusText = (status: 'solved' | 'in_progress') => {
    return status === 'solved' ? 'Solved' : 'In Progress';
  };

  const getStatusColor = (status: 'solved' | 'in_progress') => {
    return status === 'solved' 
      ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
      : 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
  };

  const handleActionClick = (problem: CachedProblem) => {
    onResumeProblem(problem.problemId);
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] font-sans text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-900 transition-colors duration-200">      
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-750 dark:text-white mb-2">
            Your Progress
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Track your journey through algorithmic challenges
          </p>
        </div>

        {problems.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <PlayIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-neutral-750 dark:text-white mb-2">
              No problems attempted yet
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6">
              Start your journey by generating your first challenge!
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-brand-primary hover:bg-brand-secondary rounded-lg transition-colors duration-200"
            >
              Generate Challenge
            </button>
          </div>
        ) : (
          <div className="grid gap-3">
            {problems.map((problem) => (
              <div
                key={problem.problemId}
                className="bg-white dark:bg-neutral-850 rounded-lg shadow-medium p-4 border border-gray-200 dark:border-neutral-700"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusIcon(problem.status)}
                      <h3 className="text-lg font-semibold text-neutral-750 dark:text-white">
                        {problem.title || `Problem ${problem.problemId}`}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(problem.status)}`}>
                        {getStatusText(problem.status)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-neutral-600 dark:text-neutral-400">
                      <span className="flex items-center gap-1">
                        <span className="font-medium">Company:</span>
                        <span className="capitalize">{problem.companyName}</span>
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(problem.difficulty)}`}>
                        {problem.difficulty}
                      </span>
                      <span>
                        {formatTimestamp(problem.timestamp)}
                      </span>
                    </div>
                  </div>

                  <div className="ml-4">
                    <button
                      onClick={() => handleActionClick(problem)}
                      className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                        problem.status === 'solved'
                          ? 'text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30'
                          : 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                      }`}
                    >
                      {problem.status === 'solved' ? (
                        <>
                          <CheckCircleIcon className="w-4 h-4 mr-2" />
                          See Solution
                        </>
                      ) : (
                        <>
                          <PlayIcon className="w-4 h-4 mr-2" />
                          Resume
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 