// Hotness Score Modal Component
// Explains why a problem earned its prioritization score

import type { CSSProperties } from 'react';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { EnrichedProblem } from '../types/studyPlan';
import { getHeatPalette } from '../utils/heatPalette';
import { getCompanyDisplayName } from '../utils/companyDisplay';

interface HotnessScoreModalProps {
 problem: EnrichedProblem;
 companyId: string;
 roleName: string;
 onClose: () => void;
}

function getFrequencyNarrative(frequency: number): string {
 if (frequency >= 75) {
  return 'This question keeps surfacing in interview feedback from candidates.';
 }
 if (frequency >= 55) {
  return 'Interviewers bring it up regularly when assessing problem solving depth.';
 }
 if (frequency >= 30) {
  return 'It appears from time to time and mirrors common themes interviewers explore.';
 }
 return 'Even when the exact prompt varies, it reinforces the same concepts interviewers look for.';
}

function getRecencyLabel(recencyBuckets: string[]): string | null {
 if (recencyBuckets.includes('thirtyDays')) {
  return 'within the past 30 days';
 }
 if (recencyBuckets.includes('threeMonths')) {
  return 'within the past 3 months';
 }
 if (recencyBuckets.includes('sixMonths')) {
  return 'within the past 6 months';
 }
 if (recencyBuckets.includes('moreThanSixMonths')) {
  return 'over 6 months ago';
 }
 return null;
}

function getRoleNarrative(roleScore: number, roleName: string): string {
 if (roleScore >= 75) {
  return `It drills the exact problem-solving patterns ${roleName} interviewers rely on.`;
 }
 if (roleScore >= 55) {
  return `The concepts align closely with how ${roleName} interviews measure depth and adaptability.`;
 }
 if (roleScore >= 35) {
  return `It supports the reasoning skills that often appear in ${roleName} interviews.`;
 }
 return `It broadens your toolkit with fundamentals that still help in ${roleName} conversations.`;
}

function getCompanyNarrative(score: number, companyName: string): string {
 if (score >= 12) {
  return `It reflects ${companyName}’s tech stack and the way their teams reason about trade-offs.`;
 }
 if (score >= 8) {
  return `The scenario is a natural fit for ${companyName}’s product surface area and engineering culture.`;
 }
 if (score >= 4) {
  return `The setup is close to what ${companyName} uses when probing system intuition.`;
 }
 return `It still complements ${companyName}’s expectations, even if the company leans on broader problem families.`;
}

export function HotnessScoreModal({ problem, companyId, roleName, onClose }: HotnessScoreModalProps) {
 const companyName = getCompanyDisplayName(companyId);
 const { hotnessScore, hotnessBreakdown, frequencyData, roleRelevance } = problem;
 const clampedScore = Math.min(Math.max(hotnessScore, 0), 100);

 const palette = getHeatPalette(clampedScore);
 const badgeGradient = `linear-gradient(135deg, ${palette.stops.join(', ')})`;
 const badgeStyle: CSSProperties = {
  background: badgeGradient,
  color: palette.text,
  boxShadow: `0 8px 18px ${palette.glow}, 0 0 22px ${palette.glow}`
 };

 // Prevent body scroll when modal is open
 useEffect(() => {
  document.body.style.overflow = 'hidden';
  return () => {
   document.body.style.overflow = '';
  };
 }, []);

 const recencyLabel = getRecencyLabel(frequencyData.recency);

 const narratives: string[] = [];

 if (frequencyData.isActuallyAsked) {
  narratives.push(
   recencyLabel
    ? `Interviewers at ${companyName} last asked this ${recencyLabel}.`
    : `Interviewers at ${companyName} have confirmed this prompt recently.`
  );
 } else if (recencyLabel) {
  narratives.push(`Candidates preparing for ${companyName} reported variations of this problem ${recencyLabel}.`);
 } else {
  narratives.push(`This prompt fits the kinds of questions ${companyName} uses, even when the wording shifts.`);
 }

 narratives.push(
  getFrequencyNarrative(frequencyData.overall)
 );

 narratives.push(getRoleNarrative(roleRelevance, roleName));
 narratives.push(getCompanyNarrative(hotnessBreakdown.companyContext, companyName));

 return createPortal(
  <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 dark:bg-black/60 backdrop-blur-sm">
   <div className="bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
    {/* Header */}
    <div className="sticky top-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm px-6 py-4 flex items-center justify-between shadow-sm">
     <div>
      <h2 className="text-2xl font-normal text-gray-900 dark:text-white font-playfair">
       Why this problem was prioritized
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
       Hotness score <span className="font-semibold text-gray-900 dark:text-white">{hotnessScore}</span>
      </p>
     </div>
     <button
      onClick={onClose}
      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
     >
      <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
     </button>
    </div>

    {/* Content */}
    <div className="px-6 py-6 space-y-6">
     {/* Source Badge */}
     <div>
      {frequencyData.isActuallyAsked ? (
       <div
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wide"
        style={badgeStyle}
       >
        <span className="h-2 w-2 rounded-full bg-white/85" aria-hidden />
        <span className="text-xs font-semibold uppercase tracking-wide">Interview insight</span>
        <span className="text-sm font-medium normal-case">
         Asked at {companyName}{recencyLabel ? ` ${recencyLabel}` : ''}
        </span>
       </div>
      ) : (
       <div className="inline-flex items-center gap-2 px-4 py-2 bg-mint-100 dark:bg-mint-900/30 text-mint-800 dark:text-mint-300 rounded-lg border border-mint-200 dark:border-mint-800">
        <span className="h-2 w-2 rounded-full bg-mint-500 dark:bg-mint-300" aria-hidden />
        <span className="text-xs font-semibold uppercase tracking-wide">Plan recommendation</span>
        <span className="text-sm font-medium">Selected for its fit with {companyName}</span>
       </div>
      )}
     </div>

     {/* Narrative */}
     <div className="space-y-4">
      <h3 className="text-base font-semibold text-content font-playfair">
       What stood out
      </h3>
      <ul className="space-y-3">
       {narratives.map((sentence, index) => (
        <li key={index} className="flex items-start gap-3">
         <span className="mt-1 text-sm text-rose-500 dark:text-rose-300">•</span>
         <p className="text-sm text-content-subtle">{sentence}</p>
        </li>
       ))}
      </ul>
     </div>

     {/* Additional Context */}
     {!frequencyData.isActuallyAsked && (
      <div className="bg-mint-50 dark:bg-mint-900/20 border border-mint-200 dark:border-mint-800 rounded-lg p-4">
       <p className="text-sm text-mint-900 dark:text-mint-200">
        <span className="font-semibold">Why it still matters:</span> Even if this exact wording hasn’t appeared, the reasoning maps closely to {companyName}’s interview conversations for {roleName} roles.
       </p>
      </div>
     )}

     {/* Topics Preview */}
     <div>
      <h4 className="text-sm font-semibold text-content mb-2 font-playfair">
       Topics Covered
      </h4>
      <div className="flex flex-wrap gap-2">
       {problem.enrichedTopics.algorithmPatterns.slice(0, 5).map(pattern => (
        <span
         key={pattern}
         className="px-3 py-1 bg-mint-100 dark:bg-mint-900/30 text-mint-700 dark:text-mint-300 rounded-full text-xs font-medium"
        >
         {pattern}
        </span>
       ))}
      </div>
     </div>
    </div>

    {/* Footer */}
    <div className="sticky bottom-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm px-6 py-4 shadow-[0_-2px_4px_0_rgb(0_0_0_/_0.05)]">
     <button
      onClick={onClose}
      className="w-full px-4 py-2.5 bg-mint-600 hover:bg-mint-700 text-button-foreground font-medium rounded-lg transition-colors"
     >
      Got it!
     </button>
    </div>
   </div>
  </div>,
  document.body
 );
}
