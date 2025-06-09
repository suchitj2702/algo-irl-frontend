import React, { useState, useEffect } from 'react';
import { PlayIcon, CheckCircleIcon, ClockIcon, TrashIcon, AlertTriangleIcon, XIcon } from 'lucide-react';
import { getAllCachedProblems, CachedProblem, clearCache } from '../utils/cache';
import { blind75Data } from '../constants/blind75';

interface Blind75Props {
  onPracticeWithContext: (problemSlug: string) => void;
  onResumeProblem: (problemId: string) => void;
}

export function Blind75({ onPracticeWithContext, onResumeProblem }: Blind75Props) {
  const [cachedProblems, setCachedProblems] = useState<CachedProblem[]>([]);
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);

  useEffect(() => {
    const problems = getAllCachedProblems();
    setCachedProblems(problems);
  }, []);

  // Helper function to convert slug to title
  const slugToTitle = (slug: string): string => {
    return slug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Helper function to get all cached problems for a slug (both solved and in-progress)
  const getAllCachedProblemsForSlug = (slug: string): CachedProblem[] => {
    return cachedProblems.filter(p => 
      p.title?.toLowerCase().replace(/\s+/g, '-') === slug || 
      p.problemId?.includes(slug) ||
      p.problemId?.startsWith(slug + '_') // Handle new format: slug_companyId
    );
  };

  // Helper function to get latest solved problem for a slug
  const getLatestSolvedProblem = (slug: string): CachedProblem | null => {
    const solvedProblems = cachedProblems
      .filter(p => 
        (p.title?.toLowerCase().replace(/\s+/g, '-') === slug || 
         p.problemId?.includes(slug) ||
         p.problemId?.startsWith(slug + '_')) &&
        p.status === 'solved'
      )
      .sort((a, b) => b.timestamp - a.timestamp); // latest first
    
    return solvedProblems.length > 0 ? solvedProblems[0] : null;
  };

  // Helper function to get in-progress problem for a slug
  const getInProgressProblem = (slug: string): CachedProblem | null => {
    return cachedProblems.find(p => 
      (p.title?.toLowerCase().replace(/\s+/g, '-') === slug || 
       p.problemId?.includes(slug) ||
       p.problemId?.startsWith(slug + '_')) &&
      p.status === 'in_progress'
    ) || null;
  };

  // Helper function to get the latest attempt (regardless of status)
  const getLatestAttempt = (slug: string): CachedProblem | null => {
    const allAttempts = cachedProblems
      .filter(p => 
        p.title?.toLowerCase().replace(/\s+/g, '-') === slug || 
        p.problemId?.includes(slug) ||
        p.problemId?.startsWith(slug + '_')
      )
      .sort((a, b) => b.timestamp - a.timestamp); // latest first
    
    return allAttempts.length > 0 ? allAttempts[0] : null;
  };

  // Get problem status: 'solved', 'in_progress', or 'not_started' (based on most recent attempt only)
  const getProblemStatus = (slug: string): 'solved' | 'in_progress' | 'not_started' => {
    const latestAttempt = getLatestAttempt(slug);
    
    if (!latestAttempt) return 'not_started';
    return latestAttempt.status;
  };

  // Calculate overall statistics (both solved and in-progress)
  const calculateStats = () => {
    const totalProblems = Object.values(blind75Data).flat().length;
    const solvedProblems = Object.values(blind75Data).flat().filter(problem => {
      return getProblemStatus(problem.slug) === 'solved';
    });
    const inProgressProblems = Object.values(blind75Data).flat().filter(problem => {
      return getProblemStatus(problem.slug) === 'in_progress';
    });

    const easyProblems = Object.values(blind75Data).flat().filter(p => p.difficulty === 'Easy');
    const mediumProblems = Object.values(blind75Data).flat().filter(p => p.difficulty === 'Medium');
    const hardProblems = Object.values(blind75Data).flat().filter(p => p.difficulty === 'Hard');

    const solvedEasy = easyProblems.filter(p => getProblemStatus(p.slug) === 'solved').length;
    const solvedMedium = mediumProblems.filter(p => getProblemStatus(p.slug) === 'solved').length;
    const solvedHard = hardProblems.filter(p => getProblemStatus(p.slug) === 'solved').length;

    return {
      total: { solved: solvedProblems.length, inProgress: inProgressProblems.length, total: totalProblems },
      easy: { solved: solvedEasy, total: easyProblems.length },
      medium: { solved: solvedMedium, total: mediumProblems.length },
      hard: { solved: solvedHard, total: hardProblems.length }
    };
  };

  const stats = calculateStats();

  // Get last 3 unique companies for a problem (both solved and in-progress, oldest to latest)
  const getCompaniesForProblem = (slug: string) => {
    const problemSolutions = cachedProblems
      .filter(p => 
        (p.title?.toLowerCase().replace(/\s+/g, '-') === slug || 
         p.problemId?.includes(slug) ||
         p.problemId?.startsWith(slug + '_')) && 
        (p.status === 'solved' || p.status === 'in_progress')
      )
      .sort((a, b) => b.timestamp - a.timestamp); // latest first for deduplication

    // Deduplicate by company name while preserving most recent occurrence
    const uniqueCompanies = [];
    const seenCompanies = new Set();
    
    for (const problem of problemSolutions) {
      const companyName = problem.companyName; // Use exact name from cache
      if (!seenCompanies.has(companyName.toLowerCase())) {
        seenCompanies.add(companyName.toLowerCase());
        uniqueCompanies.push(companyName);
      }
    }

    // Return up to 3 unique companies, most recent first
    return uniqueCompanies.slice(0, 3);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-600 dark:text-green-400';
      case 'Medium': return 'text-yellow-600 dark:text-yellow-400';
      case 'Hard': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStatBadgeColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'Hard': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-300';
    }
  };

  const handleActionClick = (slug: string, status: 'solved' | 'in_progress' | 'not_started') => {
    const latestAttempt = getLatestAttempt(slug);
    if (latestAttempt) {
      onResumeProblem(latestAttempt.problemId);
    }
  };

  // Handle reset progress
  const handleResetProgress = () => {
    clearCache();
    setCachedProblems([]);
    setShowResetConfirmation(false);
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-green-800 dark:from-green-400 dark:via-emerald-400 dark:to-green-600 bg-clip-text text-transparent mb-2">
            Blind 75
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
            Master the most important coding interview problems
          </p>
          <div className="max-w-2xl mx-auto">
            <p className="text-sm text-gray-500 dark:text-gray-500 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 rounded-lg p-3">
              💡 <strong>What is Blind 75?</strong> A curated list of 75 essential LeetCode problems covering all major data structures and algorithms patterns. Created by a Facebook engineer, this list is designed to help you efficiently prepare for technical interviews at top tech companies.
            </p>
          </div>
        </div>

        {/* Cool Progress Stats */}
        <div className="bg-gradient-to-br from-white via-gray-50 to-indigo-50 dark:from-gray-800 dark:via-gray-850 dark:to-indigo-900/20 rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-6 mb-8 backdrop-blur-sm">
          {/* Main Progress Circle and Stats */}
          <div className="flex items-center justify-between mb-6">
            {/* Animated Progress Circle */}
            <div className="relative">
              <div className="flex items-center gap-6">
                {/* Large Progress Circle */}
                <div className="relative w-24 h-24">
                  <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                    {/* Background circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-gray-200 dark:text-gray-700"
                    />
                    {/* Progress circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="url(#progressGradient)"
                      strokeWidth="8"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 40}`}
                      strokeDashoffset={`${2 * Math.PI * 40 * (1 - stats.total.solved / stats.total.total)}`}
                      className="transition-all duration-1000 ease-out"
                      style={{
                        filter: 'drop-shadow(0 0 6px rgba(99, 102, 241, 0.3))'
                      }}
                    />
                    <defs>
                      <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="50%" stopColor="#06b6d4" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                      </linearGradient>
                    </defs>
                  </svg>
                  {/* Center content */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl font-bold bg-gradient-to-r from-emerald-600 via-cyan-600 to-purple-600 bg-clip-text text-transparent">
                        {Math.round((stats.total.solved / stats.total.total) * 100)}%
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Complete
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats Display */}
                <div className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold bg-gradient-to-r from-emerald-600 via-cyan-600 to-purple-600 bg-clip-text text-transparent">
                      {stats.total.solved}
                    </span>
                    <span className="text-xl text-gray-400 dark:text-gray-500 font-medium">
                      / {stats.total.total}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                      problems solved
                    </span>
                  </div>
                  
                  {stats.total.inProgress > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
                      <span className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">
                        {stats.total.inProgress} in progress
                      </span>
                    </div>
                  )}
                  
                  {stats.total.solved === stats.total.total && (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-gradient-to-r from-emerald-400 to-cyan-500 rounded-full animate-pulse"></div>
                      <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                        🎉 All problems completed!
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Reset Progress Button */}
            {(stats.total.solved > 0 || stats.total.inProgress > 0) && (
              <button
                onClick={() => setShowResetConfirmation(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-200 border border-red-200 dark:border-red-800/30 hover:border-red-300 dark:hover:border-red-700/50 hover:shadow-md"
                title="Reset all progress"
              >
                <TrashIcon className="w-4 h-4" />
                Reset Progress
              </button>
            )}
          </div>

          {/* Difficulty Breakdown with Mini Progress Bars */}
          <div className="grid grid-cols-3 gap-4">
            {/* Easy */}
            <div className="bg-white/70 dark:bg-gray-800/70 rounded-lg p-4 backdrop-blur-sm border border-green-200/50 dark:border-green-800/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-green-700 dark:text-green-300">Easy</span>
                <span className="text-xs text-green-600 dark:text-green-400 font-mono">
                  {stats.easy.solved}/{stats.easy.total}
                </span>
              </div>
              <div className="w-full bg-green-100 dark:bg-green-900/30 rounded-full h-2 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-1000 ease-out shadow-sm"
                  style={{ width: `${(stats.easy.solved / stats.easy.total) * 100}%` }}
                ></div>
              </div>
              <div className="text-right mt-1">
                <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                  {Math.round((stats.easy.solved / stats.easy.total) * 100)}%
                </span>
              </div>
            </div>

            {/* Medium */}
            <div className="bg-white/70 dark:bg-gray-800/70 rounded-lg p-4 backdrop-blur-sm border border-yellow-200/50 dark:border-yellow-800/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-yellow-700 dark:text-yellow-300">Medium</span>
                <span className="text-xs text-yellow-600 dark:text-yellow-400 font-mono">
                  {stats.medium.solved}/{stats.medium.total}
                </span>
              </div>
              <div className="w-full bg-yellow-100 dark:bg-yellow-900/30 rounded-full h-2 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full transition-all duration-1000 ease-out shadow-sm"
                  style={{ width: `${(stats.medium.solved / stats.medium.total) * 100}%` }}
                ></div>
              </div>
              <div className="text-right mt-1">
                <span className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">
                  {Math.round((stats.medium.solved / stats.medium.total) * 100)}%
                </span>
              </div>
            </div>

            {/* Hard */}
            <div className="bg-white/70 dark:bg-gray-800/70 rounded-lg p-4 backdrop-blur-sm border border-red-200/50 dark:border-red-800/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-red-700 dark:text-red-300">Hard</span>
                <span className="text-xs text-red-600 dark:text-red-400 font-mono">
                  {stats.hard.solved}/{stats.hard.total}
                </span>
              </div>
              <div className="w-full bg-red-100 dark:bg-red-900/30 rounded-full h-2 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-red-400 to-pink-500 rounded-full transition-all duration-1000 ease-out shadow-sm"
                  style={{ width: `${(stats.hard.solved / stats.hard.total) * 100}%` }}
                ></div>
              </div>
              <div className="text-right mt-1">
                <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                  {Math.round((stats.hard.solved / stats.hard.total) * 100)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Problems by Topic */}
        <div className="space-y-6">
          {Object.entries(blind75Data).map(([topic, problems]) => (
            <div key={topic} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {topic}
                </h3>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {problems.filter(p => getProblemStatus(p.slug) === 'solved').length}/{problems.length}
                </span>
              </div>
              
              <div className="space-y-2">
                {problems.map((problem) => {
                  const status = getProblemStatus(problem.slug);
                  const companies = (status === 'solved' || status === 'in_progress') ? getCompaniesForProblem(problem.slug) : [];
                  
                  return (
                    <div
                      key={problem.slug}
                      className={`flex items-center justify-between p-3 rounded-md border transition-colors duration-200 ${
                        status === 'solved'
                          ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800/30'
                          : status === 'in_progress'
                          ? 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800/30'
                          : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
                            {slugToTitle(problem.slug)}
                          </span>
                          <span className={`text-xs font-medium ${getDifficultyColor(problem.difficulty)} flex-shrink-0`}>
                            {problem.difficulty}
                          </span>
                          {status === 'solved' && (
                            <CheckCircleIcon className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                          )}
                          {status === 'in_progress' && (
                            <ClockIcon className="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                          )}
                        </div>
                        
                        {/* Company Context for Both Solved and In-Progress Problems */}
                        {(status === 'solved' || status === 'in_progress') && companies.length > 0 && (
                          <div className="mt-1 flex items-center gap-1">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Recent:
                            </span>
                            {companies.map((company, index) => (
                              <span
                                key={index}
                                className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                              >
                                {company}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 ml-3">
                        {/* Resume/See Solution Button */}
                        {(status === 'solved' || status === 'in_progress') && (
                          <button
                            onClick={() => handleActionClick(problem.slug, status)}
                            className={`flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-md transition-colors flex-shrink-0 ${
                              status === 'solved'
                                ? 'text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30'
                                : 'text-yellow-700 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/30'
                            }`}
                          >
                            {status === 'solved' ? (
                              <>
                                <CheckCircleIcon className="w-3 h-3" />
                                See My Solution
                              </>
                            ) : (
                              <>
                                <PlayIcon className="w-3 h-3" />
                                Resume
                              </>
                            )}
                          </button>
                        )}
                        
                        {/* Practice Button */}
                        <button
                          onClick={() => onPracticeWithContext(problem.slug)}
                          className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-md transition-colors flex-shrink-0"
                        >
                          <PlayIcon className="w-3 h-3" />
                          Practice
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Reset Confirmation Modal */}
        {showResetConfirmation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-shrink-0 w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                  <AlertTriangleIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Reset All Progress
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    This action cannot be undone
                  </p>
                </div>
                <button
                  onClick={() => setShowResetConfirmation(false)}
                  className="ml-auto p-1 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                >
                  <XIcon className="w-5 h-5" />
                </button>
              </div>
              
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                Are you sure you want to reset all your progress? This will permanently delete:
              </p>
              
              <ul className="text-sm text-gray-600 dark:text-gray-400 mb-6 space-y-1">
                <li>• All solved problems ({stats.total.solved} problems)</li>
                <li>• All in-progress problems ({stats.total.inProgress} problems)</li>
                <li>• All saved solutions and company contexts</li>
                <li>• Recent company selections</li>
              </ul>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowResetConfirmation(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResetProgress}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                >
                  Reset Progress
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 