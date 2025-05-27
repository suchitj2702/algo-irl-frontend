import { useEffect, useState } from 'react';
import { loadingPrompts } from '../utils/loadingPrompts';

interface LoadingSequenceProps {
  company: string;
  minTotalDuration?: number; // in seconds
}

// Function to generate random durations for each step
const generateStepDurations = (numSteps: number, minTotalDurationSeconds: number): number[] => {
  const minTotalDurationMs = minTotalDurationSeconds * 1000;
  let durations = new Array(numSteps).fill(0).map(() => Math.random() * (minTotalDurationMs / numSteps) + (minTotalDurationMs / numSteps / 2)); // Add a base to ensure not too short
  let currentTotalDuration = durations.reduce((sum, d) => sum + d, 0);

  // Adjust durations to meet the minimum total duration
  if (currentTotalDuration < minTotalDurationMs) {
    const diff = minTotalDurationMs - currentTotalDuration;
    const adjustment = diff / numSteps;
    durations = durations.map(d => d + adjustment);
  } else {
    // Optional: if total is already more, you could scale down, or leave as is.
    // For now, we ensure it's *at least* minTotalDuration.
    // To scale down:
    // const scaleFactor = minTotalDurationMs / currentTotalDuration;
    // durations = durations.map(d => d * scaleFactor);
  }
  return durations.map(d => Math.max(500, d)); // Ensure each step is at least 500ms
};

export function LoadingSequence({
  company,
  minTotalDuration = 20 // Default to 20 seconds
}: LoadingSequenceProps) {
  const [selectedTheme, setSelectedTheme] = useState<{ theme: string; sequence: string[] } | null>(null);
  const [steps, setSteps] = useState<string[]>([]);
  const [stepDurations, setStepDurations] = useState<number[]>([]);

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Select a random theme and prepare its steps
    const randomIndex = Math.floor(Math.random() * loadingPrompts.length);
    const theme = loadingPrompts[randomIndex];
    const processedSequence = theme.sequence.map(step => step.replace('[company]', company));
    
    setSelectedTheme(theme);
    setSteps(processedSequence);
    setStepDurations(generateStepDurations(processedSequence.length, minTotalDuration));
  }, [company, minTotalDuration]);

  useEffect(() => {
    if (steps.length === 0 || stepDurations.length === 0 || currentStepIndex >= steps.length) {
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
        // Optionally, call an onComplete callback here
      }
    }, currentStepDuration);

    return () => clearTimeout(timer);
  }, [currentStepIndex, steps, stepDurations]);

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

          const isCompleted = completedSteps.includes(index);
          // Current step is the one at currentStepIndex that is not yet marked completed
          const isCurrentStep = index === currentStepIndex && !isCompleted && progress < 100;
          
          return <div key={index} className={`transition-all duration-500 flex items-start ${isCompleted ? 'text-neutral-750 dark:text-white' : isCurrentStep ? 'animate-pulse text-neutral-600 dark:text-neutral-400' : 'text-neutral-400 dark:text-neutral-600'}`}>
                <div className={`mr-3 p-1 rounded-full ${isCompleted ? 'bg-green-500/20 text-green-500 dark:text-green-400' : isCurrentStep ? 'bg-indigo-500/20 text-indigo-500 dark:text-indigo-400 animate-pulse' : 'bg-gray-200 dark:bg-gray-700'}`}>
                  {isCompleted ? <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg> : isCurrentStep ? <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg> : <div className="h-4 w-4"></div>}
                </div>
                <p className="text-lg font-medium mt-0.5">{step}</p>
              </div>;
        })}
        </div>
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
      </div>
    </div>;
}