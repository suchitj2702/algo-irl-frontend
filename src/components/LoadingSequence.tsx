import { useEffect, useState } from 'react';
import { loadingPrompts } from '../utils/loadingPrompts';
import { MAX_LOADING_DURATION_SECONDS } from './ProblemGenerator';

interface LoadingSequenceProps {
  company: string;
  maxTotalDuration?: number; // in seconds - maximum time for loading sequence
  onComplete?: () => void; // Callback when loading is complete
  forceComplete?: boolean; // Force completion when response is received
}

// Function to generate step durations with quicker initial steps
const generateStepDurations = (numSteps: number, maxTotalDurationSeconds: number): number[] => {
  const maxTotalDurationMs = maxTotalDurationSeconds * 1000;
  
  // First 3 steps should take 1/3 of total time, remaining steps get 2/3
  const quickStepsCount = Math.min(3, numSteps);
  const slowStepsCount = numSteps - quickStepsCount;
  
  const quickStepsTimeRatio = 1/3; // First 3 steps get 1/3 of total time
  const quickStepsTimeMs = maxTotalDurationMs * quickStepsTimeRatio;
  const slowStepsTimeMs = maxTotalDurationMs * (1 - quickStepsTimeRatio);
  
  // Generate quick step durations (evenly distributed within the allocated time)
  const quickStepDurations = Array.from({ length: quickStepsCount }, () => 
    quickStepsTimeMs / quickStepsCount + (Math.random() - 0.5) * (quickStepsTimeMs / quickStepsCount * 0.3) // ±15% variation
  );
  
  // Generate slower step durations for remaining steps
  const slowStepDurations = slowStepsCount > 0 
    ? Array.from({ length: slowStepsCount }, () => 
        slowStepsTimeMs / slowStepsCount + (Math.random() - 0.5) * (slowStepsTimeMs / slowStepsCount * 0.3) // ±15% variation
      )
    : [];
  
  // Ensure all durations are at least 500ms and adjust to use exactly the total time
  const allDurations = [...quickStepDurations, ...slowStepDurations];
  const currentTotal = allDurations.reduce((sum, d) => sum + d, 0);
  const adjustment = maxTotalDurationMs / currentTotal;
  
  return allDurations.map(d => Math.max(500, d * adjustment));
};

export function LoadingSequence({
  company,
  maxTotalDuration = MAX_LOADING_DURATION_SECONDS,
  onComplete,
  forceComplete = false
}: LoadingSequenceProps) {
  const [selectedTheme, setSelectedTheme] = useState<{ theme: string; sequence: string[] } | null>(null);
  const [steps, setSteps] = useState<string[]>([]);
  const [stepDurations, setStepDurations] = useState<number[]>([]);

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [progress, setProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    // Select a random theme and prepare its steps
    const randomIndex = Math.floor(Math.random() * loadingPrompts.length);
    const theme = loadingPrompts[randomIndex];
    const processedSequence = theme.sequence.map(step => step.replace('[company]', company));
    
    setSelectedTheme(theme);
    setSteps(processedSequence);
    setStepDurations(generateStepDurations(processedSequence.length, maxTotalDuration));
  }, [company, maxTotalDuration]);

  // Handle force completion when response is received
  useEffect(() => {
    if (forceComplete && !isCompleted) {
      // Complete all remaining steps immediately
      setCompletedSteps(Array.from({ length: steps.length }, (_, i) => i));
      setCurrentStepIndex(steps.length);
      setProgress(100);
      setIsCompleted(true);
      if (onComplete) {
        onComplete();
      }
    }
  }, [forceComplete, isCompleted, steps.length, onComplete]);

  useEffect(() => {
    if (steps.length === 0 || stepDurations.length === 0 || currentStepIndex >= steps.length || isCompleted || forceComplete) {
      return;
    }

    const currentStepDuration = stepDurations[currentStepIndex];

    const timer = setTimeout(() => {
      if (currentStepIndex < steps.length - 1) {
        setCompletedSteps(prev => [...prev, currentStepIndex]);
        setCurrentStepIndex(prevIndex => prevIndex + 1);
        // Calculate progress based on the number of steps completed
        setProgress(((currentStepIndex + 1) / steps.length) * 100);
      } else {
        setCompletedSteps(prev => [...prev, currentStepIndex]);
        setProgress(100);
        setIsCompleted(true);
        if (onComplete) {
          onComplete();
        }
      }
    }, currentStepDuration);

    return () => clearTimeout(timer);
  }, [currentStepIndex, steps, stepDurations, isCompleted, forceComplete, onComplete]);

  if (!selectedTheme) {
    return <div>Loading theme...</div>; // Or some other placeholder
  }

  return <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-2xl">
        <div className="mb-8 relative">
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-indigo-500 to-brand-primary rounded-full transition-all duration-700 ease-in-out" style={{
            width: `${progress}%`
          }}></div>
          </div>
          <div className="absolute -top-8 right-0 text-sm text-neutral-500 dark:text-neutral-400">
            {Math.round(progress)}%
          </div>
        </div>
        <div className="space-y-6">
          {steps.map((step, index) => {
          // Only show steps up to and including the current step
          // And also show the next step if the current one is almost done (optional, for smoother transition)
          if (index > currentStepIndex && !(index === currentStepIndex + 1 && progress > (currentStepIndex + 0.8) * (100 / steps.length) )) {
             return null;
          }

          const isStepCompleted = completedSteps.includes(index);
          // Current step is the one at currentStepIndex that is not yet marked completed
          const isCurrentStep = index === currentStepIndex && !isStepCompleted && progress < 100;
          
          return <div key={index} className={`transition-all duration-500 flex items-start ${isStepCompleted ? 'text-neutral-750 dark:text-white' : isCurrentStep ? 'animate-pulse text-neutral-600 dark:text-neutral-400' : 'text-neutral-400 dark:text-neutral-600'}`}>
                <div className={`mr-3 p-1 rounded-full ${isStepCompleted ? 'bg-green-500/20 text-green-500 dark:text-green-400' : isCurrentStep ? 'bg-indigo-500/20 text-indigo-500 dark:text-indigo-400 animate-pulse' : 'bg-gray-200 dark:bg-gray-700'}`}>
                  {isStepCompleted ? <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg> : isCurrentStep ? <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg> : <div className="h-4 w-4"></div>}
                </div>
                <p className="text-lg font-medium mt-0.5">{step}</p>
              </div>;
        })}
        </div>
        {!isCompleted && (
          <div className="mt-12 flex justify-center">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-t-indigo-600 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
              <div className="absolute inset-0 rounded-full border-4 border-t-transparent border-r-indigo-400 border-b-transparent border-l-transparent animate-spin" style={{
              animationDuration: '1.5s'
            }}></div>
              <div className="absolute inset-0 rounded-full border-4 border-t-transparent border-r-transparent border-b-brand-primary border-l-transparent animate-spin" style={{
              animationDuration: '2s'
            }}></div>
            </div>
          </div>
        )}
      </div>
    </div>;
}