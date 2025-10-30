import { useEffect, useState } from 'react';

interface ThinkingIndicatorProps {
  states: string[];
  title?: string;
  typingSpeed?: number; // Speed for typing effect in ms
  pauseDuration?: number; // Pause after typing complete before deleting
  deletingSpeed?: number; // Speed for deleting effect in ms
  alignment?: 'start' | 'center';
  onStateChange?: (index: number) => void;
  titleTone?: 'default' | 'subtle';
}

export function ThinkingIndicator({
  states,
  title,
  typingSpeed = 80,
  pauseDuration = 1500,
  deletingSpeed = 40,
  alignment = 'start',
  onStateChange,
  titleTone = 'default'
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

  useEffect(() => {
    onStateChange?.(currentStateIndex);
  }, [currentStateIndex, onStateChange]);

  const alignmentClasses = alignment === 'center'
    ? 'items-center text-center'
    : 'items-start text-left';
  const textAlignmentClasses = alignment === 'center'
    ? 'text-center'
    : 'text-left';
  const textValue = displayedText || '\u00a0';
  const titleClasses = titleTone === 'subtle'
    ? 'w-full text-lg font-normal text-content-muted dark:text-content-subtle font-playfair'
    : 'w-full text-2xl font-bold text-content dark:text-content-subtle font-playfair';

  return (
    <div className={`flex flex-col gap-4 ${alignmentClasses}`}>
      {title && (
        <h2 className={titleClasses}>
          {title}
        </h2>
      )}

      <div className="w-full">
        <span
          className={`block min-h-[1.75rem] sm:min-h-[2rem] text-sm sm:text-base leading-snug text-content-muted dark:text-content-subtle ${textAlignmentClasses}`}
          aria-live="polite"
          role="status"
        >
          {textValue}
          <span
            className="ml-0.5 inline-block h-4 w-0.5 align-middle rounded-full bg-mint-600 dark:bg-mint-400 sm:h-5 animate-blink"
            aria-hidden="true"
          />
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
