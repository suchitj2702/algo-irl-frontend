import type { ReactNode } from 'react';

const chartCardClass =
  'rounded-2xl border border-outline-subtle/40 bg-white p-5 shadow-sm text-content';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

function ChartCard({ title, subtitle, children }: ChartCardProps) {
  return (
    <div className={chartCardClass}>
      <div className="mb-4 space-y-1">
        <p className="text-xs uppercase tracking-[0.3em] text-content-muted">{title}</p>
        {subtitle && <p className="text-sm text-content-muted">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

const teacherDimensions = [
  { label: 'Algorithmic Correctness', claude: 0.95, gpt5: 0.91, gemini: 0.86 },
  { label: 'Parsing Quality', claude: 0.91, gpt5: 0.83, gemini: 0.78 },
  { label: 'Technical Accuracy', claude: 0.87, gpt5: 0.82, gemini: 0.75 },
  { label: 'Company Relevance', claude: 0.78, gpt5: 0.74, gemini: 0.7 },
  { label: 'Role Specificity', claude: 0.63, gpt5: 0.66, gemini: 0.58 },
  { label: 'Scenario Realism', claude: 0.64, gpt5: 0.65, gemini: 0.62 }
];

const radarModels = [
  { key: 'claude', label: 'Claude Sonnet 4', stroke: '#0f172a', fill: 'rgba(15, 23, 42, 0.18)' },
  { key: 'gpt5', label: 'GPT-5', stroke: '#0ea5e9', fill: 'rgba(14, 165, 233, 0.18)' },
  { key: 'gemini', label: 'Gemini 2.5 Pro', stroke: '#f43f5e', fill: 'rgba(244, 63, 94, 0.15)' }
] as const;

export function TeacherModelComparisonDiagram() {
  const size = 360;
  const center = size / 2;
  const radius = center - 40;
  const angleStep = (Math.PI * 2) / teacherDimensions.length;

  const toPoint = (score: number, index: number) => {
    const angle = -Math.PI / 2 + index * angleStep;
    const dist = radius * score;
    return {
      x: center + dist * Math.cos(angle),
      y: center + dist * Math.sin(angle)
    };
  };

  const pathFor = (key: string) => {
    const points = teacherDimensions.map((dimension, idx) => {
      const score = (dimension as Record<string, number>)[key];
      const { x, y } = toPoint(score, idx);
      return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(2)},${y.toFixed(2)}`;
    });
    return points.join(' ') + ' Z';
  };

  return (
    <ChartCard
      title="Teacher Model Comparison"
      subtitle="Radar plot highlights Claude 4’s lead on fidelity and structure."
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
        <svg width={size} height={size} className="text-content-muted">
          {[0.4, 0.7, 1].map((level) => (
            <circle
              key={level}
              cx={center}
              cy={center}
              r={radius * level}
              className="fill-none stroke-outline-subtle/40"
              strokeDasharray="6 8"
            />
          ))}
          {teacherDimensions.map((dimension, idx) => {
            const { x, y } = toPoint(1, idx);
            const labelPoint = toPoint(1.12, idx);
            const words = dimension.label.split(' ');
            return (
              <g key={dimension.label}>
                <line x1={center} y1={center} x2={x} y2={y} className="stroke-outline-subtle/50" />
                <text
                  x={labelPoint.x}
                  y={labelPoint.y}
                  className="text-[11px] fill-content-muted"
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  {words.map((word, wordIdx) => (
                    <tspan key={wordIdx} x={labelPoint.x} dy={wordIdx === 0 ? 0 : 12}>
                      {word}
                    </tspan>
                  ))}
                </text>
              </g>
            );
          })}
          {radarModels.map((model) => (
            <path
              key={model.key}
              d={pathFor(model.key)}
              fill={model.fill}
              stroke={model.stroke}
              strokeWidth={2}
            />
          ))}
        </svg>
        <div className="flex-1 space-y-4">
          {radarModels.map((model) => (
            <div key={model.key} className="rounded-xl border border-outline-subtle/30 p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full" style={{ background: model.stroke }} />
                <div>
                  <p className="text-sm font-semibold">{model.label}</p>
                  <p className="text-xs text-content-muted">
                    Avg. score {(
                      teacherDimensions.reduce(
                        (sum, dimension) => sum + (dimension as Record<string, number>)[model.key],
                        0
                      ) / teacherDimensions.length
                    ).toFixed(3)}
                  </p>
                </div>
              </div>
              <span className="text-xs text-content-muted">
                Peaks: {teacherDimensions
                  .filter((dimension) => (dimension as Record<string, number>)[model.key] >= 0.9)
                  .map((dimension) => dimension.label.split(' ')[0])
                  .join(', ') || '—'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </ChartCard>
  );
}

const funnelSteps = [
  { label: 'Generated', value: 7500, note: 'Combinatorial program' },
  { label: 'Passed validation', value: 6532, note: 'Structure + correctness' },
  { label: 'Training set', value: 6032, note: 'Used for updates' },
  { label: 'Validation set', value: 1064, note: 'Held-out scoring' }
];

export function QualityValidationFunnelDiagram() {
  const maxValue = funnelSteps[0]?.value ?? 0;
  const width = 280;
  const height = 260;
  const stepHeight = height / funnelSteps.length;
  const centerX = width / 2;
  const colors = ['#dbeafe', '#bfdbfe', '#93c5fd', '#3b82f6'];

  const polygonForStep = (index: number) => {
    const current = funnelSteps[index];
    const nextValue =
      funnelSteps[index + 1]?.value ??
      Math.max(funnelSteps[index].value * 0.2, maxValue * 0.05);
    const topWidth = (current.value / maxValue) * width;
    const bottomWidth = (nextValue / maxValue) * width;
    const y = index * stepHeight;
    return `${centerX - topWidth / 2},${y} ${centerX + topWidth / 2},${y} ${centerX + bottomWidth / 2},${
      y + stepHeight
    } ${centerX - bottomWidth / 2},${y + stepHeight}`;
  };

  return (
    <ChartCard
      title="Quality Validation Funnel"
      subtitle="Each stage narrows the dataset until only parse-perfect examples remain."
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-4">
          {funnelSteps.map((step, idx) => (
            <div key={step.label} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <span
                    className="h-2 w-8 rounded-full"
                    style={{ backgroundColor: colors[idx] }}
                  />
                  <span className="font-medium">{step.label}</span>
                </div>
                <span className="text-content-muted text-xs">{step.value.toLocaleString()} items</span>
              </div>
              <p className="text-xs text-content-muted">{step.note}</p>
              {idx < funnelSteps.length - 1 && (
                <div className="h-px bg-outline-subtle/30" />
              )}
            </div>
          ))}
        </div>
        <svg width={width} height={height} className="justify-self-center drop-shadow-sm">
          {funnelSteps.map((step, idx) => (
            <polygon
              key={step.label}
              points={polygonForStep(idx)}
              fill={colors[idx]}
              stroke="rgba(15,23,42,0.1)"
              strokeWidth={1.5}
            />
          ))}
          <rect
            x={centerX - (width * 0.08) / 2}
            y={height - stepHeight * 0.4}
            width={width * 0.08}
            height={stepHeight * 0.4}
            fill="#1d4ed8"
            rx={2}
          />
        </svg>
      </div>
    </ChartCard>
  );
}

const roleDistribution = [
  { label: 'Backend', value: 1510 },
  { label: 'ML', value: 1208 },
  { label: 'Frontend', value: 1205 },
  { label: 'Infrastructure', value: 1055 },
  { label: 'Security', value: 1054 }
];

const difficultyDistribution = [
  { label: 'Easy', value: 2011 },
  { label: 'Medium', value: 2814 },
  { label: 'Hard', value: 1207 }
];

export function TrainingDataDistributionDiagram() {
  const maxRole = Math.max(...roleDistribution.map((d) => d.value));
  const maxDifficulty = Math.max(...difficultyDistribution.map((d) => d.value));

  return (
    <ChartCard title="Training Data Distribution" subtitle="Balance was intentional across roles and complexity.">
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-content-muted">Roles</p>
          {roleDistribution.map((role) => (
            <div key={role.label}>
              <div className="flex justify-between text-sm">
                <span>{role.label}</span>
                <span className="text-content-muted">{role.value}</span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-panel-100">
                <div
                  className="h-full rounded-full bg-slate-500"
                  style={{ width: `${(role.value / maxRole) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-content-muted">Difficulty</p>
          {difficultyDistribution.map((difficulty) => (
            <div key={difficulty.label}>
              <div className="flex justify-between text-sm">
                <span>{difficulty.label}</span>
                <span className="text-content-muted">{difficulty.value}</span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-panel-100">
                <div
                  className="h-full rounded-full bg-slate-500"
                  style={{ width: `${(difficulty.value / maxDifficulty) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-5 rounded-xl border border-outline-subtle/30 p-4 text-sm text-content-muted">
        <p>Tokens processed: <span className="font-semibold text-content">42.5M</span></p>
        <p className="mt-1">Avg. example length: <span className="font-semibold text-content">7,051 tokens</span></p>
      </div>
    </ChartCard>
  );
}

const lossExperiments = [
  {
    name: 'GPT-4.1-nano',
    training: [0.42, 0.33, 0.285],
    validation: [0.39, 0.34, 0.315]
  },
  {
    name: 'Qwen3-Coder-30B',
    training: [0.58, 0.52, 0.48],
    validation: [0.63, 0.59, 0.55]
  },
  {
    name: 'Llama 3.1 8B',
    training: [0.65, 0.58, 0.54],
    validation: [0.7, 0.66, 0.63]
  }
];

function buildLinePath(values: number[], width: number, height: number, domain: [number, number]) {
  const [minValue, maxValue] = domain;
  const xStep = width / (values.length - 1);
  return values
    .map((value, index) => {
      const x = index * xStep;
      const normalized = (value - minValue) / (maxValue - minValue);
      const y = height - normalized * height;
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');
}

export function TrainingLossCurvesDiagram() {
  const width = 140;
  const height = 80;
  const domain: [number, number] = [0.25, 0.85];

  return (
    <ChartCard title="Training Loss Curves" subtitle="Three epochs per experiment, plotted as paired lines.">
      <div className="grid gap-4 sm:grid-cols-3">
        {lossExperiments.map((experiment) => (
          <div key={experiment.name} className="rounded-xl border border-outline-subtle/30 p-3">
            <p className="text-sm font-semibold">{experiment.name}</p>
            <svg width={width} height={height} className="mt-2">
              {[0.3, 0.4, 0.5, 0.6, 0.7].map((value) => {
                const normalized = (value - domain[0]) / (domain[1] - domain[0]);
                const y = height - normalized * height;
                return <line key={value} x1={0} x2={width} y1={y} y2={y} className="stroke-outline-subtle/30" />;
              })}
              <path
                d={buildLinePath(experiment.training, width, height, domain)}
                className="stroke-slate-600"
                strokeWidth={2}
                fill="none"
              />
              <path
                d={buildLinePath(experiment.validation, width, height, domain)}
                className="stroke-slate-400"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                fill="none"
              />
            </svg>
            <p className="mt-2 text-xs text-content-muted">Solid line → training. Dashed line → validation.</p>
          </div>
        ))}
      </div>
    </ChartCard>
  );
}

const modelComparisons = [
  { model: 'Claude Sonnet 4', detail: 'Teacher baseline', quality: 0.795, latency: 25, cost: 4.0, hosting: 'API' },
  { model: 'GPT-4.1-nano', detail: 'Fine-tuned student', quality: 0.784, latency: 2.5, cost: 0.08, hosting: 'API' },
  { model: 'Qwen3-Coder-30B', detail: 'LoRA, self-hosted', quality: 0.71, latency: 20, cost: 5.5, hosting: 'Self-hosted' },
  { model: 'Llama 3.1 8B', detail: 'LoRA, serverless', quality: 0.68, latency: 15, cost: 0.2, hosting: 'API' }
];

export function ModelComparisonMatrixDiagram() {
  return (
    <ChartCard title="Model Comparison Matrix" subtitle="Simple table highlights the trade-offs per model.">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-[0.2em] text-content-muted">
            <tr>
              <th className="py-2 pr-4">Model</th>
              <th className="py-2 pr-4">Quality</th>
              <th className="py-2 pr-4">Latency</th>
              <th className="py-2 pr-4">Cost / 1K</th>
              <th className="py-2 pr-4">Hosting</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-subtle/30">
            {modelComparisons.map((entry) => (
              <tr key={entry.model}>
                <td className="py-2 pr-4">
                  <p className="font-semibold">{entry.model}</p>
                  <p className="text-xs text-content-muted">{entry.detail}</p>
                </td>
                <td className="py-2 pr-4">{entry.quality.toFixed(3)}</td>
                <td className="py-2 pr-4">{entry.latency}s</td>
                <td className="py-2 pr-4">${entry.cost.toFixed(2)}</td>
                <td className="py-2 pr-4 text-content-muted">{entry.hosting}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ChartCard>
  );
}

const architectureStages = [
  { title: 'Claude Sonnet 4', description: 'Highest structural fidelity on evaluations.' },
  { title: 'Evaluation + Filtering', description: 'LLM-as-a-judge + parsing QA on 7.5K generations.' },
  { title: 'Fine-tuned GPT-4.1-nano', description: '96% quality, 10× faster, 95% cheaper.' }
];

export function TeacherStudentArchitectureDiagram() {
  return (
    <ChartCard title="Teacher → Student Flow" subtitle="A three-step knowledge distillation loop.">
      <div className="space-y-6">
        {architectureStages.map((stage, idx) => (
          <div key={stage.title} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="h-3 w-3 rounded-full bg-slate-600" />
              {idx < architectureStages.length - 1 && (
                <div className="flex-1 w-px bg-outline-subtle/50 mt-1" />
              )}
            </div>
            <div>
              <p className="text-sm font-semibold">{stage.title}</p>
              <p className="text-sm text-content-muted">{stage.description}</p>
            </div>
          </div>
        ))}
      </div>
    </ChartCard>
  );
}

const evaluationDimensions = [
  { label: 'Algorithmic correctness', value: 0.982 },
  { label: 'Company relevance', value: 0.749 },
  { label: 'Role specificity', value: 0.568 },
  { label: 'Scenario realism', value: 0.596 },
  { label: 'Technical accuracy', value: 0.885 },
  { label: 'Parsing quality', value: 0.923 }
];

export function EvaluationFrameworkDiagram() {
  return (
    <ChartCard title="Evaluation Framework" subtitle="Six equally weighted rubrics roll up into the final score.">
      <dl className="space-y-3">
        {evaluationDimensions.map((dimension) => (
          <div key={dimension.label}>
            <dt className="text-sm text-content-muted">{dimension.label}</dt>
            <dd className="flex items-center gap-3">
              <span className="text-lg font-semibold">{dimension.value.toFixed(3)}</span>
              <div className="flex-1 h-1 rounded-full bg-panel-100">
                <div
                  className="h-full rounded-full bg-slate-600"
                  style={{ width: `${dimension.value * 100}%` }}
                />
              </div>
            </dd>
          </div>
        ))}
      </dl>
    </ChartCard>
  );
}

const comparisonDimensions = [
  { label: 'Algorithmic correctness', claude: 0.95, student: 0.982 },
  { label: 'Parsing quality', claude: 0.91, student: 0.923 },
  { label: 'Technical accuracy', claude: 0.87, student: 0.885 },
  { label: 'Company relevance', claude: 0.78, student: 0.749 },
  { label: 'Role specificity', claude: 0.63, student: 0.568 },
  { label: 'Scenario realism', claude: 0.64, student: 0.596 }
];

export function EvaluationComparisonDiagram() {
  return (
    <ChartCard title="Evaluation Comparison" subtitle="Claude (teacher) vs GPT-4.1-nano (student).">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-[0.2em] text-content-muted">
            <tr>
              <th className="py-2 pr-4">Dimension</th>
              <th className="py-2 pr-4">Claude</th>
              <th className="py-2 pr-4">GPT-4.1-nano</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-subtle/30">
            {comparisonDimensions.map((dimension) => (
              <tr key={dimension.label}>
                <td className="py-2 pr-4">{dimension.label}</td>
                <td className="py-2 pr-4">{dimension.claude.toFixed(3)}</td>
                <td className="py-2 pr-4">{dimension.student.toFixed(3)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ChartCard>
  );
}

const costSeries = [
  { volume: 1000, claude: 4, student: 0.08 },
  { volume: 10000, claude: 40, student: 0.8 },
  { volume: 100000, claude: 400, student: 8 },
  { volume: 1000000, claude: 4000, student: 80 }
];

export function CostComparisonChart() {
  return (
    <ChartCard title="Cost Comparison" subtitle="Monthly inference cost by request volume.">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-[0.2em] text-content-muted">
            <tr>
              <th className="py-2 pr-4">Monthly volume</th>
              <th className="py-2 pr-4">Claude Sonnet 4</th>
              <th className="py-2 pr-4">Fine-tuned GPT-4.1-nano</th>
              <th className="py-2 pr-4">Savings</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-subtle/30">
            {costSeries.map((entry) => (
              <tr key={entry.volume}>
                <td className="py-2 pr-4">{entry.volume.toLocaleString()}</td>
                <td className="py-2 pr-4">${entry.claude.toFixed(2)}</td>
                <td className="py-2 pr-4">${entry.student.toFixed(2)}</td>
                <td className="py-2 pr-4 text-emerald-600">
                  ${(entry.claude - entry.student).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ChartCard>
  );
}

const monthlySavings = 392;
const setupCost = 351.6;
const roiTimeline = Array.from({ length: 12 }, (_, idx) => {
  const month = idx + 1;
  const cumulative = month * monthlySavings - setupCost;
  return { month, cumulative };
});

export function RoiTimelineDiagram() {
  const width = 320;
  const height = 140;
  const maxValue = Math.max(...roiTimeline.map((d) => d.cumulative));
  const points = roiTimeline
    .map((point, idx) => {
      const x = (idx / (roiTimeline.length - 1)) * width;
      const y = height - (point.cumulative / maxValue) * height;
      return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');

  return (
    <ChartCard title="ROI Timeline" subtitle="Cumulative savings at current production volume.">
      <svg width={width} height={height} className="w-full">
        <path d={points} fill="none" stroke="#0f172a" strokeWidth={2} />
        {roiTimeline.map((point, idx) => {
          const x = (idx / (roiTimeline.length - 1)) * width;
          const y = height - (point.cumulative / maxValue) * height;
          return <circle key={point.month} cx={x} cy={y} r={2} className="fill-slate-600" />;
        })}
      </svg>
      <div className="mt-4 text-sm text-content-muted">
        Break-even: <span className="font-semibold text-content">~90K transformations</span>
      </div>
    </ChartCard>
  );
}

export function TcoComparisonDiagram() {
  const claude = 4800;
  const student = 447.63;
  const maxValue = claude;

  return (
    <ChartCard title="12-Month TCO Comparison" subtitle="Scenario: 100K transformations per month.">
      <div className="space-y-4 text-sm">
        <div>
          <div className="flex justify-between text-content-muted">
            <span>Claude Sonnet 4</span>
            <span>${claude.toLocaleString()}</span>
          </div>
          <div className="mt-1 h-3 rounded-full bg-panel-100">
            <div
              className="h-full rounded-full bg-slate-600"
              style={{ width: `${(claude / maxValue) * 100}%` }}
            />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-content-muted">
            <span>Fine-tuned GPT-4.1-nano</span>
            <span>${student.toLocaleString()}</span>
          </div>
          <div className="mt-1 h-3 rounded-full bg-panel-100">
            <div
              className="h-full rounded-full bg-slate-600"
              style={{ width: `${(student / maxValue) * 100}%` }}
            />
          </div>
        </div>
        <p className="text-xs text-content-muted">
          Savings after 12 months: ${(claude - student).toLocaleString()} (91% reduction)
        </p>
      </div>
    </ChartCard>
  );
}

// Projected growth: 5K (month 1) to 50K (month 12) with slight exponential curve
// Using formula: volume = 5000 * (50000/5000)^((month-1)/11) for smooth growth
const projectedGrowthData = Array.from({ length: 12 }, (_, idx) => {
  const month = idx + 1;
  const growthFactor = Math.pow(50000 / 5000, idx / 11);
  const volume = Math.round(5000 * growthFactor);
  return { month, volume };
});

// Calculate accumulated costs for each month
const projectedCostData = projectedGrowthData.map((data, idx) => {
  const claudeCostPerRequest = 0.045; // $45 per 1K
  const nanoCostPerRequest = 0.0013; // $1.30 per 1K
  const setupCost = 351.6;

  // Accumulated volume up to this month
  const accumulatedVolume = projectedGrowthData
    .slice(0, idx + 1)
    .reduce((sum, d) => sum + d.volume, 0);

  const claudeAccumulated = accumulatedVolume * claudeCostPerRequest;
  const nanoAccumulated = accumulatedVolume * nanoCostPerRequest + setupCost;

  return {
    month: data.month,
    volume: data.volume,
    accumulatedVolume,
    claudeAccumulated: Math.round(claudeAccumulated),
    nanoAccumulated: Math.round(nanoAccumulated)
  };
});

export function ProjectedCostGrowthDiagram() {
  const width = 620;
  const costChartHeight = 180;
  const volumeChartHeight = 100;
  const gap = 24;
  const totalHeight = costChartHeight + gap + volumeChartHeight + 24;
  const padding = { top: 24, right: 70, bottom: 20, left: 65 };
  const chartWidth = width - padding.left - padding.right;

  const maxCost = Math.max(...projectedCostData.map((d) => d.claudeAccumulated));
  const maxVolume = Math.max(...projectedCostData.map((d) => d.volume));

  const xScale = (month: number) => padding.left + ((month - 1) / 11) * chartWidth;
  const yScaleCost = (cost: number) => padding.top + costChartHeight - (cost / maxCost) * costChartHeight;
  const volumeBarMaxHeight = 55;

  const claudePath = projectedCostData
    .map((d, idx) => `${idx === 0 ? 'M' : 'L'} ${xScale(d.month).toFixed(1)},${yScaleCost(d.claudeAccumulated).toFixed(1)}`)
    .join(' ');

  const nanoPath = projectedCostData
    .map((d, idx) => `${idx === 0 ? 'M' : 'L'} ${xScale(d.month).toFixed(1)},${yScaleCost(d.nanoAccumulated).toFixed(1)}`)
    .join(' ');

  // Savings area between the two lines
  const savingsAreaPath = claudePath +
    projectedCostData.slice().reverse().map((d) => ` L ${xScale(d.month).toFixed(1)},${yScaleCost(d.nanoAccumulated).toFixed(1)}`).join('') +
    ' Z';

  const finalClaude = projectedCostData[11].claudeAccumulated;
  const finalNano = projectedCostData[11].nanoAccumulated;
  const totalSavings = finalClaude - finalNano;

  const volumeChartTop = padding.top + costChartHeight + gap;

  // Format volume for display (e.g., 5K, 12K, 50K)
  const formatVolume = (v: number) => v >= 1000 ? `${Math.round(v / 1000)}K` : v.toString();

  return (
    <ChartCard
      title="12-Month Projected API Costs"
      subtitle="Accumulated costs as monthly transformation volume grows"
    >
      <div className="space-y-3">
        <svg width={width} height={totalHeight} className="w-full" viewBox={`0 0 ${width} ${totalHeight}`}>
          {/* Cost Chart Section */}
          <text
            x={padding.left}
            y={padding.top - 8}
            className="text-[11px] fill-content-muted font-medium"
          >
            Accumulated Cost
          </text>

          {/* Cost grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = padding.top + costChartHeight * (1 - ratio);
            const value = Math.round(maxCost * ratio);
            return (
              <g key={ratio}>
                <line
                  x1={padding.left}
                  x2={padding.left + chartWidth}
                  y1={y}
                  y2={y}
                  className="stroke-outline-subtle/20"
                  strokeDasharray="3 3"
                />
                <text
                  x={padding.left - 10}
                  y={y}
                  className="text-[10px] fill-content-muted"
                  textAnchor="end"
                  dominantBaseline="middle"
                >
                  ${value.toLocaleString()}
                </text>
              </g>
            );
          })}

          {/* Savings area fill */}
          <path d={savingsAreaPath} fill="rgba(34, 197, 94, 0.1)" />

          {/* Gradients */}
          <defs>
            <linearGradient id="claudeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f87171" />
              <stop offset="100%" stopColor="#dc2626" />
            </linearGradient>
            <linearGradient id="nanoGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#4ade80" />
              <stop offset="100%" stopColor="#16a34a" />
            </linearGradient>
            <linearGradient id="volumeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#a5b4fc" />
            </linearGradient>
          </defs>

          {/* Cost lines */}
          <path d={claudePath} fill="none" stroke="url(#claudeGradient)" strokeWidth={2.5} strokeLinecap="round" />
          <path d={nanoPath} fill="none" stroke="url(#nanoGradient)" strokeWidth={2.5} strokeLinecap="round" />

          {/* Data points with white fill */}
          {projectedCostData.map((d) => (
            <g key={`points-${d.month}`}>
              <circle cx={xScale(d.month)} cy={yScaleCost(d.claudeAccumulated)} r={3.5} fill="white" stroke="#dc2626" strokeWidth={1.5} />
              <circle cx={xScale(d.month)} cy={yScaleCost(d.nanoAccumulated)} r={3.5} fill="white" stroke="#16a34a" strokeWidth={1.5} />
            </g>
          ))}

          {/* End cost labels */}
          <text
            x={xScale(12) + 8}
            y={yScaleCost(finalClaude)}
            className="text-[10px] fill-red-600 font-semibold"
            dominantBaseline="middle"
          >
            ${finalClaude.toLocaleString()}
          </text>
          <text
            x={xScale(12) + 8}
            y={yScaleCost(finalNano)}
            className="text-[10px] fill-green-600 font-semibold"
            dominantBaseline="middle"
          >
            ${finalNano.toLocaleString()}
          </text>

          {/* Volume Chart Section */}
          <text
            x={padding.left}
            y={volumeChartTop - 8}
            className="text-[11px] fill-content-muted font-medium"
          >
            Monthly Transformations
          </text>

          {/* Volume bars */}
          {projectedCostData.map((d) => {
            const barHeight = (d.volume / maxVolume) * volumeBarMaxHeight;
            const barWidth = chartWidth / 12 - 6;
            const x = xScale(d.month) - barWidth / 2;
            const y = volumeChartTop + volumeBarMaxHeight - barHeight;

            return (
              <g key={`vol-${d.month}`}>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill="url(#volumeGradient)"
                  rx={3}
                />
                {/* Volume label on top of bar */}
                <text
                  x={xScale(d.month)}
                  y={y - 5}
                  className="text-[9px] fill-indigo-600 font-medium"
                  textAnchor="middle"
                >
                  {formatVolume(d.volume)}
                </text>
                {/* Month label below bar */}
                <text
                  x={xScale(d.month)}
                  y={volumeChartTop + volumeBarMaxHeight + 16}
                  className="text-[10px] fill-content-muted"
                  textAnchor="middle"
                >
                  {d.month}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
            <span className="text-content-muted text-xs">Claude Sonnet 4</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
            <span className="text-content-muted text-xs">Fine-tuned GPT-4.1-nano</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-4 rounded bg-indigo-400" />
            <span className="text-content-muted text-xs">Monthly volume</span>
          </div>
          <div className="flex items-center gap-2 ml-4 pl-4 border-l border-outline-subtle/40">
            <span className="text-content-muted text-xs">12-month savings:</span>
            <span className="text-green-600 font-semibold text-xs">${totalSavings.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </ChartCard>
  );
}

const diagramMap: Record<string, ReactNode> = {
  'Teacher Model Comparison': <TeacherModelComparisonDiagram />,
  'Quality Funnel': <QualityValidationFunnelDiagram />,
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
