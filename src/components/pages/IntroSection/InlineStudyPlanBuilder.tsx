import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { RoleFamily, StudyPlanConfig } from '@/types/studyPlan';

const COMPANY_OPTIONS = [
  { id: 'google', label: 'Google' },
  { id: 'meta', label: 'Meta' },
  { id: 'amazon', label: 'Amazon' },
  { id: 'apple', label: 'Apple' },
  { id: 'netflix', label: 'Netflix' },
  { id: 'uber', label: 'Uber' },
  { id: 'bytedance', label: 'ByteDance' },
  { id: 'doordash', label: 'DoorDash' },
  { id: 'airbnb', label: 'Airbnb' },
  { id: 'coinbase', label: 'Coinbase' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'stripe', label: 'Stripe' },
] as const;

const ROLE_OPTIONS = [
  { id: 'backend', label: 'Backend' },
  { id: 'frontend', label: 'Frontend' },
  { id: 'ml', label: 'ML' },
  { id: 'infrastructure', label: 'Infrastructure' },
  { id: 'security', label: 'Security' },
] as const;

interface InlineStudyPlanBuilderProps {
  onAuthModalOpen?: () => void;
}

export const InlineStudyPlanBuilder: React.FC<InlineStudyPlanBuilderProps> = ({
  onAuthModalOpen,
}) => {
  const { user } = useAuth();
  const [selectedCompany, setSelectedCompany] = useState<string>('meta');
  const [selectedRole, setSelectedRole] = useState<RoleFamily>('backend');
  const [timeline, setTimeline] = useState<number>(14);
  const [hoursPerDay, setHoursPerDay] = useState<number>(2);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const validateForm = (): boolean => {
    setError('');

    if (!selectedCompany || !selectedRole || timeline <= 0) {
      setError('Please select company, role, and timeline');
      return false;
    }

    return true;
  };

  const handleGenerateClick = async (): Promise<void> => {
    if (!validateForm()) {
      return;
    }

    const config: StudyPlanConfig = {
      companyId: selectedCompany,
      roleFamily: selectedRole,
      timeline,
      hoursPerDay,
      difficultyPreference: { easy: true, medium: true, hard: true },
      datasetType: 'full',
    };

    if (!user) {
      sessionStorage.setItem('pendingStudyPlanConfig', JSON.stringify(config));
      sessionStorage.setItem('postAuthAction', 'generate-study-plan');
      onAuthModalOpen?.();
      return;
    }

    try {
      setIsGenerating(true);
      setError('');
      if (typeof window === 'undefined') {
        throw new Error('Study plan generation is only available in the browser.');
      }
      const detail = JSON.stringify(config);
      window.dispatchEvent(
        new CustomEvent('generate-study-plan', {
          detail,
        }),
      );
    } catch (eventError) {
      console.error('Failed to initiate study plan generation:', eventError);
      const message =
        eventError instanceof Error
          ? eventError.message
          : 'Failed to start study plan generation. Please try again.';
      setError(message);
      setIsGenerating(false);
    }
  };

  const sliderBaseClasses = [
    'w-full h-2.5 rounded-full appearance-none cursor-pointer relative',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint/40 focus-visible:ring-offset-1 focus-visible:ring-offset-background',
  ].join(' ');

  const sliderThumbClasses = [
    '[&::-webkit-slider-thumb]:appearance-none [&::-moz-range-thumb]:appearance-none',
    '[&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6',
    '[&::-webkit-slider-thumb]:rounded-full [&::-moz-range-thumb]:rounded-full',
    '[&::-webkit-slider-thumb]:bg-gradient-to-br [&::-webkit-slider-thumb]:from-mint-400 [&::-webkit-slider-thumb]:to-mint-500',
    '[&::-moz-range-thumb]:bg-gradient-to-br [&::-moz-range-thumb]:from-mint-400 [&::-moz-range-thumb]:to-mint-500',
    '[&::-webkit-slider-thumb]:mt-[-0.35rem]',
    '[&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-white dark:[&::-webkit-slider-thumb]:border-neutral-900',
    '[&::-moz-range-thumb]:border-[3px] [&::-moz-range-thumb]:border-white dark:[&::-moz-range-thumb]:border-neutral-900',
    '[&::-webkit-slider-thumb]:shadow-[0_10px_20px_rgba(16,185,129,0.35)] [&::-moz-range-thumb]:shadow-[0_10px_20px_rgba(16,185,129,0.35)]',
    '[&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:duration-150 [&::-webkit-slider-thumb]:ease-out',
    '[&::-moz-range-thumb]:transition-transform [&::-moz-range-thumb]:duration-150 [&::-moz-range-thumb]:ease-out',
    '[&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:hover:shadow-[0_12px_24px_rgba(16,185,129,0.45)]',
    '[&::-moz-range-thumb]:hover:scale-110 [&::-moz-range-thumb]:hover:shadow-[0_12px_24px_rgba(16,185,129,0.45)]',
    '[&::-webkit-slider-thumb]:active:scale-95 [&::-moz-range-thumb]:active:scale-95',
  ].join(' ');

  const timelineSliderClasses = [
    sliderBaseClasses,
    'bg-gradient-to-r from-blue-500 via-blue-300 to-blue-100 dark:from-blue-600 dark:via-blue-500 dark:to-blue-400',
    sliderThumbClasses,
  ].join(' ');

  const hoursSliderClasses = [
    sliderBaseClasses,
    'bg-gradient-to-r from-indigo-100 via-blue-300 to-indigo-500 dark:from-indigo-400 dark:via-blue-500 dark:to-indigo-600',
    sliderThumbClasses,
  ].join(' ');

  return (
    <div className="inline-study-plan-builder space-y-6">
      <div className="space-y-4">
        <div className="space-y-1 text-center">
          <h3 className="text-base font-medium text-content sm:text-lg">
            Try generating a personalized study plan
          </h3>
          <p className="text-sm font-medium text-mint-600 dark:text-mint-300">
            Free unlimited access for a limited time
          </p>
        </div>
      </div>

      <div className="space-y-6 rounded-3xl border border-outline-subtle/25 bg-background/95 p-6 shadow-[0_20px_45px_rgba(15,23,42,0.12)] backdrop-blur-xl dark:border-panel-200 dark:bg-panel-50 dark:shadow-[0_20px_45px_rgba(2,6,23,0.55)] sm:p-7">

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-content" htmlFor="inline-company-select">
              Company
            </label>
            <select
              id="inline-company-select"
              value={selectedCompany}
              onChange={(event) => setSelectedCompany(event.target.value)}
              className="w-full rounded-xl border border-outline-subtle/25 bg-background dark:bg-panel-100 dark:border-panel-300 px-3 py-2 text-sm text-content focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint/30"
            >
              {COMPANY_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-content" htmlFor="inline-role-select">
              Role
            </label>
            <select
              id="inline-role-select"
              value={selectedRole}
              onChange={(event) => setSelectedRole(event.target.value as RoleFamily)}
              className="w-full rounded-xl border border-outline-subtle/25 bg-background dark:bg-panel-100 dark:border-panel-300 px-3 py-2 text-sm text-content focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint/30"
            >
              {ROLE_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="flex items-center justify-between text-sm font-medium text-content" htmlFor="inline-timeline-slider">
              <span>Study Duration</span>
              <span className="text-mint-600">{timeline} days</span>
            </label>
            <input
              id="inline-timeline-slider"
              type="range"
              min="1"
              max="21"
              value={timeline}
              onChange={(event) => setTimeline(Number(event.target.value))}
              className={timelineSliderClasses}
            />
            <div className="flex justify-between text-xs text-content-muted">
              <span>1 day</span>
              <span>21 days</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center justify-between text-sm font-medium text-content" htmlFor="inline-hours-slider">
              <span>Daily Time Commitment</span>
              <span className="text-mint-600">{hoursPerDay} hours/day</span>
            </label>
            <input
              id="inline-hours-slider"
              type="range"
              min="0.5"
              max="8"
              step="0.5"
              value={hoursPerDay}
              onChange={(event) => setHoursPerDay(Number(event.target.value))}
              className={hoursSliderClasses}
            />
            <div className="flex justify-between text-xs text-content-muted">
              <span>0.5 hours</span>
              <span>8 hours</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleGenerateClick}
          disabled={isGenerating}
          className="w-full inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#6366F1] px-6 py-3 text-base font-medium text-white border border-[#6366F1]/30 shadow-[0_2px_8px_rgba(99,102,241,0.25),0_1px_18px_rgba(255,255,255,0.4)_inset] dark:shadow-[0_2px_8px_rgba(99,102,241,0.3),0_1px_18px_rgba(255,255,255,0.12)_inset] transition-all duration-200 hover:-translate-y-0.5 hover:from-[#2563EB] hover:to-[#4F46E5] hover:shadow-[0_4px_16px_rgba(99,102,241,0.35),0_2px_26px_rgba(255,255,255,0.5)_inset] dark:hover:shadow-[0_4px_16px_rgba(99,102,241,0.4),0_2px_26px_rgba(255,255,255,0.16)_inset] hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]/40 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:transform-none backdrop-blur-xl"
        >
          {isGenerating ? 'Generating your study plan...' : 'Generate my study plan'}
        </button>
      </div>
    </div>
  );
};
