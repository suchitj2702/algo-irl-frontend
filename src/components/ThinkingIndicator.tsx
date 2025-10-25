import { useEffect, useState } from 'react';

interface ThinkingIndicatorProps {
  states: string[];
  title?: string;
  typingSpeed?: number; // Speed for typing effect in ms
  pauseDuration?: number; // Pause after typing complete before deleting
  deletingSpeed?: number; // Speed for deleting effect in ms
}

export function ThinkingIndicator({
  states,
  title,
  typingSpeed = 80,
  pauseDuration = 1500,
  deletingSpeed = 40
}: ThinkingIndicatorProps) {
  const [currentStateIndex, setCurrentStateIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const currentState = states[currentStateIndex];

    if (isPaused) {
      // Pause after typing is complete
      const pauseTimer = setTimeout(() => {
        setIsPaused(false);
        setIsDeleting(true);
      }, pauseDuration);
      return () => clearTimeout(pauseTimer);
    }

    if (isDeleting) {
      // Delete characters
      if (displayedText.length > 0) {
        const deleteTimer = setTimeout(() => {
          setDisplayedText(displayedText.slice(0, -1));
        }, deletingSpeed);
        return () => clearTimeout(deleteTimer);
      } else {
        // Move to next state after deleting
        setIsDeleting(false);
        setCurrentStateIndex((prev) => (prev + 1) % states.length);
      }
    } else {
      // Type characters
      if (displayedText.length < currentState.length) {
        const typingTimer = setTimeout(() => {
          setDisplayedText(currentState.slice(0, displayedText.length + 1));
        }, typingSpeed);
        return () => clearTimeout(typingTimer);
      } else {
        // Pause after typing is complete
        setIsPaused(true);
      }
    }
  }, [currentStateIndex, displayedText, isDeleting, isPaused, states, typingSpeed, pauseDuration, deletingSpeed]);

  return (
    <div className="p-6">
      {title && (
        <h2 className="text-2xl font-bold mb-6 text-content dark:text-content-subtle font-playfair">
          {title}
        </h2>
      )}

      <div className="inline-flex items-center">
        <span className="text-base font-medium text-content-muted dark:text-content-subtle font-mono">
          {displayedText}
          <span className="inline-block w-0.5 h-5 bg-mint-600 dark:bg-mint-400 ml-0.5 animate-blink" />
        </span>
      </div>

      <style>{`
        @keyframes blink {
          0%, 50% {
            opacity: 1;
          }
          51%, 100% {
            opacity: 0;
          }
        }
        .animate-blink {
          animation: blink 1s infinite;
        }
      `}</style>
    </div>
  );
}
