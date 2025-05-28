import { ArrowRightIcon } from 'lucide-react';

interface IntroSectionProps {
  onStartClick: () => void;
}

export function IntroSection({
  onStartClick
}: IntroSectionProps) {
  return <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)] px-4">
      <div className="text-center max-w-4xl mx-auto">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-gray-900 dark:text-white mb-6">
          Algorithms In Real Life
        </h1>
        <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed">
          Practice for your coding interviews like never before
        </p>
        <button onClick={onStartClick} className="inline-flex items-center justify-center px-8 py-3 text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl">
          <span className="flex items-center">
            Let's Go
            <ArrowRightIcon className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </button>
      </div>
    </div>;
}