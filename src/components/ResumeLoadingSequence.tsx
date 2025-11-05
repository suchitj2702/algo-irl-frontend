import { useEffect, useState } from 'react';

interface ResumeLoadingSequenceProps {
 onComplete?: () => void;
 isDataLoaded?: boolean; // New prop to indicate when actual data is loaded
 minLoadingTime?: number; // Minimum time to show loading (default 500ms)
}

export function ResumeLoadingSequence({ 
 onComplete, 
 isDataLoaded = false,
 minLoadingTime = 500 
}: ResumeLoadingSequenceProps) {
 const [progress, setProgress] = useState(0);
 const [minTimeElapsed, setMinTimeElapsed] = useState(false);

 // Handle minimum loading time
 useEffect(() => {
  const minTimer = setTimeout(() => {
   setMinTimeElapsed(true);
  }, minLoadingTime);

  return () => clearTimeout(minTimer);
 }, [minLoadingTime]);

 // Handle progress animation and completion
 useEffect(() => {
  const interval = 10; // Update every 50ms
  
  const timer = setInterval(() => {
   setProgress(prev => {
    // If data is loaded and minimum time has elapsed, complete quickly
    if (isDataLoaded && minTimeElapsed) {
     const newProgress = Math.min(prev + 15, 100); // Speed up to completion
     if (newProgress >= 100) {
      clearInterval(timer);
      // Complete after reaching 100%
      setTimeout(() => {
       if (onComplete) {
        onComplete();
       }
      }, 200);
      return 100;
     }
     return newProgress;
    }
    
    // If data is not loaded yet, slow down progress as we approach 100%
    let increment;
    if (prev < 70) {
     increment = 4; // Normal speed for first 70%
    } else if (prev < 90) {
     increment = 1.5; // Slow down significantly
    } else {
     increment = 0.3; // Very slow near the end to wait for data
    }
    
    const newProgress = Math.min(prev + increment, isDataLoaded ? 100 : 95);
    
    // Only complete if data is loaded and we've reached 100%
    if (newProgress >= 100 && isDataLoaded && minTimeElapsed) {
     clearInterval(timer);
     setTimeout(() => {
      if (onComplete) {
       onComplete();
      }
     }, 200);
     return 100;
    }
    
    return newProgress;
   });
  }, interval);

  return () => clearInterval(timer);
 }, [onComplete, isDataLoaded, minTimeElapsed]);

 return (
  <div className="flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] p-4 bg-surface dark:bg-surface">
   <div className="w-full max-w-2xl">
    <div className="mb-8 relative">
     <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
      <div
       className="h-full bg-gradient-to-r from-mint-500 to-mint-600 rounded-full transition-all duration-100 ease-out"
       style={{ width: `${progress}%` }}
      ></div>
     </div>
     <div className="absolute -top-8 right-0 text-sm text-content-muted dark:text-content-subtle">
      {Math.round(progress)}%
     </div>
    </div>
    
    <div className="space-y-6">
     <div className="transition-all duration-500 flex items-start animate-pulse text-content-muted dark:text-content-subtle">
      <div className="mr-3 p-1 rounded-full bg-mint-500/20 text-mint-600 dark:text-mint-300 animate-pulse">
       <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
       </svg>
      </div>
      <p className="text-lg font-medium mt-0.5">
       {progress < 70 ? "Retrieving your solution..." : 
        progress < 90 ? "Loading problem data..." : 
        isDataLoaded ? "Almost ready..." : "Waiting for server response..."}
      </p>
     </div>
    </div>

    <div className="mt-12 flex justify-center">
     <div className="relative w-16 h-16">
      <div className="absolute inset-0 rounded-full border-4 border-t-mint-600 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
      <div className="absolute inset-0 rounded-full border-4 border-t-transparent border-r-mint-400 border-b-transparent border-l-transparent animate-spin" style={{ animationDuration: '1.5s' }}></div>
      <div className="absolute inset-0 rounded-full border-4 border-t-transparent border-r-transparent border-b-mint-400 border-l-transparent animate-spin" style={{ animationDuration: '2s' }}></div>
     </div>
    </div>
   </div>
  </div>
 );
} 
