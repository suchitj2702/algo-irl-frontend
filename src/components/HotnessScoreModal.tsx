// Hotness Score Modal Component
// Beautiful split-panel design with glassmorphism effects

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, BarChart3, Clock, User, Building2, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { EnrichedProblem } from '../types/studyPlan';
import { getHeatPalette, getScoreBadge } from '../utils/heatPalette';
import { getCompanyDisplayName } from '../utils/companyDisplay';
import { CircularProgress } from './CircularProgress';
import { ScoreBreakdownBar } from './ScoreBreakdownBar';

interface HotnessScoreModalProps {
  problem: EnrichedProblem;
  companyId: string;
  roleName: string;
  onClose: () => void;
}

function getFrequencyNarrative(frequency: number, companyName: string): string {
  if (frequency >= 75) return `Asked very frequently at ${companyName}`;
  if (frequency >= 55) return `Asked regularly at ${companyName}`;
  if (frequency >= 30) return `Comes up occasionally at ${companyName}`;
  return `Foundation concept at ${companyName}`;
}

function getRecencyLabel(recencyBuckets: string[]): string | null {
  if (recencyBuckets.includes('thirtyDays')) return 'within the past 30 days';
  if (recencyBuckets.includes('threeMonths')) return 'within the past 3 months';
  if (recencyBuckets.includes('sixMonths')) return 'within the past 6 months';
  if (recencyBuckets.includes('moreThanSixMonths')) return 'over 6 months ago';
  return null;
}

function getRoleNarrative(roleScore: number, roleName: string): string {
  const article = /^[aeiou]/i.test(roleName) ? 'an' : 'a';
  if (roleScore >= 75) return `Highly relevant for ${article} ${roleName} role`;
  if (roleScore >= 55) return `Good alignment for ${article} ${roleName} role`;
  if (roleScore >= 35) return `Moderate relevance for ${article} ${roleName} role`;
  return `Basic alignment for ${article} ${roleName} role`;
}

function getCompanyNarrative(score: number, companyName: string): string {
  if (score >= 12) return `Directly uses ${companyName}'s tech stack`;
  if (score >= 8) return `Aligns with ${companyName}'s engineering practices`;
  if (score >= 4) return `Relevant to ${companyName}'s problem domain`;
  return `Part of ${companyName}'s interview curriculum`;
}

export function HotnessScoreModal({ problem, companyId, roleName, onClose }: HotnessScoreModalProps) {
  const companyName = getCompanyDisplayName(companyId);
  const { hotnessScore, hotnessBreakdown, frequencyData, roleRelevance, enrichedTopics } = problem;
  const clampedScore = Math.min(Math.max(hotnessScore, 0), 100);

  const palette = getHeatPalette(clampedScore);
  const scoreBadge = getScoreBadge(clampedScore);
  const badgeGradient = `linear-gradient(135deg, ${palette.stops.join(', ')})`;

  const [showAllTopics, setShowAllTopics] = useState(false);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const recencyLabel = getRecencyLabel(frequencyData.recency);

  // Organize all topics - limit to first 4 total
  const algorithmPatterns = enrichedTopics.algorithmPatterns || [];
  const dataStructures = enrichedTopics.dataStructures || [];
  const domainConcepts = enrichedTopics.domainConcepts || [];

  const allTopics = [
    ...algorithmPatterns.map(t => ({ text: t, category: 'Algorithm' })),
    ...dataStructures.map(t => ({ text: t, category: 'Data Structure' })),
    ...domainConcepts.map(t => ({ text: t, category: 'Domain' }))
  ].slice(0, 4);

  const hasTopics = allTopics.length > 0;

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', duration: 0.5 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-2xl w-[420px] h-[670px] overflow-hidden flex flex-col"
        >
          {/* Compact Header */}
          <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm px-4 py-2 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white truncate">
                Why This Problem Was Prioritized
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* Single Column Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-4">
              {/* Score Focus Section */}
              <div className="bg-gradient-to-br from-mint-50/80 to-blue-50/80 dark:from-gray-800/50 dark:to-gray-900/50 backdrop-blur-md p-4 rounded-xl flex flex-col items-center gap-3">
                <div className="w-full flex flex-col items-center gap-3">
                  {/* Heat Score Above */}
                  <div className="text-center">
                    <div
                      className="text-base font-bold bg-clip-text text-transparent"
                      style={{ backgroundImage: badgeGradient }}
                    >
                      {scoreBadge.label}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Heat Score
                    </p>
                  </div>

                  {/* Circular Progress Below */}
                  <CircularProgress
                    value={clampedScore}
                    gradient={palette.stops}
                    scoreId={clampedScore.toString()}
                  />
                </div>

                {/* Topics - Only show when expanded */}
                {hasTopics && (
                  <div className="w-full mt-2">
                    <button
                      onClick={() => setShowAllTopics(!showAllTopics)}
                      className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300 hover:text-mint-600 dark:hover:text-mint-400 transition-colors mb-2"
                    >
                      <span>Topics</span>
                      {showAllTopics ? (
                        <ChevronUp className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                      <span className="text-[10px] text-gray-500">({allTopics.length})</span>
                    </button>
                    <AnimatePresence>
                      {showAllTopics && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="flex flex-wrap gap-1.5">
                            {allTopics.map((topic, index) => (
                              <motion.span
                                key={`${topic.category}-${topic.text}`}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.02 }}
                                className="px-2 py-0.5 bg-white/60 dark:bg-gray-700/60 backdrop-blur-sm text-gray-700 dark:text-gray-300 rounded-md text-[10px] font-medium border border-gray-200/50 dark:border-gray-600/50"
                                title={`${topic.category}: ${topic.text}`}
                              >
                                {topic.text}
                              </motion.span>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              {/* Breakdown Details Section */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  Score Breakdown
                </h3>
                <div className="space-y-3">
                  <ScoreBreakdownBar
                    label="Frequency"
                    value={hotnessBreakdown.frequency}
                    maxValue={35}
                    color="blue"
                    description={getFrequencyNarrative(frequencyData.overall, companyName)}
                    icon={BarChart3}
                    compact
                  />
                  <ScoreBreakdownBar
                    label="Recency"
                    value={hotnessBreakdown.recency}
                    maxValue={25}
                    color="orange"
                    description={recencyLabel ? `Asked ${recencyLabel}` : 'Recent interview activity'}
                    icon={Clock}
                    compact
                  />
                  <ScoreBreakdownBar
                    label="Role Relevance"
                    value={hotnessBreakdown.roleRelevance}
                    maxValue={25}
                    color="purple"
                    description={getRoleNarrative(roleRelevance, roleName)}
                    icon={User}
                    compact
                  />
                  <ScoreBreakdownBar
                    label="Company Context"
                    value={hotnessBreakdown.companyContext}
                    maxValue={15}
                    color="green"
                    description={getCompanyNarrative(hotnessBreakdown.companyContext, companyName)}
                    icon={Building2}
                    compact
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Compact Footer */}
          <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm px-4 py-2 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-mint-600 hover:bg-mint-700 text-white font-medium rounded-lg transition-colors text-sm"
            >
              Got it!
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
