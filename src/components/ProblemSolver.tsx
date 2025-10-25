import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
 RotateCcwIcon,
 InfoIcon,
 ArrowLeft,
 ArrowRight,
 Bookmark,
 BookmarkCheck,
 CheckCircle2,
 BookOpenCheck,
 Check,
 AlertCircle
} from 'lucide-react';
import CodeEditor from './CodeEditor';
import { executeCodeAndPoll, ExecutionResults } from '../utils/codeExecution';
import { TestCase } from '../types';
import { ThinkingIndicator } from './ThinkingIndicator';

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

interface StudyPlanContextActions {
 planId: string;
 problemId: string;
 problemTitle?: string;
 day?: number;
 index: number;
 total: number;
 isCompleted: boolean;
 isBookmarked: boolean;
 hasNext: boolean;
 hasPrev: boolean;
 onNext?: () => void;
 onPrev?: () => void;
 onRegenerate?: () => void;
 onToggleBookmark?: () => void;
 onToggleCompletion?: () => void;
 onReturnToPlan?: () => void;
 onResume?: () => void;
}

interface ProblemSolverProps {
 problem: Problem | null;
 solution: string | null;
 codeDetails: CodeDetails | null;
 onSubmit: (code: string, results: ExecutionResults) => void;
 onCodeChange?: (code: string) => void;
 onSolveAnother?: () => void;
 maxSubmitTestCases?: number; // Maximum number of test cases to use for submission (default: 20)
 testResults: {
  passed: boolean;
  executionTime: string;
  testCases: Array<{
   input: string;
   output: string;
   passed: boolean;
  }>;
 } | null;
 studyPlanContext?: StudyPlanContextActions;
 onReturnToBlind75?: () => void;
 isLoading?: boolean; // New prop to show thinking indicator
 saveStatus?: 'saving' | 'saved' | 'error';
 lastSaveTime?: number | null;
}

const THINKING_STATES = [
  "Thinking...",
  "Analyzing...",
  "Generating...",
  "Processing...",
  "Computing..."
];

// Helper function to render text with backtick and bold markdown support
const renderTextWithBackticks = (text: string, keyPrefix: string) => {
 if (!text) return null;
 
 // First split by backticks to handle code formatting
 const backtickParts = text.split('`');
 
 return backtickParts.map((part, backtickIndex) => {
  if (backtickIndex % 2 === 1) {
   // Content inside backticks - render as code
   return <code key={`${keyPrefix}-bt-${backtickIndex}`} className="font-mono bg-mint-light/30 dark:bg-gray-700 px-1 py-0.5 rounded text-sm">{part}</code>;
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
 onCodeChange,
 onSolveAnother,
 maxSubmitTestCases = 20, // Default to 20 test cases for submission
 testResults,
 studyPlanContext,
 onReturnToBlind75,
 isLoading = false,
 saveStatus,
 lastSaveTime
}: ProblemSolverProps) {
 const processedProblem = useRef<Problem | null>(problem);

 const getInitialCode = () => {
  if (!codeDetails) {
    return `function solution(input) {
 // Your solution here
 return null;
}`;
  }
  return solution || codeDetails.defaultUserCode || `function solution(input) {
 // Your solution here
 return null;
}`;
 };

 const getBoilerplateCode = () => {
  if (!codeDetails) {
    return `function solution(input) {
 // Your solution here
 return null;
}`;
  }
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
 const planContext = studyPlanContext;
 const regenerateButtonRef = useRef<HTMLButtonElement | null>(null);
 const [isRegenerateTooltipVisible, setIsRegenerateTooltipVisible] = useState(false);
 const [regenerateTooltipPosition, setRegenerateTooltipPosition] = useState({ left: 0, top: 0 });
 const regenerateTooltipWidth = 260;
 const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

 const updateRegenerateTooltipPosition = useCallback(() => {
  if (typeof window === 'undefined' || !regenerateButtonRef.current) {
   return;
  }

  const buttonRect = regenerateButtonRef.current.getBoundingClientRect();
  const centerX = buttonRect.left + buttonRect.width / 2;
  const clampedCenterX = Math.min(
   window.innerWidth - regenerateTooltipWidth / 2 - 16,
   Math.max(regenerateTooltipWidth / 2 + 16, centerX)
  );

  const desiredTop = buttonRect.bottom + 14;
  const clampedTop = Math.min(window.innerHeight - 32, desiredTop);

  setRegenerateTooltipPosition({
   left: clampedCenterX,
   top: clampedTop
  });
 }, [regenerateTooltipWidth]);

 useEffect(() => {
  if (!isRegenerateTooltipVisible) {
   return;
  }

  updateRegenerateTooltipPosition();
  const handleReposition = () => updateRegenerateTooltipPosition();

  window.addEventListener('scroll', handleReposition, true);
  window.addEventListener('resize', handleReposition);

  return () => {
   window.removeEventListener('scroll', handleReposition, true);
   window.removeEventListener('resize', handleReposition);
  };
 }, [isRegenerateTooltipVisible, updateRegenerateTooltipPosition]);
 const planPositionLabel = planContext ? `Problem ${planContext.index + 1} of ${planContext.total}` : null;
 const derivedPlanStatus = planContext
  ? planContext.isCompleted
   ? 'Completed'
   : planContext.isInProgress
    ? 'In Progress'
    : 'Not Started'
  : null;
 const planStatusLabel = planContext
  ? `${derivedPlanStatus}${planContext.isBookmarked ? ' • Bookmarked' : ''}`
  : null;

 const handleRegenerateClick = () => {
  if (!planContext?.onRegenerate) {
   return;
  }

  const confirmReset = window.confirm(
   'This operation will overwrite the saved data and then reset the state of the problem. All progress made in your code will be lost. Continue?'
  );

 if (!confirmReset) {
  return;
 }

 planContext.onRegenerate();
 setIsRegenerateTooltipVisible(false);
};

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
  if (isLoading || !problem || !problem.title) {
    setTypedText("");
    setTypingComplete(false);
    setShowEditor(false);
    return;
  }

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

  // Show content immediately - no streaming
  setTypedText(fullTextContent);
  setTypingComplete(true);
  setShowEditor(true);
 }, [problem, isLoading]);
 
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

  // Limit test cases for submission to improve performance
  const submitTestCases = problem.testCases.slice(0, maxSubmitTestCases);

  executeCodeAndPoll({
   code,
   language: codeDetails.language,
   boilerplateCode: codeDetails.boilerplateCode,
   testCases: submitTestCases,
   onResults: r => {
     // Don't show results in editor on submit - navigate directly to results page
     if (r.passed) {
       onSubmit(code, r);
     } else {
       // Only show results in editor if submission failed
       commonExecutionHandler(r);
     }
   },
   onError: (errorMsg, submissionId) => commonErrorHandler(errorMsg, submissionId, submitTestCases.length),
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
    case 'title': return s.content.length > 0 ? <h2 key={`s-${idx}`} className="text-2xl font-bold font-playfair mt-4 mb-2">{renderTextWithBackticks(s.content.join('\n'), `s-${idx}-title`)}</h2> : null;
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
    case 'leetcode': return s.content.length > 0 && problem.leetcodeUrl ? <div key={`s-${idx}`} className="mt-8 text-sm text-content-muted/70"><a href={problem.leetcodeUrl} target="_blank" rel="noopener noreferrer" className="hover:text-mint transition-colors">{renderTextWithBackticks(s.content[0], `s-${idx}-leetcode`)}</a></div> : null;
    default: // paragraph
     return s.content.length > 0 && s.content.some(c=>c.trim()!=='') ? 
      <div key={`s-${idx}`} className="mt-2">{s.content.map((l, i) => 
       <p key={`p-${i}`} className="mb-2">{renderTextWithBackticks(l, `s-${idx}-p-${i}`)}</p>
      )}</div> : null;
   }
  });
 };

 const resultsToShow = useMemo(() => {
  if (!executionResults?.testCaseResults) return [];

  if (lastActionType === 'run') {
    return executionResults.testCaseResults;
  }

  if (lastActionType === 'submit' && executionResults?.passed) {
    return [];
  }

  if (lastActionType === 'submit') {
    // Show ONLY the first failed test case
    const firstFailed = executionResults.testCaseResults.find(tc => !tc.passed);
    return firstFailed ? [firstFailed] : [];
  }

  return [];
 }, [executionResults, lastActionType]);

 const showResultsPanel = executionResults && (isLoadingRun || isLoadingSubmit || resultsToShow.length > 0 || !!executionResults.error || (lastActionType === 'submit' && executionResults.passed));

 const handleCodeChange = (newCode: string) => {
  setCode(newCode);
  if (onCodeChange) {
   onCodeChange(newCode);
  }
 };

 return (
  <div className="min-h-[calc(100vh-3.5rem)] md:h-[calc(100vh-3.5rem)] md:max-h-[calc(100vh-3.5rem)] flex flex-col bg-surface dark:bg-surface md:overflow-hidden">
   {/* Blind75 Back Button Toolbar */}
   {onReturnToBlind75 && !planContext && (
    <div className="border-b border-black/5 bg-white/70 dark:bg-neutral-900/80 backdrop-blur-md px-4 py-3">
     <button
      onClick={onReturnToBlind75}
      className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-content shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-neutral-900 dark:text-content-subtle dark:hover:bg-neutral-800"
     >
      <ArrowLeft className="h-3.5 w-3.5" />
      Back to List
     </button>
    </div>
   )}

   {/* Study Plan Toolbar */}
   {planContext && (
    <div className="border-b border-black/5 bg-white/70 dark:bg-neutral-900/80 backdrop-blur-md px-4 py-3">
     <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-col gap-2">
       <div className="text-xs font-semibold uppercase tracking-wide text-content-muted dark:text-content-subtle ml-1">
        Study Plan Mode
       </div>
       <div className="flex flex-wrap items-center gap-2">
        {planPositionLabel && (
         <span className="inline-flex items-center rounded-full bg-mint-100 dark:bg-mint-900/30 px-2 py-0.5 text-xs font-medium text-mint-700 dark:text-mint-300">
          {planPositionLabel}
         </span>
        )}
        {planStatusLabel && (
         <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 text-xs font-medium text-content-muted dark:text-content-subtle">
          {planStatusLabel}
         </span>
        )}
        {planContext.day && (
         <span className="text-xs text-content-muted dark:text-content-subtle">
          Day {planContext.day}
         </span>
        )}
       </div>
      </div>
      <div className="flex flex-wrap gap-2">
       <button
        onClick={planContext.onReturnToPlan}
        className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-content shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-neutral-900 dark:text-content-subtle dark:hover:bg-neutral-800"
       >
        <BookOpenCheck className="h-3.5 w-3.5" />
        View Plan
       </button>
       <button
        onClick={planContext.onToggleBookmark}
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
         planContext.isBookmarked
          ? 'border-amber-400 bg-amber-50 text-amber-700 dark:border-amber-500 dark:bg-amber-900/30 dark:text-amber-300'
          : 'border-slate-200 bg-white text-content hover:bg-slate-50 dark:border-slate-700 dark:bg-neutral-900 dark:text-content-subtle dark:hover:bg-neutral-800'
        }`}
       >
        {planContext.isBookmarked ? (
         <BookmarkCheck className="h-3.5 w-3.5" />
        ) : (
         <Bookmark className="h-3.5 w-3.5" />
        )}
        {planContext.isBookmarked ? 'Bookmarked' : 'Bookmark'}
       </button>
       <button
        onClick={() => planContext.onToggleCompletion?.()}
        disabled={!planContext.onToggleCompletion}
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
         planContext.isCompleted
          ? 'border-emerald-400 bg-emerald-50 text-emerald-700 dark:border-emerald-500 dark:bg-emerald-900/30 dark:text-emerald-300'
          : 'border-slate-200 bg-white text-content hover:bg-slate-50 dark:border-slate-700 dark:bg-neutral-900 dark:text-content-subtle dark:hover:bg-neutral-800'
        }`}
       >
        <CheckCircle2 className="h-3.5 w-3.5" />
        {planContext.isCompleted ? 'Marked Done' : 'Mark Done'}
       </button>
       <button
        ref={regenerateButtonRef}
        onClick={handleRegenerateClick}
        className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-content hover:bg-slate-50 dark:border-slate-700 dark:bg-neutral-900 dark:text-content-subtle dark:hover:bg-neutral-800 disabled:opacity-50"
        disabled={!planContext.onRegenerate}
        aria-describedby="regenerate-tooltip"
        onMouseEnter={() => {
         setIsRegenerateTooltipVisible(true);
         updateRegenerateTooltipPosition();
        }}
        onMouseLeave={() => setIsRegenerateTooltipVisible(false)}
        onFocus={() => {
         setIsRegenerateTooltipVisible(true);
         updateRegenerateTooltipPosition();
        }}
        onBlur={() => setIsRegenerateTooltipVisible(false)}
       >
        <RotateCcwIcon className="h-3.5 w-3.5" />
        Regenerate
       </button>
       <div className="flex items-center overflow-hidden rounded-full border border-slate-200 bg-white dark:border-slate-700 dark:bg-neutral-900">
        <button
         onClick={() => planContext.onPrev?.()}
         disabled={!planContext.hasPrev}
         className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-content-muted transition disabled:opacity-40 dark:text-content-subtle"
        >
         <ArrowLeft className="h-3.5 w-3.5" />
         Prev
        </button>
        <div className="h-full w-px bg-slate-200 dark:bg-slate-700" />
        <button
         onClick={() => planContext.onNext?.()}
         disabled={!planContext.hasNext}
         className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-content-muted transition disabled:opacity-40 dark:text-content-subtle"
        >
         Next
         <ArrowRight className="h-3.5 w-3.5" />
        </button>
       </div>
      </div>
     </div>
    </div>
   )}
   <div className="flex flex-1 flex-col md:flex-row md:overflow-hidden">
    <div className="w-full md:w-1/2 md:h-full flex flex-col bg-white dark:bg-neutral-850 border-r border-gray-200 dark:border-neutral-700">
     <div className="flex-1 md:overflow-y-auto">
      <div className="px-6 pt-3 pb-6">
       {isLoading ? (
        <ThinkingIndicator states={THINKING_STATES} />
       ) : problem && problem.title ? (
        <div className="prose dark:prose-invert max-w-none">
         {formatTypedText()}
        </div>
       ) : (
        <div className="flex items-center justify-center h-64 md:h-full">
         <p className="text-lg text-content-muted">Loading problem...</p>
        </div>
       )}
      </div>
     </div>
    </div>
    <div className={`w-full md:w-1/2 md:h-full flex flex-col bg-white dark:bg-neutral-900 transition-all duration-500 transform ${showEditor ? 'translate-x-0 opacity-100' : 'md:translate-x-8 md:opacity-0'}`}>
     <div className="flex-shrink-0 p-3 bg-white dark:bg-neutral-800 flex justify-between items-center border-b border-gray-200 dark:border-neutral-700"><div className="flex items-center"><h3 className="font-medium text-button-foreground">Solution Editor</h3><div className="ml-3 flex items-center text-xs text-content-muted/70 border-l border-neutral-600 pl-3"><InfoIcon className="h-3 w-3 mr-1 flex-shrink-0" /><span>{codeDetails?.language || 'python'}</span><div className="ml-2 text-xs text-content-muted/70">(support for more languages coming soon)</div></div></div><button onClick={handleReset} disabled={isLoadingRun || isLoadingSubmit || isLoading} className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[13px] font-medium text-button-foreground bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 rounded-[12px] shadow-[0_1px_2px_rgba(0,0,0,0.3),0_1px_20px_rgba(255,255,255,0.1)_inset] hover:shadow-[0_1px_3px_rgba(0,0,0,0.4),0_2px_30px_rgba(255,255,255,0.15)_inset] active:scale-[0.98] transition-all duration-200 disabled:opacity-40"><RotateCcwIcon className="w-4 h-4" /> Reset</button></div>
     <div className="flex-1 flex flex-col md:overflow-hidden">
      <div className={`${showResultsPanel ? 'h-96 md:h-3/4' : 'h-96 md:h-full'} bg-white dark:bg-neutral-900 md:overflow-hidden transition-all duration-300`}>
       {isLoading || !codeDetails ? (
        <div className="flex items-center justify-center h-full">
         <div className="text-center text-content-muted">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-mint-600 mb-2"></div>
          <p>Loading editor...</p>
         </div>
        </div>
       ) : (
        <CodeEditor code={code} language={codeDetails.language || 'python'} onChange={handleCodeChange} height="100%" width="100%"/>
       )}
      </div>
      {showResultsPanel && executionResults && (
       <div className={'h-64 md:h-1/4 flex-shrink-0 border-t border-neutral-700 bg-gray-50 dark:bg-neutral-800 overflow-y-auto p-3 transition-all duration-300 opacity-100'}>
        {(isLoadingRun || isLoadingSubmit) ? (
          <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 dark:border-white"></div><p className="ml-3 text-sm text-button-foreground">{isLoadingRun ? "Running sample tests..." : "Submitting and running all tests..."}</p></div>
        ) : (
         <div>
          <h4 className="text-sm font-medium text-button-foreground mb-1">
           Results: <span className={`ml-1 ${executionResults.passed ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{executionResults.testCasesPassed}/{executionResults.testCasesTotal} Passed</span>
           {lastActionType === 'submit' && executionResults.passed && <span className="ml-2 text-green-600 dark:text-green-400">- All tests passed!</span>}
           {lastActionType === 'submit' && !executionResults.passed && resultsToShow.length === 1 &&
            <span className="ml-2 text-xs text-content-muted/60">(showing first failure)</span>
           }
          </h4>
          {executionResults.error && <p className="text-xs text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30 p-1 rounded my-1">Error: {executionResults.error}</p>}
          {(executionResults.testCaseResults.length > 0 || !executionResults.error) && (
            <div className="text-xs text-content-muted mb-1">
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
                <div key={`tc-${originalIndex}-${tcResult.status}-${tcResult.testCase.stdin}`} className={`p-1.5 rounded text-xs ${tcResult.passed ? 'bg-green-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/25'} text-content`}>
                <p className="font-mono font-medium">
                  Test Case #{originalIndex !== -1 ? originalIndex + 1 : 'Custom'}:
                  <span className={tcResult.passed ? 'text-green-600 dark:text-emerald-300' : 'text-red-600 dark:text-red-400'}>{tcResult.passed ? "Passed" : "Failed"}</span>
                  ({tcResult.status})
                  {lastActionType === 'submit' && !tcResult.passed &&
                    <span className="ml-2 text-xs text-amber-700 dark:text-amber-400">(first failure)</span>
                  }
                </p>
                <p className="font-mono mt-0.5"><span className="text-content-muted">Input:</span> <span className="text-content-subtle">{typeof tcResult.testCase.stdin === 'object' ? JSON.stringify(tcResult.testCase.stdin) : String(tcResult.testCase.stdin)}</span></p>
                <p className="font-mono"><span className="text-content-muted">Expected:</span> <span className="text-content-subtle">{typeof tcResult.testCase.expectedStdout === 'object' ? JSON.stringify(tcResult.testCase.expectedStdout) : String(tcResult.testCase.expectedStdout)}</span></p>

                { (lastActionType === 'run' || !tcResult.passed) &&
                 <p className={`font-mono ${!tcResult.passed ? 'text-content-muted' : 'text-content-muted'}`}>
                  <span className="text-content-muted">Actual:</span> <span className={`${!tcResult.passed ? 'text-red-600 dark:text-red-300' : 'text-green-600 dark:text-green-400'}`}>{typeof tcResult.actualOutput === 'object' ? JSON.stringify(tcResult.actualOutput) : String(tcResult.actualOutput)}</span>
                 </p>
                }

                {tcResult.error && <p className="font-mono text-red-700 dark:text-red-300">Detail: {tcResult.error}</p>}
                {/* {tcResult.stdout && <pre className="font-mono text-xs text-content-subtle bg-neutral-700/50 p-1 my-0.5 rounded max-h-20 overflow-y-auto whitespace-pre-wrap">Stdout: {tcResult.stdout}</pre>} */}
                {tcResult.stderr && <pre className="font-mono text-xs text-red-700 dark:text-red-300 bg-neutral-200/50 dark:bg-neutral-700/50 p-1 my-0.5 rounded max-h-20 overflow-y-auto whitespace-pre-wrap">Stderr: {tcResult.stderr}</pre>}
                </div>
              );
            })}
            </div>
          )}
          {/* Message if submitting and all passed, but no specific failed cases to show (because resultsToShow is empty) */}
          {lastActionType === 'submit' && executionResults.passed && resultsToShow.length === 0 &&
            <p className="mt-2 text-sm text-green-600 dark:text-green-400 flex items-center justify-center h-full">
              All submission tests passed successfully!
            </p>
          }
          {lastActionType === 'run' && executionResults.passed && executionResults.testCaseResults.length > 0 && resultsToShow.length > 0 && resultsToShow.every(tc => tc.passed) && <p className="mt-2 text-sm text-green-600 dark:text-green-400">All sample tests passed!</p>}
         </div>
        )}
       </div>
      )}
     </div>
     <div className="flex-shrink-0 p-3 bg-white dark:bg-neutral-800 border-t border-gray-200 dark:border-neutral-700 flex justify-between items-center">
      {/* Left side: Save status indicator */}
      <div className="flex-shrink-0 min-w-[80px]">
       {saveStatus === 'saving' && (
        <span className="text-xs text-content-muted">Saving...</span>
       )}
       {saveStatus === 'saved' && lastSaveTime && (
        <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
         <Check className="h-3.5 w-3.5" />
         <span>Saved</span>
        </div>
       )}
       {saveStatus === 'error' && (
        <div className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
         <AlertCircle className="h-3.5 w-3.5" />
         <span>Error</span>
        </div>
       )}
      </div>

      {/* Right side: Action buttons */}
      <div className="flex space-x-3">
       <button
        onClick={handleRun}
        disabled={isLoadingRun || isLoadingSubmit || isLoading}
        className="inline-flex items-center gap-2 px-3.5 py-1.5 text-[13px] font-medium text-gray-700 dark:text-slate-100 bg-white dark:bg-slate-600 hover:bg-gray-50 dark:hover:bg-slate-500 border border-gray-300 dark:border-slate-500 rounded-[10px] transition-all duration-200 active:scale-[0.98] disabled:opacity-40"
       >
        {isLoadingRun && (
         <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-gray-700 dark:border-slate-100"></div>
        )}
        Run
       </button>
       <button
        onClick={handleSubmit}
        disabled={isLoadingRun || isLoadingSubmit || isLoading}
        className="inline-flex items-center gap-2 px-3.5 py-1.5 text-[13px] font-medium text-button-foreground bg-button-600 hover:bg-button-500 border border-button-700 rounded-[10px] backdrop-blur-xl shadow-[0_1px_2px_rgba(0,0,0,0.15),0_1px_20px_rgba(255,255,255,0.25)_inset] hover:shadow-[0_1px_3px_rgba(0,0,0,0.2),0_2px_30px_rgba(255,255,255,0.35)_inset] active:scale-[0.98] transition-all duration-200 disabled:opacity-40"
       >
        {isLoadingSubmit && (
         <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>
        )}
        Submit
       </button>
       {onSolveAnother && (
        <button
         onClick={() => {
          // Save current progress before navigating away
          if (onCodeChange) {
           onCodeChange(code);
          }
          onSolveAnother();
         }}
         disabled={isLoadingRun || isLoadingSubmit}
         className="inline-flex items-center gap-2 px-5 py-2.5 text-[15px] font-medium text-content bg-white/90 hover:bg-white border border-black/8 rounded-[14px] backdrop-blur-xl shadow-[0_1px_2px_rgba(0,0,0,0.05),0_1px_20px_rgba(255,255,255,0.3)_inset] hover:shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_30px_rgba(255,255,255,0.4)_inset] active:scale-[0.98] transition-all duration-200 disabled:opacity-40"
        >
         <RotateCcwIcon className="w-4 h-4" />
         Solve Another Problem
        </button>
      )}
      </div>
    </div>
   </div>
  </div>
  {isBrowser &&
    isRegenerateTooltipVisible &&
    createPortal(
     <div
      id="regenerate-tooltip"
      role="tooltip"
      className="pointer-events-none fixed z-[999]"
      style={{
       left: regenerateTooltipPosition.left,
       top: regenerateTooltipPosition.top,
       width: regenerateTooltipWidth,
       transform: 'translate(-50%, 0)'
      }}
     >
      <div className="relative rounded-2xl border border-emerald-200/70 bg-white/95 px-4 py-3 text-[11px] text-slate-700 shadow-xl ring-1 ring-emerald-100/50 backdrop-blur-sm dark:border-emerald-700/60 dark:bg-neutral-950/95 dark:text-slate-200 dark:ring-emerald-800/50">
       <div className="absolute left-1/2 -top-1.5 h-3 w-3 -translate-x-1/2 rotate-45 border border-emerald-200/70 bg-white/95 dark:border-emerald-700/60 dark:bg-neutral-950/95" />
       <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-300">
        Prompt Remix
       </div>
       <p className="mt-2 text-[12px] leading-5 text-slate-700 dark:text-slate-200">
        Let the AI reimagine this problem.
       </p>
      </div>
     </div>,
     document.body
    )}
 </div>
);
}
