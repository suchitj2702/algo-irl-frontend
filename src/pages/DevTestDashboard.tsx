import { useState, useEffect } from 'react';
import { CheckCircleIcon, XCircleIcon, PlayIcon, Loader2Icon, RefreshCwIcon } from 'lucide-react';
import CodeEditor from '../components/CodeEditor';
import { fetchAllProblems, fetchProblemById } from '../utils/api-service';
import { executeCodeAndPoll, ExecutionResults, ExecutionTestResult } from '../utils/codeExecution';
import { TestCase } from '../types';

interface ProblemListItem {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  categories: string[];
  isBlind75: boolean;
}

interface LanguageSpecificDetails {
  solutionFunctionNameOrClassName: string;
  solutionStructureHint: string;
  boilerplateCodeWithPlaceholder: string;
  defaultUserCode: string;
  optimizedSolutionCode: string;
}

interface FullProblem {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  testCases: TestCase[];
  languageSpecificDetails: Record<string, LanguageSpecificDetails>;
  leetcodeLink?: string;
}

export default function DevTestDashboard() {
  const [problems, setProblems] = useState<ProblemListItem[]>([]);
  const [selectedProblemId, setSelectedProblemId] = useState<string>('');
  const [fullProblem, setFullProblem] = useState<FullProblem | null>(null);
  const [code, setCode] = useState<string>('');
  const [isLoadingProblems, setIsLoadingProblems] = useState(true);
  const [isLoadingProblem, setIsLoadingProblem] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResults, setExecutionResults] = useState<ExecutionResults | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch all problems on mount
  const loadProblems = async () => {
    setIsLoadingProblems(true);
    setError(null);
    try {
      const data = await fetchAllProblems();
      setProblems(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load problems';
      setError(`Failed to load problems: ${errorMessage}`);
      console.error('Load problems error:', err);
    } finally {
      setIsLoadingProblems(false);
    }
  };

  useEffect(() => {
    loadProblems();
  }, []);

  // Load full problem when selection changes
  useEffect(() => {
    if (!selectedProblemId) {
      setFullProblem(null);
      setCode('');
      setExecutionResults(null);
      return;
    }

    const loadProblem = async () => {
      setIsLoadingProblem(true);
      setError(null);
      setExecutionResults(null);
      try {
        const data = await fetchProblemById(selectedProblemId, 'python');
        setFullProblem(data);
        // Load raw defaultUserCode
        const pythonDetails = data.languageSpecificDetails?.python;
        if (pythonDetails?.defaultUserCode) {
          setCode(pythonDetails.defaultUserCode);
        } else {
          setCode('# No default code available for this problem');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load problem');
      } finally {
        setIsLoadingProblem(false);
      }
    };
    loadProblem();
  }, [selectedProblemId]);

  const handleRunTests = () => {
    if (!fullProblem) return;

    const pythonDetails = fullProblem.languageSpecificDetails?.python;
    if (!pythonDetails) {
      setError('No Python details available for this problem');
      return;
    }

    setIsExecuting(true);
    setExecutionResults(null);
    setError(null);

    executeCodeAndPoll({
      code,
      language: 'python',
      boilerplateCode: pythonDetails.boilerplateCodeWithPlaceholder,
      testCases: fullProblem.testCases,
      onResults: (results) => {
        setExecutionResults(results);
        setIsExecuting(false);
      },
      onError: (errorMsg) => {
        setError(errorMsg);
        setIsExecuting(false);
      },
      onLoadingChange: setIsExecuting,
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-600 dark:text-green-400';
      case 'Medium': return 'text-yellow-600 dark:text-yellow-400';
      case 'Hard': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Dev Test Dashboard
        </h1>

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded text-red-700 dark:text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Problem Selector */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Select Problem ({problems.length} problems)
            </label>
            <button
              onClick={loadProblems}
              disabled={isLoadingProblems}
              className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              title="Refresh problem list"
            >
              <RefreshCwIcon className={`w-4 h-4 ${isLoadingProblems ? 'animate-spin' : ''}`} />
            </button>
          </div>
          {isLoadingProblems ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2Icon className="w-4 h-4 animate-spin" />
              Loading problems...
            </div>
          ) : (
            <select
              value={selectedProblemId}
              onChange={(e) => setSelectedProblemId(e.target.value)}
              className="w-full max-w-xl p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm"
            >
              <option value="">-- Select a problem --</option>
              {problems.map((problem) => (
                <option key={problem.id} value={problem.id}>
                  [{problem.difficulty}] {problem.title} {problem.isBlind75 ? '(B75)' : ''}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Problem Info */}
        {fullProblem && (
          <div className="mb-4 p-3 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-gray-700 rounded text-sm">
            <div className="flex items-center gap-4">
              <span className="font-medium text-gray-900 dark:text-white">{fullProblem.title}</span>
              <span className={`font-medium ${getDifficultyColor(fullProblem.difficulty)}`}>
                {fullProblem.difficulty}
              </span>
              <span className="text-gray-500 dark:text-gray-400">
                {fullProblem.testCases.length} test cases
              </span>
              {fullProblem.leetcodeLink && (
                <a
                  href={fullProblem.leetcodeLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
                >
                  LeetCode →
                </a>
              )}
            </div>
          </div>
        )}

        {/* Code Editor */}
        {selectedProblemId && (
          <div className="mb-4">
            {isLoadingProblem ? (
              <div className="h-96 flex items-center justify-center bg-white dark:bg-neutral-800 border border-gray-200 dark:border-gray-700 rounded">
                <Loader2Icon className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : (
              <div className="border border-gray-200 dark:border-gray-700 rounded overflow-hidden">
                <CodeEditor
                  code={code}
                  language="python"
                  onChange={setCode}
                  height="400px"
                />
              </div>
            )}
          </div>
        )}

        {/* Run Button */}
        {fullProblem && (
          <div className="mb-4">
            <button
              onClick={handleRunTests}
              disabled={isExecuting || !code}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded text-sm font-medium transition-colors"
            >
              {isExecuting ? (
                <>
                  <Loader2Icon className="w-4 h-4 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <PlayIcon className="w-4 h-4" />
                  Run All Tests
                </>
              )}
            </button>
          </div>
        )}

        {/* Results */}
        {executionResults && (
          <div className="bg-white dark:bg-neutral-800 border border-gray-200 dark:border-gray-700 rounded p-4">
            {/* Summary */}
            <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
              {executionResults.passed ? (
                <CheckCircleIcon className="w-6 h-6 text-green-500" />
              ) : (
                <XCircleIcon className="w-6 h-6 text-red-500" />
              )}
              <span className={`font-medium ${executionResults.passed ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {executionResults.testCasesPassed}/{executionResults.testCasesTotal} test cases passed
              </span>
              {executionResults.executionTime !== null && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Time: {executionResults.executionTime}ms
                </span>
              )}
              {executionResults.memoryUsage !== null && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Memory: {executionResults.memoryUsage}KB
                </span>
              )}
            </div>

            {/* General Error */}
            {executionResults.error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                <div className="font-medium text-red-700 dark:text-red-300 text-sm mb-1">Error:</div>
                <pre className="text-xs text-red-600 dark:text-red-400 whitespace-pre-wrap font-mono">
                  {executionResults.error}
                </pre>
              </div>
            )}

            {/* Test Case Results */}
            <div className="space-y-3">
              {executionResults.testCaseResults.map((result: ExecutionTestResult, index: number) => (
                <TestCaseResultCard key={index} result={result} index={index} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TestCaseResultCard({ result, index }: { result: ExecutionTestResult; index: number }) {
  const [expanded, setExpanded] = useState(!result.passed);

  return (
    <div className={`border rounded ${result.passed ? 'border-green-200 dark:border-green-800' : 'border-red-200 dark:border-red-800'}`}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full flex items-center gap-3 p-3 text-left ${result.passed ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}
      >
        {result.passed ? (
          <CheckCircleIcon className="w-4 h-4 text-green-500 flex-shrink-0" />
        ) : (
          <XCircleIcon className="w-4 h-4 text-red-500 flex-shrink-0" />
        )}
        <span className="font-medium text-sm text-gray-900 dark:text-white">
          Test Case {index + 1}
        </span>
        <span className={`text-xs px-2 py-0.5 rounded ${getStatusColor(result.status)}`}>
          {result.status}
        </span>
        {result.time !== undefined && result.time !== null && (
          <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
            {result.time}ms
          </span>
        )}
      </button>

      {/* Details */}
      {expanded && (
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 space-y-2 text-xs">
          <DetailRow label="Input (stdin)" value={result.testCase.stdin} />
          <DetailRow label="Expected Output" value={result.testCase.expectedStdout} />
          <DetailRow label="Actual Output" value={String(result.actualOutput ?? '')} />
          {result.stdout && <DetailRow label="stdout" value={result.stdout} />}
          {result.stderr && <DetailRow label="stderr" value={result.stderr} isError />}
          {result.compileOutput && <DetailRow label="Compile Output" value={result.compileOutput} isError />}
          {result.error && <DetailRow label="Error" value={result.error} isError />}
          {result.memory !== undefined && result.memory !== null && (
            <div className="text-gray-500 dark:text-gray-400">Memory: {result.memory}KB</div>
          )}
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value, isError }: { label: string; value: string; isError?: boolean }) {
  if (!value) return null;
  return (
    <div>
      <div className="font-medium text-gray-600 dark:text-gray-400 mb-0.5">{label}:</div>
      <pre className={`p-2 rounded font-mono whitespace-pre-wrap break-all ${
        isError
          ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
          : 'bg-gray-100 dark:bg-neutral-700 text-gray-800 dark:text-gray-200'
      }`}>
        {value}
      </pre>
    </div>
  );
}

function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'accepted':
      return 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300';
    case 'wrong answer':
      return 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300';
    case 'time limit exceeded':
      return 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300';
    case 'runtime error':
    case 'runtime error (nzec)':
      return 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300';
    case 'compilation error':
      return 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300';
    default:
      return 'bg-gray-100 dark:bg-gray-900/40 text-gray-700 dark:text-gray-300';
  }
}
