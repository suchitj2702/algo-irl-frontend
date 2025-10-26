import type { FormEvent } from 'react';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Activity,
  ArrowRightIcon,
  BarChart4,
  CheckCircle2,
  CircleDot,
  ClipboardList,
  Layers,
  Lock,
  Play,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
} from 'lucide-react';
import { useDarkMode } from '../../DarkModeContext';
import { ThinkingIndicator } from '../../ThinkingIndicator';
import { prepareProblem } from '../../../utils/api-service';

interface IntroSectionProps {
  onStartClick: () => void;
}

type HeroVariant = 'fear' | 'aspiration';

interface HeroCopy {
  eyebrow: string;
  headline: string;
  subheadline: string;
  primaryCta: string;
  secondaryCta: string;
  proofPoints: string[];
}

const HERO_VARIANTS: Record<HeroVariant, HeroCopy> = {
  fear: {
    eyebrow: 'Interview prep that mirrors the real onsite loop',
    headline:
      "Solved 200 LeetCode problems yet unsure what Amazon actually asks?",
    subheadline:
      'AlgoIRL keeps the algorithm but rewrites the scenario in the language Amazon, Netflix, and Stripe interviewers expect. Anchor your answers in real systems instead of abstract puzzles.',
    primaryCta: 'Start free with Blind 75 in context',
    secondaryCta: 'See how transformations work',
    proofPoints: [
      '20 high-demand companies covered',
      'Role-specific narratives baked in',
      'No credit card required',
    ],
  },
  aspiration: {
    eyebrow: 'From grind to conviction in under ten minutes',
    headline: 'Practice the way senior interviewers evaluate engineers',
    subheadline:
      'Spin up company-ready prompts for your next interview loop. AlgoIRL adds stakeholder trade-offs, system constraints, and follow-ups so you sound like an insider from the first answer.',
    primaryCta: 'Generate my first transformation',
    secondaryCta: 'Explore the interactive demo',
    proofPoints: [
      'Role-first preparation for ML, Backend, Security',
      'Blind 75 transformations included',
      'Keep momentum with guided study plans',
    ],
  },
};

const HERO_COMPANIES = [
  'Netflix',
  'Amazon',
  'Stripe',
  'Meta',
  'Google',
  'Microsoft',
  'Spotify',
  'Uber',
  'Apple',
  'Airbnb',
  'Tesla',
  'Databricks',
  'Dropbox',
  'DoorDash',
  'Coinbase',
  'Snowflake',
  'Figma',
  'Notion',
  'Canva',
  'Discord',
] as const;

const TRUST_POINTS = [
  {
    title: 'Guided by 2025 hiring data',
    description:
      '47% of hiring teams now evaluate “real-world tasks” ahead of puzzle recall (CoderPad Global Hiring Report).',
  },
  {
    title: '20 vetted company playbooks',
    description:
      'We focus on the top 20 companies our research shows appear most in senior interview calendars.',
  },
  {
    title: 'Built for judgement rounds',
    description:
      'Blend technical depth with product reasoning so you can handle the “why” questions confidently.',
  },
] as const;

const PROBLEM_OPTIONS = [
  { id: 'two-sum', label: 'Two Sum' },
  { id: 'contains-duplicate', label: 'Contains Duplicate' },
  { id: 'valid-anagram', label: 'Valid Anagram' },
] as const;

const COMPANY_OPTIONS = [
  { id: 'amazon', label: 'Amazon' },
  { id: 'netflix', label: 'Netflix' },
  { id: 'stripe', label: 'Stripe' },
] as const;

const ROLE_OPTIONS = [
  { id: 'backend', label: 'Backend' },
  { id: 'ml', label: 'ML' },
  { id: 'security', label: 'Security' },
] as const;

interface DemoState {
  problemStatement: string;
  background?: string;
  title?: string;
}

const BENEFITS = [
  {
    icon: Layers,
    title: 'Translate algorithms into real systems',
    description:
      'Each prompt pairs the familiar algorithm with the systems, constraints, and metrics interviewers care about.',
    footer: 'Explain trade-offs under production constraints.',
  },
  {
    icon: Activity,
    title: 'Role-specific signal',
    description:
      'Craft answers that highlight the considerations unique to backend, ML, and security roles.',
    footer: 'Arrive ready for cross-functional follow-ups.',
  },
  {
    icon: Users,
    title: 'Engineering narratives that land',
    description:
      'Use stakeholder framing, metrics, and pull-through messaging tuned to the hiring panel’s expectations.',
    footer: 'Sound like a teammate — not a test taker.',
  },
  {
    icon: ShieldCheck,
    title: 'Privacy-first workspace',
    description:
      'Your code stays local until you decide to sync. No trackers, no third-party data resale.',
    footer: 'Focus on depth without worrying about leaks.',
  },
  {
    icon: ClipboardList,
    title: 'Study plans that stay on course',
    description:
      'Blind 75 transformations guide the free tier. Upgrade when you’re ready for the full 2,000+ dataset.',
    footer: 'Momentum without micromanaging spreadsheets.',
  },
  {
    icon: BarChart4,
    title: 'Feedback rooted in actual loops',
    description:
      'We continuously compare outputs against real interview transcripts to keep prompts accurate and current.',
    footer: 'Prep evolves with interviewer expectations.',
  },
] as const;

const STEPS = [
  {
    icon: Target,
    title: 'Pick the company and role',
    description:
      'Align your prep with the loop you have scheduled — Amazon SDE3, Netflix ML, or Stripe Security.',
    detail: 'Switch contexts without losing algorithm depth.',
  },
  {
    icon: Sparkles,
    title: 'Generate an AlgoIRL prompt',
    description:
      'AlgoIRL rewrites the algorithm around the systems, constraints, and follow-ups unique to that team.',
    detail: 'No two transformations are identical.',
  },
  {
    icon: CheckCircle2,
    title: 'Practice with conviction',
    description:
      'Walk into onsites ready to speak in the company’s language, backed by tangible metrics and trade-offs.',
    detail: 'Confidence from context, not memorisation.',
  },
] as const;

const FAQ_ITEMS = [
  {
    question: 'What do I get on the free plan?',
    answer:
      'The free plan includes the full Blind 75 set with AlgoIRL transformations, adaptive study plans for short prep windows, and our privacy-first editor.',
  },
  {
    question: 'Why upgrade to the $5 comprehensive tier?',
    answer:
      'Upgrading unlocks the 2,000+ problem dataset inside study plans. You keep the same experience, but AlgoIRL can pull from the full library when building long-form prep.',
  },
  {
    question: 'How “real” are the company scenarios?',
    answer:
      'We interview engineers, hiring managers, and loop coordinators every quarter. Scenarios reflect current product priorities, architecture patterns, and role expectations.',
  },
  {
    question: 'Can I still use my existing LeetCode workflow?',
    answer:
      'Yes. Keep solving on LeetCode. AlgoIRL layers in the context you will reference during interviews, so your answers connect directly to the company’s stack.',
  },
  {
    question: 'Do I need to share my code to use AlgoIRL?',
    answer:
      'No. Everything runs in your browser. If you opt into syncing, we encrypt your data and never resell or train third-party models on it.',
  },
] as const;

const FINAL_PROOF = [
  'No credit card required to start',
  'Context-rich prompts in under 10 seconds',
  'Trusted by engineers preparing for the top 20 companies',
] as const;

function recordLandingEvent(eventName: string, payload?: Record<string, unknown>) {
  if (typeof window === 'undefined') {
    return;
  }

  const globalAny = window as unknown as {
    gtag?: (...args: unknown[]) => void;
    va?: { track?: (event: string, data?: Record<string, unknown>) => void };
  };

  if (typeof globalAny.gtag === 'function') {
    globalAny.gtag('event', eventName, payload ?? {});
  }

  if (typeof globalAny.va?.track === 'function') {
    globalAny.va.track(eventName, payload ?? {});
  }
}

export function IntroSection({ onStartClick }: IntroSectionProps) {
  const currentYear = new Date().getFullYear();
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  const [heroCompanyIndex, setHeroCompanyIndex] = useState(0);
  const [email, setEmail] = useState('');

  const heroVariant = useMemo<HeroVariant>(() => {
    const rawVariant = (import.meta.env.VITE_LANDING_HERO_VARIANT ?? '') as HeroVariant;
    return rawVariant && rawVariant in HERO_VARIANTS ? rawVariant : 'fear';
  }, []);

  const heroCopy = HERO_VARIANTS[heroVariant];

  useEffect(() => {
    const interval = window.setInterval(() => {
      setHeroCompanyIndex((index) => (index + 1) % HERO_COMPANIES.length);
    }, 2200);

    return () => window.clearInterval(interval);
  }, []);

  const [selectedProblem, setSelectedProblem] = useState<(typeof PROBLEM_OPTIONS)[number]['id']>('two-sum');
  const [selectedCompany, setSelectedCompany] = useState<(typeof COMPANY_OPTIONS)[number]['id']>('amazon');
  const [selectedRole, setSelectedRole] = useState<(typeof ROLE_OPTIONS)[number]['id']>('backend');

  const [demoState, setDemoState] = useState<DemoState | null>(null);
  const [demoError, setDemoError] = useState<string | null>(null);
  const [isTransforming, setIsTransforming] = useState(false);

  const activeTransformRequest = useRef<AbortController | null>(null);

  const handlePrimaryCta = useCallback(() => {
    recordLandingEvent('landing_primary_cta', { variant: heroVariant });
    onStartClick();
  }, [heroVariant, onStartClick]);

  const handleSeeDemo = useCallback(() => {
    recordLandingEvent('landing_scroll_demo');
    document.getElementById('live-demo')?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handleHeroSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      handlePrimaryCta();
    },
    [handlePrimaryCta],
  );

  const handleTransform = useCallback(async () => {
    if (isTransforming) {
      return;
    }

    recordLandingEvent('landing_demo_transform_request', {
      problem: selectedProblem,
      company: selectedCompany,
      role: selectedRole,
    });

    if (activeTransformRequest.current) {
      activeTransformRequest.current.abort();
    }

    const controller = new AbortController();
    activeTransformRequest.current = controller;

    setIsTransforming(true);
    setDemoError(null);

    try {
      const response = await prepareProblem(
        selectedProblem,
        selectedCompany,
        undefined,
        true,
        selectedRole,
      );

      if (controller.signal.aborted) {
        return;
      }

      const problem = response.problem || {};
      setDemoState({
        title: problem.title,
        background: problem.background,
        problemStatement: problem.problemStatement || 'AlgoIRL is generating a contextualised prompt. Try again if nothing appears in a few seconds.',
      });
      setIsTransforming(false);
      recordLandingEvent('landing_demo_transform_success', {
        problem: selectedProblem,
        company: selectedCompany,
        role: selectedRole,
      });
    } catch (error) {
      if (controller.signal.aborted) {
        return;
      }
      console.error('[Landing Demo] prepareProblem failed', error);
      setDemoError('We hit a snag generating that scenario. Try again or switch the company/role.');
      setIsTransforming(false);
      recordLandingEvent('landing_demo_transform_error', {
        problem: selectedProblem,
        company: selectedCompany,
        role: selectedRole,
      });
    }
  }, [isTransforming, selectedCompany, selectedProblem, selectedRole]);

  const activeHeroCompany = HERO_COMPANIES[heroCompanyIndex];

  return (
    <div className="bg-background text-content">
      <section className="relative overflow-hidden border-b border-outline-subtle/40">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 left-1/2 h-96 w-[38rem] -translate-x-1/2 rounded-full bg-mint/15 blur-3xl dark:bg-mint/10" />
          <div className="absolute bottom-10 right-6 h-72 w-72 rounded-full bg-navy/10 blur-3xl dark:bg-navy/20" />
        </div>
        <div className="relative mx-auto flex max-w-6xl flex-col gap-16 px-6 pb-24 pt-16 lg:flex-row lg:items-start lg:pb-28 lg:pt-24">
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 rounded-full border border-outline-subtle/50 bg-surface/70 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-content-muted">
                <CircleDot className="h-3.5 w-3.5 text-mint" />
                {heroCopy.eyebrow}
              </span>
              <button
                type="button"
                onClick={toggleDarkMode}
                className="rounded-full border border-outline-subtle/50 bg-surface/70 px-4 py-2 text-xs font-medium text-content-muted transition hover:text-content"
              >
                {isDarkMode ? 'Light mode' : 'Dark mode'}
              </button>
            </div>

            <h1 className="mt-8 text-4xl font-black tracking-tight text-content sm:text-5xl lg:text-[3.25rem]">
              <span className="font-playfair text-slate-900 dark:text-slate-100">
                AlgoIRL
              </span>{' '}
              {heroCopy.headline.replace('AlgoIRL ', '')}
            </h1>

            <p className="mt-6 max-w-2xl text-lg text-content-muted sm:text-xl">
              {heroCopy.subheadline}
            </p>

            <form
              onSubmit={handleHeroSubmit}
              className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
              aria-label="Start free with AlgoIRL"
            >
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="Email (so we can save your progress)"
                className="w-full rounded-2xl border border-outline-subtle/60 bg-surface/80 px-5 py-4 text-base text-content shadow-subtle transition focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint sm:w-72"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-2xl border border-button-700 bg-button-600 px-6 py-4 text-base font-medium text-button-foreground shadow-[0_1px_2px_rgba(63,74,88,0.25)] transition hover:bg-button-500 active:scale-[0.98]"
              >
                {heroCopy.primaryCta}
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </button>
            </form>

            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-content-muted">
              {heroCopy.proofPoints.map((point) => (
                <span key={point} className="inline-flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-mint" />
                  {point}
                </span>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4 text-sm text-content-muted">
              <button
                type="button"
                onClick={handleSeeDemo}
                className="inline-flex items-center gap-2 rounded-full border border-outline-subtle/50 px-4 py-2 font-medium transition hover:border-mint hover:text-content"
              >
                <Play className="h-4 w-4" />
                {heroCopy.secondaryCta}
              </button>
              <button
                type="button"
                onClick={handlePrimaryCta}
                className="inline-flex items-center gap-2 text-sm font-medium text-mint transition hover:text-mint/80"
              >
                Explore Blind 75 contextualised
                <ArrowRightIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          <aside className="w-full max-w-lg rounded-3xl border border-outline-subtle/40 bg-surface/80 p-6 shadow-subtle">
            <div className="text-xs font-semibold uppercase tracking-wide text-content-muted">
              Today&apos;s spotlight
            </div>
            <div className="mt-2 text-2xl font-semibold text-content">
              {activeHeroCompany}
            </div>
            <p className="mt-4 text-sm text-content-muted">
              Every transformation pulls from our interview research, so
              {` ${activeHeroCompany} `}
              candidates reference the systems and stakeholders those teams care about.
            </p>
            <div className="mt-6 grid gap-4 rounded-2xl border border-outline-subtle/40 bg-background/50 p-6 text-sm text-content-muted">
              <div className="font-medium text-content">Why AlgoIRL?</div>
              <div className="flex items-start gap-3">
                <Target className="mt-1 h-4 w-4 text-mint" />
                <p>
                  Tie classic algorithms back to the metrics, customer
                  experiences, and service constraints {activeHeroCompany} focuses on.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <Users className="mt-1 h-4 w-4 text-mint" />
                <p>
                  Reinforce judgement by referencing the cross-functional partners who join loop debriefs.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <Lock className="mt-1 h-4 w-4 text-mint" />
                <p>
                  Privacy-first workspace, so experimenting with new answers never exposes your prep.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="border-b border-outline-subtle/40 bg-surface/70">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12 lg:flex-row lg:items-center lg:justify-between">
          <div className="text-sm font-semibold uppercase tracking-wider text-content-muted">
            Built for engineers targeting
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-content">
            {HERO_COMPANIES.map((company) => (
              <span
                key={company}
                className="rounded-full border border-outline-subtle/50 bg-background/80 px-4 py-2"
              >
                {company}
              </span>
            ))}
          </div>
          <div className="flex flex-col gap-3 text-sm text-content-muted lg:max-w-sm">
            {TRUST_POINTS.map((point) => (
              <div key={point.title}>
                <span className="font-medium text-content">{point.title}</span>
                <span className="block">{point.description}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-b from-background via-background to-cream/30 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-semibold text-content sm:text-4xl">
              Why LeetCode mastery isn’t enough anymore
            </h2>
            <p className="mt-4 text-lg text-content-muted">
              Hiring panels now evaluate how you reason about impact, trade-offs, and reliability in production. AlgoIRL
              mirrors that shift.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <div className="rounded-3xl border border-outline-subtle/50 bg-surface/80 p-6 shadow-subtle">
              <div className="text-sm font-semibold text-content">Recurring challenge</div>
              <p className="mt-4 text-base text-content">
                “I solved this exact algorithm yesterday, but I freeze when asked how Amazon deploys it safely.”
              </p>
              <span className="mt-6 block text-xs uppercase tracking-wide text-content-muted">
                Source: onsite retro interviews
              </span>
            </div>
            <div className="rounded-3xl border border-outline-subtle/50 bg-surface/80 p-6 shadow-subtle">
              <div className="text-sm font-semibold text-content">Panel expectation</div>
              <p className="mt-4 text-base text-content">
                Interviewers now ask for customer impact, systems impact, and associated metrics within the first follow-up.
              </p>
              <span className="mt-6 block text-xs uppercase tracking-wide text-content-muted">
                Source: 2025 loop coordinator survey
              </span>
            </div>
            <div className="rounded-3xl border border-outline-subtle/50 bg-surface/80 p-6 shadow-subtle">
              <div className="text-sm font-semibold text-content">AlgoIRL solution</div>
              <p className="mt-4 text-base text-content">
                Every prompt includes the stakeholders, infrastructure, and measurable success criteria those teams look for.
              </p>
              <span className="mt-6 block text-xs uppercase tracking-wide text-content-muted">
                Updated quarterly with real interviews
              </span>
            </div>
          </div>
        </div>
      </section>

      <section id="live-demo" className="bg-background py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
            <div className="lg:w-[420px]">
              <h2 className="text-3xl font-semibold text-content sm:text-4xl">
                Try a transformation — no two are identical
              </h2>
              <p className="mt-4 text-lg text-content-muted">
                Pick a familiar problem, choose the company and role, then let AlgoIRL rewrite it using our research-backed
                prompts. Run it again to see a fresh take.
              </p>
              <div className="mt-6 rounded-3xl border border-outline-subtle/40 bg-surface/80 p-6 shadow-subtle">
                <div className="text-sm font-semibold text-content">1. Problem</div>
                <div className="mt-3 grid gap-2">
                  {PROBLEM_OPTIONS.map((problem) => (
                    <button
                      type="button"
                      key={problem.id}
                      onClick={() => setSelectedProblem(problem.id)}
                      className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                        selectedProblem === problem.id
                          ? 'border-mint bg-mint/10 text-content'
                          : 'border-outline-subtle/50 text-content-muted hover:border-mint/80 hover:text-content'
                      }`}
                    >
                      {problem.label}
                    </button>
                  ))}
                </div>

                <div className="mt-6 text-sm font-semibold text-content">2. Company</div>
                <div className="mt-3 grid gap-2">
                  {COMPANY_OPTIONS.map((company) => (
                    <button
                      type="button"
                      key={company.id}
                      onClick={() => setSelectedCompany(company.id)}
                      className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                        selectedCompany === company.id
                          ? 'border-mint bg-mint/10 text-content'
                          : 'border-outline-subtle/50 text-content-muted hover:border-mint/80 hover:text-content'
                      }`}
                    >
                      {company.label}
                    </button>
                  ))}
                </div>

                <div className="mt-6 text-sm font-semibold text-content">3. Role</div>
                <div className="mt-3 grid gap-2">
                  {ROLE_OPTIONS.map((role) => (
                    <button
                      type="button"
                      key={role.id}
                      onClick={() => setSelectedRole(role.id)}
                      className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                        selectedRole === role.id
                          ? 'border-mint bg-mint/10 text-content'
                          : 'border-outline-subtle/50 text-content-muted hover:border-mint/80 hover:text-content'
                      }`}
                    >
                      {role.label}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleTransform}
                  className="mt-6 inline-flex w-full items-center justify-center rounded-2xl border border-button-700 bg-button-600 px-4 py-3 text-sm font-medium text-button-foreground transition hover:bg-button-500 active:scale-[0.98]"
                  disabled={isTransforming}
                >
                  {isTransforming ? 'Generating...' : 'Transform this problem'}
                  <Sparkles className="ml-2 h-4 w-4" />
                </button>
                <p className="mt-2 text-xs text-content-muted">
                  We log anonymised demo usage to keep improving the onboarding flow.
                </p>
              </div>
            </div>

            <div className="flex-1">
              <div className="rounded-3xl border border-outline-subtle/40 bg-surface/80 p-6 shadow-subtle">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-content-muted">
                      AlgoIRL Prompt
                    </div>
                    <div className="mt-1 text-lg font-semibold text-content">
                      {demoState?.title ?? 'Ready when you are'}
                    </div>
                  </div>
                  <Layers className="h-6 w-6 text-mint" />
                </div>

                <div className="mt-6 min-h-[220px] rounded-2xl border border-outline-subtle/40 bg-background/70 p-6">
                  {isTransforming ? (
                    <div className="flex h-full items-center justify-center">
                      <div className="flex flex-col items-center gap-3 text-sm text-content-muted">
                        <ThinkingIndicator
                          states={[
                            'Mapping company systems and stakeholders...',
                            'Grounding prompts in real interview loops...',
                            'Packaging the scenario for your next answer...',
                          ]}
                          typingSpeed={70}
                          deletingSpeed={40}
                          pauseDuration={1200}
                        />
                        <span>Shaping a fresh scenario for you...</span>
                      </div>
                    </div>
                  ) : demoError ? (
                    <div className="text-sm text-destructive">
                      {demoError}
                    </div>
                  ) : demoState ? (
                    <div className="space-y-4 text-sm leading-relaxed text-content">
                      {demoState.background && (
                        <p className="text-content-muted">{demoState.background}</p>
                      )}
                      <p>{demoState.problemStatement}</p>
                    </div>
                  ) : (
                    <div className="text-sm text-content-muted">
                      Select a combination and run the transformation to see how AlgoIRL reframes a familiar problem for
                      a specific company and role.
                    </div>
                  )}
                </div>

                <div className="mt-6 flex flex-col gap-2 text-sm text-content-muted">
                  <span className="font-medium text-content">Things to listen for:</span>
                  <ul className="space-y-1">
                    <li>• Stakeholders and metrics unique to the team</li>
                    <li>• Infrastructure realities you should mention</li>
                    <li>• Follow-up prompts you can prepare in advance</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-b from-background to-cream/30 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-semibold text-content sm:text-4xl">
              Outcomes engineers feel after using AlgoIRL
            </h2>
            <p className="mt-4 text-lg text-content-muted">
              We focus on the moment you speak with confidence in the interview room. Every capability supports that goal.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map((benefit) => (
              <div
                key={benefit.title}
                className="flex h-full flex-col rounded-3xl border border-outline-subtle/40 bg-surface/80 p-6 shadow-subtle transition hover:-translate-y-1 hover:shadow-medium"
              >
                <benefit.icon className="h-8 w-8 text-mint" />
                <h3 className="mt-6 text-xl font-semibold text-content">{benefit.title}</h3>
                <p className="mt-4 text-sm text-content-muted">{benefit.description}</p>
                <p className="mt-6 text-sm font-medium text-content">{benefit.footer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-background py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-3xl text-center">
            <h2 className="text-3xl font-semibold text-content sm:text-4xl">
              Get to confident interviews in three focused steps
            </h2>
            <p className="mt-4 text-lg text-content-muted">
              We engineered AlgoIRL to feel approachable from day one. Each step removes guesswork.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <div
                key={step.title}
                className="relative flex h-full flex-col rounded-3xl border border-outline-subtle/40 bg-surface/80 p-6 shadow-subtle"
              >
                <div className="absolute -top-4 left-6 inline-flex h-9 w-9 items-center justify-center rounded-full border border-mint bg-background text-sm font-semibold text-mint">
                  {index + 1}
                </div>
                <step.icon className="h-7 w-7 text-mint" />
                <h3 className="mt-8 text-xl font-semibold text-content">{step.title}</h3>
                <p className="mt-3 text-sm text-content-muted">{step.description}</p>
                <p className="mt-6 text-sm font-medium text-content">{step.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-b from-background to-cream/30 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-semibold text-content sm:text-4xl">
              Choose the plan that matches your prep horizon
            </h2>
            <p className="mt-4 text-lg text-content-muted">
              The only difference between plans is how deep your study plans can go. Everything else is included from day one.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <div className="flex h-full flex-col rounded-3xl border border-outline-subtle/50 bg-surface/80 p-8 shadow-subtle">
              <div className="text-sm font-semibold uppercase tracking-wide text-content-muted">Free</div>
              <div className="mt-3 text-3xl font-semibold text-content">$0</div>
              <div className="text-sm text-content-muted">Always available</div>
              <ul className="mt-6 space-y-3 text-sm text-content">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-[2px] h-4 w-4 text-mint" />
                  Blind 75 transformed for 20 companies
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-[2px] h-4 w-4 text-mint" />
                  Short-horizon study plans (2-6 weeks)
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-[2px] h-4 w-4 text-mint" />
                  Privacy-first code editor and execution
                </li>
              </ul>
              <button
                type="button"
                onClick={handlePrimaryCta}
                className="mt-8 inline-flex items-center justify-center rounded-2xl border border-outline-subtle/60 px-5 py-3 text-sm font-medium text-content transition hover:border-mint hover:text-mint"
              >
                Start free today
                <ArrowRightIcon className="ml-2 h-4 w-4" />
              </button>
            </div>

            <div className="flex h-full flex-col rounded-3xl border border-mint bg-background p-8 shadow-subtle">
              <div className="text-sm font-semibold uppercase tracking-wide text-mint">Comprehensive</div>
              <div className="mt-3 text-3xl font-semibold text-content">$5</div>
              <div className="text-sm text-content-muted">Per month · cancel anytime</div>
              <ul className="mt-6 space-y-3 text-sm text-content">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-[2px] h-4 w-4 text-mint" />
                  Everything in free
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-[2px] h-4 w-4 text-mint" />
                  Study plans powered by the 2,000+ problem dataset
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-[2px] h-4 w-4 text-mint" />
                  Extended guidance for 3-6 month prep horizons
                </li>
              </ul>
              <button
                type="button"
                onClick={handlePrimaryCta}
                className="mt-8 inline-flex items-center justify-center rounded-2xl border border-button-700 bg-button-600 px-5 py-3 text-sm font-medium text-button-foreground transition hover:bg-button-500 active:scale-[0.98]"
              >
                Unlock comprehensive prep
                <ArrowRightIcon className="ml-2 h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="bg-background py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-semibold text-content sm:text-4xl">
              Frequently asked before booking a plan
            </h2>
            <p className="mt-4 text-lg text-content-muted">
              The short answers to the questions we hear most from engineers switching to context-first prep.
            </p>
          </div>
          <div className="mt-10 space-y-4">
            {FAQ_ITEMS.map((faq, index) => (
              <details
                key={faq.question}
                className="group rounded-3xl border border-outline-subtle/40 bg-surface/80 p-6 shadow-subtle"
                open={index === 0}
              >
                <summary className="flex cursor-pointer list-none items-center justify-between text-left text-lg font-semibold text-content">
                  {faq.question}
                  <Sparkles className="h-5 w-5 text-mint opacity-0 transition group-open:opacity-100" />
                </summary>
                <p className="mt-4 text-sm text-content-muted">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-b from-cream/30 via-background to-background py-24">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-3xl font-semibold text-content sm:text-4xl">
            Take the guesswork out of company-specific prep
          </h2>
          <p className="mt-4 text-lg text-content-muted">
            Start for free, see a tangible transformation, and expand to the full dataset when you need deeper coverage.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={handlePrimaryCta}
              className="inline-flex items-center justify-center rounded-2xl border border-button-700 bg-button-600 px-8 py-4 text-base font-medium text-button-foreground transition hover:bg-button-500 active:scale-[0.98]"
            >
              Create my free account
              <ArrowRightIcon className="ml-2 h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={handleSeeDemo}
              className="inline-flex items-center justify-center rounded-2xl border border-outline-subtle/50 px-8 py-4 text-base font-medium text-content transition hover:border-mint hover:text-mint"
            >
              Run another transformation
            </button>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-content-muted">
            {FINAL_PROOF.map((point) => (
              <span key={point} className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-mint" />
                {point}
              </span>
            ))}
          </div>
          <footer className="mt-16 text-xs text-content-muted">
            © {currentYear} <span className="font-playfair font-semibold text-slate-900 dark:text-slate-100">AlgoIRL</span>. Built for real interviews.
          </footer>
        </div>
      </section>
    </div>
  );
}
