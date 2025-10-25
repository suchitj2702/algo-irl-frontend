import { ThinkingIndicator } from '../ThinkingIndicator';

const STUDY_PLAN_STATES = [
  "Analyzing your goals and timeline...",
  "Selecting optimal problems for your level...",
  "Crafting your personalized schedule...",
  "Balancing difficulty and topics...",
  "Finalizing your study roadmap..."
];

export function StudyPlanLoading() {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-white dark:bg-neutral-900 flex items-center justify-center">
      <ThinkingIndicator
        title="Generating your personalized study plan"
        states={STUDY_PLAN_STATES}
      />
    </div>
  );
}
