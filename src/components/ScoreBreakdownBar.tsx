// Score Breakdown Bar Component
// Displays a visual progress bar for hotness score components

interface ScoreBreakdownBarProps {
 label: string;
 value: number;
 maxValue: number;
 color: 'blue' | 'green' | 'purple' | 'orange';
 description: string;
}

const colorClasses = {
 blue: 'bg-gradient-to-r from-slate-400 to-slate-600',
 green: 'bg-gradient-to-r from-mint-400 to-mint-600',
 purple: 'bg-gradient-to-r from-navy-400 to-navy-600',
 orange: 'bg-gradient-to-r from-slate-500 to-mint-500'
};

export function ScoreBreakdownBar({ label, value, maxValue, color, description }: ScoreBreakdownBarProps) {
 const percentage = Math.round((value / maxValue) * 100);

 return (
  <div className="space-y-2">
   <div className="flex items-center justify-between">
    <span className="text-sm font-medium text-content-subtle">
     {label}
    </span>
    <span className="text-sm font-semibold text-content-subtle">
     {value}/{maxValue} points
    </span>
   </div>

   <div className="relative w-full h-3 bg-slate-200 dark:bg-navy-700 rounded-full overflow-hidden">
    <div
     className={`h-full ${colorClasses[color]} transition-all duration-500 ease-out`}
     style={{ width: `${percentage}%` }}
    />
   </div>

   <div className="flex items-center justify-between">
    <p className="text-xs text-content-muted dark:text-content-subtle">{description}</p>
    <span className="text-xs font-medium text-content-muted">{percentage}%</span>
   </div>
  </div>
 );
}
