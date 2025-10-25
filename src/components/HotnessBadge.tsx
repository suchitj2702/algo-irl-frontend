// Hotness Badge Component
// Displays a compact badge showing the hotness score with tooltip

import type { CSSProperties } from 'react';
import { Flame } from 'lucide-react';
import { EnrichedProblem } from '../types/studyPlan';
import { getHeatPalette } from '../utils/heatPalette';

interface HotnessBadgeProps {
 problem: EnrichedProblem;
 onClick?: () => void;
 showTooltip?: boolean;
}

export function HotnessBadge({ problem, onClick, showTooltip = true }: HotnessBadgeProps) {
 const { hotnessScore, frequencyData } = problem;
 const clampedScore = Math.min(Math.max(hotnessScore, 0), 100);

 const palette = getHeatPalette(clampedScore);
 const gradient = `linear-gradient(135deg, ${palette.stops.join(', ')})`;

 const baseColor = palette.stops[0].split(' ')[0];
 const edgeColor = palette.stops[palette.stops.length - 1].split(' ')[0];

 const buttonStyles: CSSProperties = {
  position: 'relative',
  background: gradient,
  color: palette.text,
  boxShadow: `0 8px 18px ${palette.glow}, 0 0 22px ${palette.glow}`,
  isolation: 'isolate'
 };

 const pillStyles: CSSProperties = {
  background: `linear-gradient(135deg, ${baseColor}11, ${edgeColor}22)`,
  color: palette.text
 };

 const tooltipText = frequencyData.isActuallyAsked
  ? `Hotness score ${hotnessScore} • Reported in recent interviews`
  : `Hotness score ${hotnessScore} • Strong match for this study plan`;

 return (
  <button
   type="button"
   onClick={onClick}
   className={`
    inline-flex items-center gap-1 px-3 py-1.5 rounded-[13px] font-semibold text-[12.5px]
    backdrop-blur-xl transition-all duration-200
    ${onClick ? 'cursor-pointer hover:opacity-95 active:scale-[0.97]' : 'cursor-default'}
   `}
   title={showTooltip ? tooltipText : undefined}
   style={buttonStyles}
  >
   <Flame
    size={14}
    strokeWidth={2.5}
    className="flex-shrink-0"
    aria-hidden="true"
   />
   <span className="tracking-tight">{hotnessScore}</span>
   {frequencyData.isActuallyAsked && (
    <span
     className="ml-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
     style={pillStyles}
    >
     <span className="h-1.5 w-1.5 rounded-full bg-white/80" aria-hidden />
     Interview insight
    </span>
   )}
   {onClick && <span className="text-[10px] opacity-80">›</span>}
  </button>
 );
}
