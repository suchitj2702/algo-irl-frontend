import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, ComposedChart
} from 'recharts';
import {
  Brain,
  Filter,
  Database,
  CheckCircle,
  XCircle,
  Zap,
  DollarSign,
  Clock,
  FileJson,
  ArrowRight,
  Target,
  TrendingUp,
  BarChart3,
  UserRoundCheck
} from 'lucide-react';
import {
  containerVariants,
  itemVariants,
  gridContainerVariants,
  funnelTierVariants,
  pipelineStageVariants,
  badgePopVariants
} from './animationVariants';

// --- Animated ChartCard Component ---

interface ChartCardProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  children: ReactNode;
  contentClassName?: string;
  hideHeader?: boolean;
}

function ChartCard({ title, subtitle, children, contentClassName, hideHeader = false }: ChartCardProps) {
  const shouldReduceMotion = useReducedMotion();

  const content = (
    <div
      className={`rounded-xl border border-slate-200 dark:border-panel-200 bg-white dark:bg-panel-50 p-4 shadow-sm hover:shadow-md transition-shadow duration-300 ${contentClassName ?? ''}`}
    >
      {!hideHeader && (
        <div className="mb-1 space-y-1">
          <h5 className="text-l font-semibold text-slate-500 dark:text-content-muted">{title}</h5>
          {subtitle && <p className="text-sm text-slate-600 dark:text-content-muted">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  );

  if (shouldReduceMotion) {
    return content;
  }

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.25 }}
      variants={containerVariants}
    >
      {content}
    </motion.div>
  );
}

// --- Data Definitions ---

const teacherData = [
  { subject: 'Algorithmic Correctness', claude: 0.95, gpt5: 0.91, gemini: 0.86, fullMark: 1 },
  { subject: 'Parsing Quality', claude: 0.91, gpt5: 0.83, gemini: 0.78, fullMark: 1 },
  { subject: 'Technical Accuracy', claude: 0.87, gpt5: 0.82, gemini: 0.75, fullMark: 1 },
  { subject: 'Company Relevance', claude: 0.78, gpt5: 0.74, gemini: 0.70, fullMark: 1 },
  { subject: 'Scenario Realism', claude: 0.64, gpt5: 0.65, gemini: 0.62, fullMark: 1 },
  { subject: 'Role Specificity', claude: 0.63, gpt5: 0.66, gemini: 0.58, fullMark: 1 }
];

const radarModels = [
  { key: 'claude', label: 'Claude Sonnet 4', stroke: '#8b5cf6', fill: 'rgba(139, 92, 246, 0.4)' },
  { key: 'gpt5', label: 'GPT-5', stroke: '#3b82f6', fill: 'rgba(59, 130, 246, 0.25)' },
  { key: 'gemini', label: 'Gemini 2.5 Pro', stroke: '#10b981', fill: 'rgba(16, 185, 129, 0.15)' }
] as const;

type TeacherModelKey = typeof radarModels[number]['key'];
type TeacherDatum = typeof teacherData[number];

const teacherAverages: Record<TeacherModelKey, number> = radarModels.reduce((acc, model) => {
  const total = teacherData.reduce((sum, datum) => sum + (datum[model.key as keyof TeacherDatum] as number), 0);
  acc[model.key] = total / teacherData.length;
  return acc;
}, {} as Record<TeacherModelKey, number>);

const roleDistribution = [
  { label: 'Backend', value: 1510 },
  { label: 'ML', value: 1208 },
  { label: 'Frontend', value: 1205 },
  { label: 'Infrastructure', value: 1055 },
  { label: 'Security', value: 1054 }
];

const difficultyDistribution = [
  { label: 'Easy', value: 2011, color: '#22c55e' },
  { label: 'Medium', value: 2814, color: '#f59e0b' },
  { label: 'Hard', value: 1207, color: '#ef4444' }
];

const lossExperiments = [
  { name: 'GPT-4.1-nano', training: [0.42, 0.33, 0.285], validation: [0.39, 0.34, 0.315], winner: true },
  { name: 'Qwen3-Coder-30B', training: [0.58, 0.52, 0.48], validation: [0.63, 0.59, 0.55], winner: false },
  { name: 'Llama 3.1 8B', training: [0.65, 0.58, 0.54], validation: [0.7, 0.66, 0.63], winner: false }
];

const studentComparisonData = [
  { name: 'GPT-4.1-nano (FT)', quality: 0.78, latency: 2.5, cost: 1.30, parsing: 92, winner: true },
  { name: 'Qwen3-30B (LoRA)', quality: 0.71, latency: 20.0, cost: 5.50, parsing: 79, winner: false },
  { name: 'Llama 3.1 8B (LoRA)', quality: 0.68, latency: 15.0, cost: 2.00, parsing: 76, winner: false }
];

const evaluationDimensions = [
  { label: 'Algorithmic Correctness', value: 0.982 },
  { label: 'Parsing Quality', value: 0.923 },
  { label: 'Technical Accuracy', value: 0.885 },
  { label: 'Company Relevance', value: 0.749 },
  { label: 'Scenario Realism', value: 0.596 },
  { label: 'Role Specificity', value: 0.568 }
];

const comparisonDimensions = [
  { label: 'Algorithmic Correctness', claude: 0.95, student: 0.982, better: 'student' },
  { label: 'Parsing Quality', claude: 0.91, student: 0.923, better: 'student' },
  { label: 'Technical Accuracy', claude: 0.87, student: 0.885, better: 'student' },
  { label: 'Company Relevance', claude: 0.78, student: 0.749, better: 'claude' },
  { label: 'Role Specificity', claude: 0.63, student: 0.568, better: 'claude' },
  { label: 'Scenario Realism', claude: 0.64, student: 0.596, better: 'claude' }
];

const costSeries = [
  { volume: '1K', claude: 4, student: 0.08 },
  { volume: '10K', claude: 40, student: 0.8 },
  { volume: '100K', claude: 400, student: 8 },
  { volume: '1M', claude: 4000, student: 80 }
];

const monthlySavings = 392;
const setupCost = 351.6;
const roiTimeline = Array.from({ length: 12 }, (_, idx) => {
  const month = idx + 1;
  const cumulative = month * monthlySavings - setupCost;
  return { month: `M${month}`, cumulative, breakeven: month === 1 };
});

const projectedGrowthData = Array.from({ length: 12 }, (_, idx) => {
  const month = idx + 1;
  const growthFactor = Math.pow(50000 / 5000, idx / 11);
  const volume = Math.round(5000 * growthFactor);
  return { month, volume };
});

const projectedCostData = projectedGrowthData.map((data, idx) => {
  const claudeCostPerRequest = 0.045;
  const nanoCostPerRequest = 0.0013;
  const accumulatedVolume = projectedGrowthData.slice(0, idx + 1).reduce((sum, d) => sum + d.volume, 0);
  return {
    month: `M${data.month}`,
    volume: data.volume,
    claude: Math.round(accumulatedVolume * claudeCostPerRequest),
    nano: Math.round(accumulatedVolume * nanoCostPerRequest + 351.6)
  };
});

// --- Diagram Components ---

export function TeacherModelComparisonDiagram() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <ChartCard title="Teacher model comparison" contentClassName="py-3" hideHeader>
      <div className="space-y-3">
        <h5 className="text-l font-semibold text-slate-500 dark:text-content-muted">Teacher model comparison</h5>
        <div className="flex flex-col gap-4">
          <motion.div
            className="h-64 sm:h-80 md:h-96 lg:h-[28rem] xl:h-[32rem] w-full max-w-md sm:max-w-xl md:max-w-2xl lg:max-w-3xl xl:max-w-4xl mx-auto rounded-xl border border-slate-100 dark:border-panel-200 bg-slate-50/70 dark:bg-panel-100 p-4 shadow-sm"
            initial={shouldReduceMotion ? {} : { opacity: 0, scale: 0.9 }}
            whileInView={shouldReduceMotion ? {} : { opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={teacherData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 11 }} tickLine={false} />
                <PolarRadiusAxis angle={30} domain={[0, 1]} tick={false} axisLine={false} />
                <Radar name="Claude Sonnet 4" dataKey="claude" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.35} strokeWidth={2} />
                <Radar name="GPT-5" dataKey="gpt5" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} strokeWidth={2} />
                <Radar name="Gemini 2.5 Pro" dataKey="gemini" stroke="#10b981" fill="#10b981" fillOpacity={0.12} strokeWidth={2} />
                <Tooltip contentStyle={{ borderRadius: '6px', border: 'none', boxShadow: '0 2px 8px rgb(15 23 42 / 0.12)', fontSize: '12px', padding: '4px 8px' }} formatter={(value: number) => value.toFixed(3)} />
              </RadarChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div
            className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2"
            variants={gridContainerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {radarModels.map((model) => (
              <motion.div key={model.key} variants={itemVariants} className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ background: model.stroke }} />
                <div className="flex flex-col leading-tight">
                  <span className="text-sm font-medium text-slate-700 dark:text-muted">{model.label}</span>
                  <span className="text-xs text-slate-500 dark:text-content-muted">Avg. {teacherAverages[model.key].toFixed(3)}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </ChartCard>
  );
}

export function QualityValidationFunnelDiagram() {
  const tiers = [
    { value: '7,500', label: 'Generated', context: '15 companies × 100 problems × 5 roles', icon: <Database size={20} />, bg: 'bg-blue-100', border: 'border-blue-200', text: 'text-blue-800' },
    { value: '6,532', label: 'Validated', context: '87% passed quality checks', icon: <Filter size={20} />, bg: 'bg-indigo-100', border: 'border-indigo-200', text: 'text-indigo-800' },
    { value: '7,096', label: 'Final Dataset', context: '6,032 train + 1,064 validation', icon: <CheckCircle size={20} />, bg: 'bg-emerald-500', border: 'border-emerald-600', text: 'text-white' }
  ];

  return (
    <ChartCard
      title="Data generation pipeline"
      subtitle="Combinatorial generation narrowed through validation"
    >
      <motion.div
        className="flex flex-col items-center gap-2 py-4"
        variants={gridContainerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        {tiers.map((tier, idx) => (
          <motion.div key={tier.label} variants={funnelTierVariants} className="w-full flex flex-col items-center">
            <div
              className={`${tier.bg} ${tier.border} ${tier.text} border-2 rounded-xl p-4 shadow-sm text-center transition-transform hover:scale-[1.02]`}
              style={{ width: `${100 - idx * 15}%`, maxWidth: `${380 - idx * 50}px` }}
            >
              <div className="flex items-center justify-center gap-3 mb-1">
                {tier.icon}
                <span className="text-2xl font-bold">{tier.value}</span>
              </div>
              <p className="font-semibold text-sm">{tier.label}</p>
              <p className="text-xs opacity-80 mt-1">{tier.context}</p>
            </div>

            {idx === 0 && (
              <motion.div
                variants={itemVariants}
                className="flex items-center gap-2 my-2 text-red-500 text-xs font-medium"
              >
                <XCircle size={14} />
                <span>-968 rejected (12.7%)</span>
              </motion.div>
            )}

            {idx < tiers.length - 1 && idx !== 0 && (
              <div className="h-4 w-0.5 bg-slate-300 dark:bg-panel-300 my-1" />
            )}
          </motion.div>
        ))}
      </motion.div>
    </ChartCard>
  );
}

export function TrainingDataDistributionDiagram() {
  const maxRole = Math.max(...roleDistribution.map((d) => d.value));
  const maxDifficulty = Math.max(...difficultyDistribution.map((d) => d.value));
  const shouldReduceMotion = useReducedMotion();

  return (
    <ChartCard
      title="Training data distribution"
      subtitle="Balance was intentional across roles and complexity."
    >
      <motion.div
        className="grid gap-6 sm:grid-cols-2"
        variants={gridContainerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <motion.div variants={itemVariants} className="space-y-3">
          <p className="text-xs font-semibold text-slate-500 dark:text-content-muted">Roles</p>
          {roleDistribution.map((role, idx) => (
            <motion.div
              key={role.label}
              initial={shouldReduceMotion ? {} : { opacity: 0, x: -20 }}
              whileInView={shouldReduceMotion ? {} : { opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
            >
              <div className="flex justify-between text-sm items-center">
                <span className="text-slate-700 dark:text-muted">{role.label}</span>
                <span className="text-slate-500 dark:text-content-muted font-medium">{role.value.toLocaleString()}</span>
              </div>
              <div className="mt-1.5 h-2 rounded-full bg-slate-100 dark:bg-panel-200 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-indigo-600"
                  initial={shouldReduceMotion ? { width: `${(role.value / maxRole) * 100}%` } : { width: 0 }}
                  whileInView={shouldReduceMotion ? {} : { width: `${(role.value / maxRole) * 100}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: idx * 0.1, ease: 'easeOut' }}
                />
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-3">
          <p className="text-xs font-semibold text-slate-500 dark:text-content-muted">Difficulty</p>
          {difficultyDistribution.map((difficulty, idx) => (
            <motion.div
              key={difficulty.label}
              initial={shouldReduceMotion ? {} : { opacity: 0, x: -20 }}
              whileInView={shouldReduceMotion ? {} : { opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 + 0.3 }}
            >
              <div className="flex justify-between text-sm items-center">
                <span className="flex items-center gap-2 text-slate-700 dark:text-muted">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: difficulty.color }} />
                  {difficulty.label}
                </span>
                <span className="text-slate-500 dark:text-content-muted font-medium">{difficulty.value.toLocaleString()}</span>
              </div>
              <div className="mt-1.5 h-2 rounded-full bg-slate-100 dark:bg-panel-200 overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: difficulty.color }}
                  initial={shouldReduceMotion ? { width: `${(difficulty.value / maxDifficulty) * 100}%` } : { width: 0 }}
                  whileInView={shouldReduceMotion ? {} : { width: `${(difficulty.value / maxDifficulty) * 100}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: idx * 0.1 + 0.3, ease: 'easeOut' }}
                />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="mt-5 rounded-xl bg-slate-50 dark:bg-panel-100 border border-slate-200 dark:border-panel-200 p-4 flex flex-wrap gap-6 text-sm"
      >
        <div className="flex items-center gap-2">
          <FileJson size={16} className="text-indigo-500" />
          <span className="text-slate-600 dark:text-content-muted">Tokens:</span>
          <span className="font-semibold text-slate-800 dark:text-content">42.5M</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-indigo-500" />
          <span className="text-slate-600 dark:text-content-muted">Avg. length:</span>
          <span className="font-semibold text-slate-800 dark:text-content">7,051 tokens</span>
        </div>
      </motion.div>
    </ChartCard>
  );
}

export function TrainingLossCurvesDiagram() {
  const shouldReduceMotion = useReducedMotion();

  const formatData = (experiment: typeof lossExperiments[0]) => {
    return experiment.training.map((_, idx) => ({
      epoch: `E${idx + 1}`,
      training: experiment.training[idx],
      validation: experiment.validation[idx]
    }));
  };

  return (
    <ChartCard
      title="Training loss curves"
      subtitle="Three epochs per experiment, plotted as paired lines."
    >
      <motion.div
        className="grid gap-4 sm:grid-cols-3"
        variants={gridContainerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        {lossExperiments.map((experiment, idx) => (
          <motion.div
            key={experiment.name}
            variants={itemVariants}
            className={`rounded-xl border p-4 ${
              experiment.winner
                ? 'border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-950/30'
                : 'border-slate-100 dark:border-panel-200 bg-slate-50 dark:bg-panel-100'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-slate-800 dark:text-content">{experiment.name}</p>
              {experiment.winner && (
                <motion.span
                  variants={badgePopVariants}
                  className="bg-indigo-600 text-white text-[10px] px-2 py-0.5 rounded-full font-medium"
                >
                  Best
                </motion.span>
              )}
            </div>
            <motion.div
              className="h-20"
              initial={shouldReduceMotion ? {} : { opacity: 0 }}
              whileInView={shouldReduceMotion ? {} : { opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.15 }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={formatData(experiment)} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="epoch" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis domain={[0.2, 0.8]} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={25} />
                  <Line type="monotone" dataKey="training" stroke="#4f46e5" strokeWidth={2} dot={{ r: 3 }} name="Training" />
                  <Line type="monotone" dataKey="validation" stroke="#94a3b8" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3 }} name="Validation" />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>
            <div className="flex gap-4 mt-2 text-xs text-slate-500 dark:text-content-muted">
              <span className="flex items-center gap-1">
                <span className="h-0.5 w-3 bg-indigo-600 rounded" /> Train
              </span>
              <span className="flex items-center gap-1">
                <span className="h-0.5 w-3 bg-slate-400 rounded" style={{ borderStyle: 'dashed' }} /> Val
              </span>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </ChartCard>
  );
}

export function ModelComparisonMatrixDiagram() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <ChartCard
      title="Student model comparison"

    >
      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-3"
        variants={gridContainerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        {studentComparisonData.map((model, idx) => (
          <motion.div
            key={model.name}
            variants={itemVariants}
            className={`rounded-lg p-3 border transition-all hover:shadow-sm ${
              model.winner
                ? 'border-indigo-400 dark:border-indigo-500/40 bg-indigo-50 dark:bg-indigo-950/30'
                : 'border-slate-200 dark:border-panel-200 bg-slate-50 dark:bg-panel-100'
            }`}
          >
            <div className="mb-1">
              <h6 className="font-xsmall -slate-800 text-sm[6px]">{model.name}</h6>
            </div>

            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-500 dark:text-content-muted flex items-center gap-1"><Brain size={12} /> Quality</span>
                  <span className="font-semibold text-slate-700 dark:text-muted">{model.quality}/1.0</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-panel-200 h-1.5 rounded-full overflow-hidden">
                  <motion.div
                    className="bg-indigo-500 h-1.5 rounded-full"
                    initial={shouldReduceMotion ? { width: `${model.quality * 100}%` } : { width: 0 }}
                    whileInView={shouldReduceMotion ? {} : { width: `${model.quality * 100}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: idx * 0.1 }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-500 dark:text-content-muted flex items-center gap-1"><Clock size={12} /> Latency P90</span>
                  <span className="font-semibold text-slate-700 dark:text-muted">{model.latency}s</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-panel-200 h-1.5 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-1.5 rounded-full ${model.latency < 5 ? 'bg-green-500' : 'bg-amber-400'}`}
                    initial={shouldReduceMotion ? { width: `${Math.max(10, 100 - (model.latency * 4))}%` } : { width: 0 }}
                    whileInView={shouldReduceMotion ? {} : { width: `${Math.max(10, 100 - (model.latency * 4))}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: idx * 0.1 + 0.1 }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-500 dark:text-content-muted flex items-center gap-1"><DollarSign size={12} /> Cost / 1K</span>
                  <span className="font-semibold text-slate-700 dark:text-muted">${model.cost.toFixed(2)}</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-panel-200 h-1.5 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-1.5 rounded-full ${model.cost < 2 ? 'bg-green-500' : 'bg-red-400'}`}
                    initial={shouldReduceMotion ? { width: `${Math.max(10, 100 - (model.cost * 15))}%` } : { width: 0 }}
                    whileInView={shouldReduceMotion ? {} : { width: `${Math.max(10, 100 - (model.cost * 15))}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: idx * 0.1 + 0.2 }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-500 dark:text-content-muted flex items-center gap-1"><FileJson size={12} /> Parsing %</span>
                  <span className="font-semibold text-slate-700 dark:text-muted">{model.parsing}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-panel-200 h-1.5 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-1.5 rounded-full ${model.parsing > 90 ? 'bg-green-500' : 'bg-amber-500'}`}
                    initial={shouldReduceMotion ? { width: `${model.parsing}%` } : { width: 0 }}
                    whileInView={shouldReduceMotion ? {} : { width: `${model.parsing}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: idx * 0.1 + 0.3 }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </ChartCard>
  );
}

const architectureStages = [
  { title: 'Teacher Model', subtitle: 'Claude Sonnet 4', icon: <Brain size={16} />, bg: 'bg-purple-100', iconColor: 'text-purple-600' },
  { title: 'Validation', subtitle: 'LLM-as-Judge + QA', icon: <Filter size={16} />, bg: 'bg-blue-100', iconColor: 'text-blue-600' },
  { title: 'Student Model', subtitle: 'GPT-4.1-nano', icon: <Zap size={16} />, bg: 'bg-emerald-100', iconColor: 'text-emerald-600' }
];

export function TeacherStudentArchitectureDiagram() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <ChartCard
      title="Teacher → Student flow"
      subtitle="A three-step knowledge distillation loop."
    >
      <motion.div
        className="flex flex-col md:flex-row items-center justify-between gap-4 py-4"
        variants={gridContainerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        {architectureStages.map((stage, idx) => (
          <motion.div key={stage.title} variants={pipelineStageVariants} className="flex items-center">
            <div className="flex flex-col items-center text-center">
              <motion.div
                className={`w-12 h-12 ${stage.bg} rounded-xl flex items-center justify-center border border-white shadow-sm`}
                whileHover={shouldReduceMotion ? {} : { scale: 1.05, y: -2 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <span className={stage.iconColor}>{stage.icon}</span>
              </motion.div>
              <p className="mt-2 text-sm font-semibold text-slate-800 dark:text-content">{stage.title}</p>
              <p className="text-xs text-slate-500 dark:text-content-muted">{stage.subtitle}</p>
            </div>

            {idx < architectureStages.length - 1 && (
              <motion.div
                variants={itemVariants}
                className="mx-3 text-slate-300 hidden md:block"
              >
                <ArrowRight size={16} />
              </motion.div>
            )}
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="mt-4 grid grid-cols-3 gap-4 text-center text-xs"
      >
        <div className="rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-500/30 p-3">
          <p className="font-semibold text-purple-700 dark:text-purple-400">Highest Quality</p>
          <p className="text-slate-500 dark:text-content-muted">Best structural fidelity</p>
        </div>
        <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-500/30 p-3">
          <p className="font-semibold text-blue-700 dark:text-blue-400">87% Pass Rate</p>
          <p className="text-slate-500 dark:text-content-muted">Strict quality checks</p>
        </div>
        <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-500/30 p-3">
          <p className="font-semibold text-emerald-700 dark:text-emerald-400">10× Faster</p>
          <p className="text-slate-500 dark:text-content-muted">95% cost reduction</p>
        </div>
      </motion.div>
    </ChartCard>
  );
}

export function EvaluationFrameworkDiagram() {
  const shouldReduceMotion = useReducedMotion();

  const sortedDimensions = [...evaluationDimensions].sort((a, b) => b.value - a.value);
  const chartData = sortedDimensions.map(d => ({
    name: d.label,
    score: d.value,
    fill: d.value >= 0.9 ? '#22c55e' : d.value >= 0.7 ? '#3b82f6' : '#f59e0b'
  }));

  return (
    <ChartCard
      title="Evaluation framework"
      subtitle="Six equally weighted rubrics roll up into the final score."
    >
      <motion.div
        className="h-72"
        initial={shouldReduceMotion ? {} : { opacity: 0 }}
        whileInView={shouldReduceMotion ? {} : { opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={chartData}
            margin={{ top: 5, right: 50, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
            <XAxis type="number" domain={[0, 1]} tick={{ fontSize: 11 }} tickLine={false} />
            <YAxis
              dataKey="name"
              type="category"
              width={130}
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              cursor={{ fill: 'transparent' }}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgb(0 0 0 / 0.1)' }}
              formatter={(value: number) => value.toFixed(3)}
            />
            <Bar
              dataKey="score"
              name="Score"
              radius={[0, 4, 4, 0]}
              barSize={24}
              label={{
                position: 'right',
                fill: '#64748b',
                fontSize: 11,
                formatter: (value) => typeof value === 'number' ? value.toFixed(3) : String(value ?? '')
              }}
            >
              {chartData.map((entry, index) => (
                <rect
                  key={`bar-${index}`}
                  fill={entry.fill}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      <div className="mt-4 flex gap-4 justify-center text-xs">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-green-500" /> Excellent (≥0.9)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-blue-500" /> Good (≥0.7)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-amber-500" /> Moderate (&lt;0.7)
        </span>
      </div>
    </ChartCard>
  );
}

export function EvaluationComparisonDiagram() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <ChartCard
      title="Evaluation comparison"
    >
      <motion.div
        className="grid md:grid-cols-2 gap-6"
        variants={gridContainerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        {/* Claude Column */}
        <motion.div variants={itemVariants} className="rounded-xl border border-purple-200 dark:border-purple-500/30 bg-purple-50 dark:bg-purple-950/30 p-4">
          <div className="flex items-center gap-1 mb-4">
            <span className="h-3 w-3 rounded-full bg-purple-500" />
            <h5 className="font-semibold text-slate-800 dark:text-content">Claude Sonnet 4</h5>
            <span className="text-xs text-slate-500 dark:text-content-muted">(Teacher)</span>
          </div>
          <div className="space-y-3">
            {comparisonDimensions.map((dim, idx) => (
              <div key={`claude-${dim.label}`}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 dark:text-content-muted">{dim.label}</span>
                  <span className={`font-semibold ${dim.better === 'claude' ? 'text-purple-600 dark:text-purple-400' : 'text-slate-500 dark:text-content-muted'}`}>
                    {dim.claude.toFixed(3)}
                    {dim.better === 'claude' && ' ✓'}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-purple-100 dark:bg-purple-900/40 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-purple-500"
                    initial={shouldReduceMotion ? { width: `${dim.claude * 100}%` } : { width: 0 }}
                    whileInView={shouldReduceMotion ? {} : { width: `${dim.claude * 100}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: idx * 0.05 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Student Column */}
        <motion.div variants={itemVariants} className="rounded-xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/30 p-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="h-3 w-3 rounded-full bg-emerald-500" />
            <h5 className="font-semibold text-slate-800 dark:text-content">GPT-4.1-nano</h5>
            <span className="text-xs text-slate-500 dark:text-content-muted">(Student)</span>
          </div>
          <div className="space-y-3">
            {comparisonDimensions.map((dim, idx) => (
              <div key={`student-${dim.label}`}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 dark:text-content-muted">{dim.label}</span>
                  <span className={`font-semibold ${dim.better === 'student' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-content-muted'}`}>
                    {dim.student.toFixed(3)}
                    {dim.better === 'student' && ' ✓'}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-emerald-500"
                    initial={shouldReduceMotion ? { width: `${dim.student * 100}%` } : { width: 0 }}
                    whileInView={shouldReduceMotion ? {} : { width: `${dim.student * 100}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: idx * 0.05 + 0.2 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="mt-4 text-center text-sm text-slate-600 dark:text-content-muted"
      >
        Student wins on <span className="font-semibold text-emerald-600 dark:text-emerald-400">3 technical dimensions</span>,
        Teacher leads on <span className="font-semibold text-purple-600 dark:text-purple-400">3 contextual dimensions</span>
      </motion.div>
    </ChartCard>
  );
}

export function CostComparisonChart() {
  return (
    <ChartCard
      title="Cost comparison"
      subtitle="Monthly inference cost by request volume."
    >
      <motion.div
        className="overflow-x-auto"
        variants={gridContainerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-slate-500 dark:text-content-muted border-b border-slate-200 dark:border-panel-200">
            <tr>
              <th className="py-2 pr-4 font-semibold">Volume</th>
              <th className="py-2 pr-4 font-semibold">Claude Sonnet 4</th>
              <th className="py-2 pr-4 font-semibold">GPT-4.1-nano (FT)</th>
              <th className="py-2 pr-4 font-semibold text-emerald-600">Savings</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-panel-200">
            {costSeries.map((entry) => (
              <motion.tr
                key={entry.volume}
                variants={itemVariants}
                className="hover:bg-slate-50 dark:hover:bg-panel-100 transition-colors"
              >
                <td className="py-3 pr-4 font-semibold text-slate-700 dark:text-muted">{entry.volume}</td>
                <td className="py-3 pr-4 text-red-600">${entry.claude.toFixed(2)}</td>
                <td className="py-3 pr-4 text-emerald-600">${entry.student.toFixed(2)}</td>
                <td className="py-3 pr-4">
                  <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-xs font-semibold">
                    <TrendingUp size={12} />
                    ${(entry.claude - entry.student).toFixed(2)}
                  </span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </ChartCard>
  );
}

export function RoiTimelineDiagram() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <ChartCard
      title="ROI timeline"
      subtitle="Cumulative savings at current production volume."
    >
      <motion.div
        className="h-64"
        initial={shouldReduceMotion ? {} : { opacity: 0 }}
        whileInView={shouldReduceMotion ? {} : { opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={roiTimeline} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis
              tickFormatter={(value) => `$${value}`}
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={50}
            />
            <Tooltip
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgb(0 0 0 / 0.1)' }}
              formatter={(value: number) => [`$${value.toLocaleString()}`, 'Cumulative Savings']}
            />
            <Area
              type="monotone"
              dataKey="cumulative"
              stroke="#22c55e"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#colorCumulative)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="mt-4 flex items-center justify-center gap-2 text-sm"
      >
        <CheckCircle size={16} className="text-emerald-500" />
        <span className="text-slate-600 dark:text-content-muted">Break-even:</span>
        <span className="font-semibold text-slate-800 dark:text-content">~90K transformations</span>
        <span className="text-xs text-slate-400">(Month 1)</span>
      </motion.div>
    </ChartCard>
  );
}

export function TcoComparisonDiagram() {
  const claude = 4800;
  const student = 447.63;
  const shouldReduceMotion = useReducedMotion();

  return (
    <ChartCard
      title="12-month TCO comparison"
      subtitle="Scenario: 100K transformations per month."
    >
      <motion.div
        className="space-y-6"
        variants={gridContainerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <motion.div variants={itemVariants}>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-600 dark:text-content-muted flex items-center gap-2">
              <span className="h-3 w-3 rounded bg-red-500" />
              Claude Sonnet 4
            </span>
            <span className="font-bold text-red-600 dark:text-red-400">${claude.toLocaleString()}</span>
          </div>
          <div className="h-4 rounded-full bg-slate-100 dark:bg-panel-200 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-red-400 to-red-600"
              initial={shouldReduceMotion ? { width: '100%' } : { width: 0 }}
              whileInView={shouldReduceMotion ? {} : { width: '100%' }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-600 dark:text-content-muted flex items-center gap-2">
              <span className="h-3 w-3 rounded bg-emerald-500" />
              Fine-tuned GPT-4.1-nano
            </span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">${student.toLocaleString()}</span>
          </div>
          <div className="h-4 rounded-full bg-slate-100 dark:bg-panel-200 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600"
              initial={shouldReduceMotion ? { width: `${(student / claude) * 100}%` } : { width: 0 }}
              whileInView={shouldReduceMotion ? {} : { width: `${(student / claude) * 100}%` }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
            />
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="flex items-center justify-center gap-4 pt-2"
        >
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">${(claude - student).toLocaleString()}</p>
            <p className="text-xs text-slate-500 dark:text-content-muted">Annual Savings</p>
          </div>
          <div className="h-10 w-px bg-slate-200 dark:bg-panel-300" />
          <div className="text-center">
            <motion.p
              variants={badgePopVariants}
              className="text-2xl font-bold text-emerald-600 dark:text-emerald-400"
            >
              91%
            </motion.p>
            <p className="text-xs text-slate-500 dark:text-content-muted">Cost Reduction</p>
          </div>
        </motion.div>
      </motion.div>
    </ChartCard>
  );
}

export function ProjectedCostGrowthDiagram() {
  const shouldReduceMotion = useReducedMotion();
  const finalClaude = projectedCostData[11].claude;
  const finalNano = projectedCostData[11].nano;
  const totalSavings = finalClaude - finalNano;

  return (
    <ChartCard
      title="12-month projected API costs"
      subtitle="Accumulated costs as monthly transformation volume grows"
    >
      <motion.div
        className="h-80"
        initial={shouldReduceMotion ? {} : { opacity: 0 }}
        whileInView={shouldReduceMotion ? {} : { opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={projectedCostData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
            <defs>
              <linearGradient id="claudeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="nanoGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 9 }}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
            />
            <YAxis
              yAxisId="left"
              tickFormatter={(value) => `$${value}`}
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              width={55}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tickFormatter={(value) => `${value / 1000}K`}
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              width={40}
            />
            <Tooltip
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgb(0 0 0 / 0.1)', fontSize: '12px', padding: '8px 12px' }}
              formatter={(value: number, name: string) => [
                name === 'volume' ? `${value.toLocaleString()}` : `$${value.toLocaleString()}`,
                name === 'claude' ? 'Claude Sonnet 4' : name === 'nano' ? 'GPT-4.1-nano' : 'Monthly Volume'
              ]}
            />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="claude"
              name="Claude Sonnet 4"
              stroke="#ef4444"
              strokeWidth={2.5}
              fill="url(#claudeGradient)"
            />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="nano"
              name="GPT-4.1-nano"
              stroke="#22c55e"
              strokeWidth={2.5}
              fill="url(#nanoGradient)"
            />
            <Bar
              yAxisId="right"
              dataKey="volume"
              name="Monthly Volume"
              fill="#6366f1"
              fillOpacity={0.3}
              radius={[4, 4, 0, 0]}
              barSize={10}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </motion.div>
    </ChartCard>
  );
}

// Quality Validation Pipeline
const pipelineStages = [
  { id: 'input', label: 'Input', note: 'Same prompts', icon: <Database size={20} />, bg: 'bg-blue-100', iconColor: 'text-blue-600' },
  { id: 'judges', label: 'Judges', note: '3 frontier LLMs', icon: <UserRoundCheck size={20} />, bg: 'bg-indigo-100', iconColor: 'text-indigo-600' },
  { id: 'dimensions', label: '6 Dimensions', note: 'Scored 0→1', icon: <Target size={20} />, bg: 'bg-purple-100', iconColor: 'text-purple-600' },
  { id: 'aggregate', label: 'Aggregate', note: 'Avg per dim', icon: <BarChart3 size={20} />, bg: 'bg-pink-100', iconColor: 'text-pink-600' },
  { id: 'output', label: 'Scorecard', note: 'Auto reports', icon: <FileJson size={20} />, bg: 'bg-emerald-100', iconColor: 'text-emerald-600' }
];

export function QualityValidationPipelineDiagram() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <ChartCard
      title="Quality validation pipeline"
      subtitle="Provider-agnostic LLM-as-a-judge workflow for consistent evaluation"
      contentClassName="py-3"
      hideHeader
    >
      <div className="space-y-1.5">
        {/* Responsive pipeline flow with wrapping */}
        <motion.div
          variants={gridContainerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="flex flex-wrap items-center justify-center gap-x-4 gap-y-4"
        >
          {pipelineStages.map((stage, idx) => (
            <div key={stage.id} className="flex items-center gap-2 flex-shrink-0">
              <motion.div variants={pipelineStageVariants} className="flex items-center gap-2">
                <motion.div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${stage.bg}`}
                  whileHover={shouldReduceMotion ? {} : { scale: 1.05 }}
                >
                  <span className={`${stage.iconColor} [&>svg]:h-5 [&>svg]:w-5`}>{stage.icon}</span>
                </motion.div>
                <span className="text-sm font-semibold text-slate-700 dark:text-muted whitespace-nowrap">{stage.label}</span>
              </motion.div>
              {idx < pipelineStages.length - 1 && (
                <ArrowRight size={16} className="text-slate-300 flex-shrink-0" />
              )}
            </div>
          ))}
        </motion.div>
      </div>
    </ChartCard>
  );
}

// --- Diagram Map ---

const diagramMap: Record<string, ReactNode> = {
  'Teacher Model Comparison': <TeacherModelComparisonDiagram />,
  'Quality Funnel': <QualityValidationFunnelDiagram />,
  'Quality Validation Pipeline': <QualityValidationPipelineDiagram />,
  'Training Data Distribution': <TrainingDataDistributionDiagram />,
  'Training Loss Curves': <TrainingLossCurvesDiagram />,
  'Model Comparison Matrix': <ModelComparisonMatrixDiagram />,
  'Teacher-Student Architecture': <TeacherStudentArchitectureDiagram />,
  'Evaluation Framework': <EvaluationFrameworkDiagram />,
  'Evaluation Comparison': <EvaluationComparisonDiagram />,
  'Cost Comparison Chart': <CostComparisonChart />,
  'ROI Timeline': <RoiTimelineDiagram />,
  '12-Month TCO Comparison': <TcoComparisonDiagram />,
  'Projected Cost Growth': <ProjectedCostGrowthDiagram />
};

export function getDiagramComponent(alt?: string) {
  return alt ? diagramMap[alt] : undefined;
}
