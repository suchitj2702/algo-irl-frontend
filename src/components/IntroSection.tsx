import { ArrowRightIcon } from 'lucide-react';

interface IntroSectionProps {
  onStartClick: () => void;
}

export function IntroSection({
  onStartClick
}: IntroSectionProps) {
  return <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
      <div className="text-center max-w-lg px-4">
        <h1 className="text-4xl sm:text-5xl font-medium tracking-tight text-neutral-750 dark:text-white mb-4">
          Algorithms In Real Life
        </h1>
        <p className="text-xl text-neutral-600 dark:text-neutral-300 mb-8 leading-relaxed">
          Practice for your coding interviews like never before
        </p>
        <button onClick={onStartClick} className="inline-flex items-center justify-center px-6 py-2.5 text-base font-medium text-white bg-brand-primary hover:bg-brand-secondary rounded-lg transition-all duration-200 shadow-subtle hover:shadow-medium">
          <span className="flex items-center">
            Let's Go
            <ArrowRightIcon className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </button>
      </div>
    </div>;
}