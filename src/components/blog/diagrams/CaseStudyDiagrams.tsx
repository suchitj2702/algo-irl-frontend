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
  Scale,
  Target,
  TrendingUp,
  Layers,
  BarChart3,
  GitBranch,
  Award
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
}

function ChartCard({ title, subtitle, icon, children }: ChartCardProps) {
  const shouldReduceMotion = useReducedMotion();

  const content = (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md hover:shadow-lg transition-shadow duration-300">
      <div className="mb-5 space-y-1">
        <div className="flex items-center gap-2">
          {icon && <span className="text-indigo-500">{icon}</span>}
          <p className="text-xs uppercase tracking-[0.2em] font-semibold text-slate-500">{title}</p>
        </div>
        {subtitle && <p className="text-sm text-slate-600">{subtitle}</p>}
      </div>
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

const roleDistribution = [
  { label: 'Backend', value: 1510, icon: <Database size={14} /> },
  { label: 'ML', value: 1208, icon: <Brain size={14} /> },
  { label: 'Frontend', value: 1205, icon: <Layers size={14} /> },
  { label: 'Infrastructure', value: 1055, icon: <GitBranch size={14} /> },
  { label: 'Security', value: 1054, icon: <Scale size={14} /> }
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
    <ChartCard
      title="Teacher Model Comparison"
      subtitle="Radar plot highlights Claude 4's lead on fidelity and structure."
      icon={<Brain size={16} />}
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
        <motion.div
          className="h-80 w-full lg:w-96"
          initial={shouldReduceMotion ? {} : { opacity: 0, scale: 0.8 }}
          whileInView={shouldReduceMotion ? {} : { opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={teacherData}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickLine={false}
              />
              <PolarRadiusAxis angle={30} domain={[0, 1]} tick={false} axisLine={false} />
              <Radar name="Claude Sonnet 4" dataKey="claude" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.4} strokeWidth={2} />
              <Radar name="GPT-5" dataKey="gpt5" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.25} strokeWidth={2} />
              <Radar name="Gemini 2.5 Pro" dataKey="gemini" stroke="#10b981" fill="#10b981" fillOpacity={0.15} strokeWidth={2} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgb(0 0 0 / 0.15)' }}
                formatter={(value: number) => value.toFixed(3)}
              />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          className="flex-1 space-y-3"
          variants={gridContainerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {radarModels.map((model, idx) => (
            <motion.div
              key={model.key}
              variants={itemVariants}
              className={`rounded-xl border p-4 flex items-center justify-between transition-all ${
                idx === 0
                  ? 'border-purple-200 bg-purple-50'
                  : 'border-slate-100 bg-slate-50 hover:border-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full" style={{ background: model.stroke }} />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-800">{model.label}</p>
                    {idx === 0 && (
                      <motion.span
                        variants={badgePopVariants}
                        className="bg-purple-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold"
                      >
                        WINNER
                      </motion.span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    Avg. score: <span className="font-semibold text-slate-700">
                      {(teacherData.reduce((sum, d) => sum + d[model.key], 0) / teacherData.length).toFixed(3)}
                    </span>
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
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
      title="Data Generation Pipeline"
      subtitle="Combinatorial generation narrowed through validation"
      icon={<Filter size={16} />}
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
              <div className="h-4 w-0.5 bg-slate-300 my-1" />
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
      title="Training Data Distribution"
      subtitle="Balance was intentional across roles and complexity."
      icon={<BarChart3 size={16} />}
    >
      <motion.div
        className="grid gap-6 sm:grid-cols-2"
        variants={gridContainerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <motion.div variants={itemVariants} className="space-y-3">
          <p className="text-xs uppercase tracking-[0.2em] font-semibold text-slate-500 flex items-center gap-2">
            <Layers size={14} /> Roles
          </p>
          {roleDistribution.map((role, idx) => (
            <motion.div
              key={role.label}
              initial={shouldReduceMotion ? {} : { opacity: 0, x: -20 }}
              whileInView={shouldReduceMotion ? {} : { opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
            >
              <div className="flex justify-between text-sm items-center">
                <span className="flex items-center gap-2 text-slate-700">
                  <span className="text-indigo-500">{role.icon}</span>
                  {role.label}
                </span>
                <span className="text-slate-500 font-medium">{role.value.toLocaleString()}</span>
              </div>
              <div className="mt-1.5 h-2 rounded-full bg-slate-100 overflow-hidden">
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
          <p className="text-xs uppercase tracking-[0.2em] font-semibold text-slate-500 flex items-center gap-2">
            <Target size={14} /> Difficulty
          </p>
          {difficultyDistribution.map((difficulty, idx) => (
            <motion.div
              key={difficulty.label}
              initial={shouldReduceMotion ? {} : { opacity: 0, x: -20 }}
              whileInView={shouldReduceMotion ? {} : { opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 + 0.3 }}
            >
              <div className="flex justify-between text-sm items-center">
                <span className="flex items-center gap-2 text-slate-700">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: difficulty.color }} />
                  {difficulty.label}
                </span>
                <span className="text-slate-500 font-medium">{difficulty.value.toLocaleString()}</span>
              </div>
              <div className="mt-1.5 h-2 rounded-full bg-slate-100 overflow-hidden">
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
        className="mt-5 rounded-xl bg-slate-50 border border-slate-200 p-4 flex flex-wrap gap-6 text-sm"
      >
        <div className="flex items-center gap-2">
          <FileJson size={16} className="text-indigo-500" />
          <span className="text-slate-600">Tokens:</span>
          <span className="font-semibold text-slate-800">42.5M</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-indigo-500" />
          <span className="text-slate-600">Avg. length:</span>
          <span className="font-semibold text-slate-800">7,051 tokens</span>
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
      title="Training Loss Curves"
      subtitle="Three epochs per experiment, plotted as paired lines."
      icon={<TrendingUp size={16} />}
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
                ? 'border-indigo-200 bg-indigo-50'
                : 'border-slate-100 bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-slate-800">{experiment.name}</p>
              {experiment.winner && (
                <motion.span
                  variants={badgePopVariants}
                  className="bg-indigo-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold"
                >
                  BEST
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
            <div className="flex gap-4 mt-2 text-xs text-slate-500">
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
      title="Student Model Comparison"
      subtitle="Head-to-head comparison of the three fine-tuning approaches."
      icon={<Scale size={16} />}
    >
      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
        variants={gridContainerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        {studentComparisonData.map((model, idx) => (
          <motion.div
            key={model.name}
            variants={itemVariants}
            className={`rounded-xl p-5 border-2 transition-all hover:shadow-md ${
              model.winner
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-slate-100 bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 text-sm">{model.name}</h3>
              {model.winner && (
                <motion.span
                  variants={badgePopVariants}
                  className="bg-indigo-600 text-white text-[10px] px-2 py-1 rounded-full font-bold flex items-center gap-1"
                >
                  <Award size={10} /> WINNER
                </motion.span>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-slate-500 flex items-center gap-1.5"><Brain size={14} /> Quality</span>
                  <span className="font-bold text-slate-700">{model.quality}/1.0</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <motion.div
                    className="bg-indigo-500 h-2 rounded-full"
                    initial={shouldReduceMotion ? { width: `${model.quality * 100}%` } : { width: 0 }}
                    whileInView={shouldReduceMotion ? {} : { width: `${model.quality * 100}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: idx * 0.1 }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-slate-500 flex items-center gap-1.5"><Clock size={14} /> Latency P90</span>
                  <span className="font-bold text-slate-700">{model.latency}s</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-2 rounded-full ${model.latency < 5 ? 'bg-green-500' : 'bg-amber-400'}`}
                    initial={shouldReduceMotion ? { width: `${Math.max(10, 100 - (model.latency * 4))}%` } : { width: 0 }}
                    whileInView={shouldReduceMotion ? {} : { width: `${Math.max(10, 100 - (model.latency * 4))}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: idx * 0.1 + 0.1 }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-slate-500 flex items-center gap-1.5"><DollarSign size={14} /> Cost / 1K</span>
                  <span className="font-bold text-slate-700">${model.cost.toFixed(2)}</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-2 rounded-full ${model.cost < 2 ? 'bg-green-500' : 'bg-red-400'}`}
                    initial={shouldReduceMotion ? { width: `${Math.max(10, 100 - (model.cost * 15))}%` } : { width: 0 }}
                    whileInView={shouldReduceMotion ? {} : { width: `${Math.max(10, 100 - (model.cost * 15))}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: idx * 0.1 + 0.2 }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-slate-500 flex items-center gap-1.5"><FileJson size={14} /> Parsing %</span>
                  <span className="font-bold text-slate-700">{model.parsing}%</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-2 rounded-full ${model.parsing > 90 ? 'bg-green-500' : 'bg-amber-500'}`}
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
  { title: 'Teacher Model', subtitle: 'Claude Sonnet 4', icon: <Brain size={24} />, bg: 'bg-purple-100', iconColor: 'text-purple-600' },
  { title: 'Validation', subtitle: 'LLM-as-Judge + QA', icon: <Filter size={24} />, bg: 'bg-blue-100', iconColor: 'text-blue-600' },
  { title: 'Student Model', subtitle: 'GPT-4.1-nano', icon: <Zap size={24} />, bg: 'bg-emerald-100', iconColor: 'text-emerald-600' }
];

export function TeacherStudentArchitectureDiagram() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <ChartCard
      title="Teacher → Student Flow"
      subtitle="A three-step knowledge distillation loop."
      icon={<GitBranch size={16} />}
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
                className={`w-20 h-20 ${stage.bg} rounded-2xl flex items-center justify-center border-2 border-white shadow-lg`}
                whileHover={shouldReduceMotion ? {} : { scale: 1.05, y: -2 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <span className={stage.iconColor}>{stage.icon}</span>
              </motion.div>
              <p className="mt-3 text-sm font-semibold text-slate-800">{stage.title}</p>
              <p className="text-xs text-slate-500">{stage.subtitle}</p>
            </div>

            {idx < architectureStages.length - 1 && (
              <motion.div
                variants={itemVariants}
                className="mx-4 text-slate-300 hidden md:block"
              >
                <ArrowRight size={24} />
              </motion.div>
            )}
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="mt-4 grid grid-cols-3 gap-4 text-center text-xs"
      >
        <div className="rounded-lg bg-purple-50 border border-purple-100 p-3">
          <p className="font-semibold text-purple-700">Highest Quality</p>
          <p className="text-slate-500">Best structural fidelity</p>
        </div>
        <div className="rounded-lg bg-blue-50 border border-blue-100 p-3">
          <p className="font-semibold text-blue-700">87% Pass Rate</p>
          <p className="text-slate-500">Strict quality checks</p>
        </div>
        <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-3">
          <p className="font-semibold text-emerald-700">10× Faster</p>
          <p className="text-slate-500">95% cost reduction</p>
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
      title="Evaluation Framework"
      subtitle="Six equally weighted rubrics roll up into the final score."
      icon={<Target size={16} />}
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
      title="Evaluation Comparison"
      subtitle="Claude (teacher) vs GPT-4.1-nano (student)."
      icon={<Scale size={16} />}
    >
      <motion.div
        className="grid md:grid-cols-2 gap-6"
        variants={gridContainerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        {/* Claude Column */}
        <motion.div variants={itemVariants} className="rounded-xl border border-purple-200 bg-purple-50 p-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="h-3 w-3 rounded-full bg-purple-500" />
            <p className="font-semibold text-slate-800">Claude Sonnet 4</p>
            <span className="text-xs text-slate-500">(Teacher)</span>
          </div>
          <div className="space-y-3">
            {comparisonDimensions.map((dim, idx) => (
              <div key={`claude-${dim.label}`}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600">{dim.label}</span>
                  <span className={`font-semibold ${dim.better === 'claude' ? 'text-purple-600' : 'text-slate-500'}`}>
                    {dim.claude.toFixed(3)}
                    {dim.better === 'claude' && ' ✓'}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-purple-100 overflow-hidden">
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
        <motion.div variants={itemVariants} className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="h-3 w-3 rounded-full bg-emerald-500" />
            <p className="font-semibold text-slate-800">GPT-4.1-nano</p>
            <span className="text-xs text-slate-500">(Student)</span>
          </div>
          <div className="space-y-3">
            {comparisonDimensions.map((dim, idx) => (
              <div key={`student-${dim.label}`}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600">{dim.label}</span>
                  <span className={`font-semibold ${dim.better === 'student' ? 'text-emerald-600' : 'text-slate-500'}`}>
                    {dim.student.toFixed(3)}
                    {dim.better === 'student' && ' ✓'}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-emerald-100 overflow-hidden">
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
        className="mt-4 text-center text-sm text-slate-600"
      >
        Student wins on <span className="font-semibold text-emerald-600">3 technical dimensions</span>,
        Teacher leads on <span className="font-semibold text-purple-600">3 contextual dimensions</span>
      </motion.div>
    </ChartCard>
  );
}

export function CostComparisonChart() {
  return (
    <ChartCard
      title="Cost Comparison"
      subtitle="Monthly inference cost by request volume."
      icon={<DollarSign size={16} />}
    >
      <motion.div
        className="overflow-x-auto"
        variants={gridContainerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-[0.15em] text-slate-500 border-b border-slate-200">
            <tr>
              <th className="py-3 pr-4 font-semibold">Volume</th>
              <th className="py-3 pr-4 font-semibold">Claude Sonnet 4</th>
              <th className="py-3 pr-4 font-semibold">GPT-4.1-nano (FT)</th>
              <th className="py-3 pr-4 font-semibold text-emerald-600">Savings</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {costSeries.map((entry) => (
              <motion.tr
                key={entry.volume}
                variants={itemVariants}
                className="hover:bg-slate-50 transition-colors"
              >
                <td className="py-3 pr-4 font-semibold text-slate-700">{entry.volume}</td>
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
      title="ROI Timeline"
      subtitle="Cumulative savings at current production volume."
      icon={<TrendingUp size={16} />}
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
        <span className="text-slate-600">Break-even:</span>
        <span className="font-semibold text-slate-800">~90K transformations</span>
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
      title="12-Month TCO Comparison"
      subtitle="Scenario: 100K transformations per month."
      icon={<DollarSign size={16} />}
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
            <span className="text-slate-600 flex items-center gap-2">
              <span className="h-3 w-3 rounded bg-red-500" />
              Claude Sonnet 4
            </span>
            <span className="font-bold text-red-600">${claude.toLocaleString()}</span>
          </div>
          <div className="h-4 rounded-full bg-slate-100 overflow-hidden">
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
            <span className="text-slate-600 flex items-center gap-2">
              <span className="h-3 w-3 rounded bg-emerald-500" />
              Fine-tuned GPT-4.1-nano
            </span>
            <span className="font-bold text-emerald-600">${student.toLocaleString()}</span>
          </div>
          <div className="h-4 rounded-full bg-slate-100 overflow-hidden">
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
            <p className="text-2xl font-bold text-emerald-600">${(claude - student).toLocaleString()}</p>
            <p className="text-xs text-slate-500">Annual Savings</p>
          </div>
          <div className="h-10 w-px bg-slate-200" />
          <div className="text-center">
            <motion.p
              variants={badgePopVariants}
              className="text-2xl font-bold text-emerald-600"
            >
              91%
            </motion.p>
            <p className="text-xs text-slate-500">Cost Reduction</p>
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
      title="12-Month Projected API Costs"
      subtitle="Accumulated costs as monthly transformation volume grows"
      icon={<TrendingUp size={16} />}
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
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
            />
            <YAxis
              yAxisId="left"
              tickFormatter={(value) => `$${value}`}
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={55}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tickFormatter={(value) => `${value / 1000}K`}
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={40}
            />
            <Tooltip
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgb(0 0 0 / 0.1)' }}
              formatter={(value: number, name: string) => [
                name === 'volume' ? `${value.toLocaleString()}` : `$${value.toLocaleString()}`,
                name === 'claude' ? 'Claude Sonnet 4' : name === 'nano' ? 'GPT-4.1-nano' : 'Monthly Volume'
              ]}
            />
            <Legend />
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
              barSize={20}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="mt-4 flex flex-wrap justify-center gap-6 text-sm border-t border-slate-100 pt-4"
      >
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
          <span className="text-slate-500">Claude: <span className="font-semibold text-red-600">${finalClaude.toLocaleString()}</span></span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          <span className="text-slate-500">Student: <span className="font-semibold text-emerald-600">${finalNano.toLocaleString()}</span></span>
        </div>
        <div className="flex items-center gap-2 pl-4 border-l border-slate-200">
          <TrendingUp size={14} className="text-emerald-500" />
          <span className="text-slate-500">12-month savings:</span>
          <span className="font-bold text-emerald-600">${totalSavings.toLocaleString()}</span>
        </div>
      </motion.div>
    </ChartCard>
  );
}

// Quality Validation Pipeline
const pipelineStages = [
  { id: 'input', label: 'Input', note: 'Same prompts', icon: <Database size={24} />, bg: 'bg-blue-100', iconColor: 'text-blue-600' },
  { id: 'judges', label: 'Judges', note: '3 frontier LLMs', icon: <Scale size={24} />, bg: 'bg-indigo-100', iconColor: 'text-indigo-600', badge: 'Ensemble' },
  { id: 'dimensions', label: '6 Dimensions', note: 'Scored 0→1', icon: <Target size={24} />, bg: 'bg-purple-100', iconColor: 'text-purple-600' },
  { id: 'aggregate', label: 'Aggregate', note: 'Avg per dim', icon: <BarChart3 size={24} />, bg: 'bg-pink-100', iconColor: 'text-pink-600' },
  { id: 'output', label: 'Scorecard', note: 'Auto reports', icon: <FileJson size={24} />, bg: 'bg-emerald-100', iconColor: 'text-emerald-600' }
];

const judgeModels = [
  { name: 'Claude Sonnet 4', color: '#8b5cf6' },
  { name: 'GPT-5', color: '#3b82f6' },
  { name: 'Gemini 2.5', color: '#10b981' }
];

const evaluationDimensionsPipeline = [
  'Algorithmic Correctness',
  'Parsing Quality',
  'Technical Accuracy',
  'Company Relevance',
  'Role Specificity',
  'Scenario Realism'
];

export function QualityValidationPipelineDiagram() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <ChartCard
      title="Quality Validation Pipeline"
      subtitle="Provider-agnostic LLM-as-a-judge workflow for consistent evaluation"
      icon={<Filter size={16} />}
    >
      <div className="space-y-6">
        {/* Main Pipeline Flow */}
        <motion.div
          className="relative py-2"
          variants={gridContainerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-0 sm:justify-between">
            {pipelineStages.map((stage, idx) => (
              <motion.div key={stage.id} variants={pipelineStageVariants} className="flex items-center">
                <div className="flex flex-col items-center text-center relative">
                  {stage.badge && (
                    <motion.span
                      variants={badgePopVariants}
                      className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-[9px] px-1.5 py-0.5 rounded-full font-bold shadow-sm z-10"
                    >
                      {stage.badge}
                    </motion.span>
                  )}
                  <motion.div
                    className={`flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-xl ${stage.bg} border-2 border-white shadow-md`}
                    whileHover={shouldReduceMotion ? {} : { scale: 1.08, y: -3 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <span className={stage.iconColor}>{stage.icon}</span>
                  </motion.div>
                  <p className="mt-2 text-xs sm:text-sm font-semibold text-slate-800">{stage.label}</p>
                  <p className="text-[10px] text-slate-500">{stage.note}</p>
                </div>

                {idx < pipelineStages.length - 1 && (
                  <motion.div
                    variants={itemVariants}
                    className="mx-2 sm:mx-3 text-slate-300 hidden sm:block"
                  >
                    <ArrowRight size={20} />
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Detail Cards */}
        <motion.div
          className="grid gap-4 sm:grid-cols-2"
          variants={gridContainerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <motion.div variants={itemVariants} className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
            <p className="text-xs uppercase tracking-[0.2em] font-semibold text-slate-500 flex items-center gap-2">
              <Scale size={14} /> Judge Ensemble
            </p>
            <div className="space-y-2">
              {judgeModels.map((model) => (
                <div key={model.name} className="flex items-center gap-3">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: model.color }} />
                  <span className="text-sm text-slate-700">{model.name}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
            <p className="text-xs uppercase tracking-[0.2em] font-semibold text-slate-500 flex items-center gap-2">
              <Target size={14} /> Evaluation Dimensions
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              {evaluationDimensionsPipeline.map((dim, idx) => (
                <div key={dim} className="flex items-center gap-2">
                  <span className="text-xs font-medium text-indigo-500 w-4">{idx + 1}.</span>
                  <span className="text-sm text-slate-700">{dim}</span>
                </div>
              ))}
            </div>
          </motion.div>
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
