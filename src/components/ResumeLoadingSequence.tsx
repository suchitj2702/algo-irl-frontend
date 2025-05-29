import { useEffect, useState } from 'react';

interface ResumeLoadingSequenceProps {
  onComplete?: () => void;
}

export function ResumeLoadingSequence({ onComplete }: ResumeLoadingSequenceProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const totalDuration = 2000; // 2 seconds total
    const interval = 50; // Update every 50ms
    const increment = 100 / (totalDuration / interval);

    const timer = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + increment;
        if (newProgress >= 100) {
          clearInterval(timer);
          // Complete after reaching 100%
          setTimeout(() => {
            if (onComplete) {
              onComplete();
            }
          }, 300);
          return 100;
        }
        return newProgress;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] p-4 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-2xl">
        <div className="mb-8 relative">
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-brand-primary rounded-full transition-all duration-100 ease-out" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="absolute -top-8 right-0 text-sm text-neutral-500 dark:text-neutral-400">
            {Math.round(progress)}%
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="transition-all duration-500 flex items-start animate-pulse text-neutral-600 dark:text-neutral-400">
            <div className="mr-3 p-1 rounded-full bg-indigo-500/20 text-indigo-500 dark:text-indigo-400 animate-pulse">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <p className="text-lg font-medium mt-0.5">Retrieving your solution...</p>
          </div>
        </div>

        <div className="mt-12 flex justify-center">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-t-indigo-600 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-transparent border-r-indigo-400 border-b-transparent border-l-transparent animate-spin" style={{ animationDuration: '1.5s' }}></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-transparent border-r-transparent border-b-brand-primary border-l-transparent animate-spin" style={{ animationDuration: '2s' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
} 