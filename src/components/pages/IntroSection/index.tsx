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
  Building2,
  CheckCircle2,
  CircleDot,
  Cpu,
  Layers,
  LineChart,
  Play,
  Target,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useDarkMode } from '../../DarkModeContext';
import { ThinkingIndicator } from '../../ThinkingIndicator';
import {
  prepareProblem,
  fetchCompanies as fetchCompaniesAPI,
} from '../../../utils/api-service';
import {
  cacheCompanies,
  getCachedCompanies,
  isCompaniesCacheValid,
} from '../../../utils/companiesCache';
import type { Company } from '../../../types';
import SectionContainer from './components/SectionContainer';
import CardSlot from './components/CardSlot';
import FeatureCard from './components/FeatureCard';
import CTAButton from './components/CTAButton';

interface IntroSectionProps {
  onStartClick: () => void;
}

type HeroVariant = 'analysis' | 'momentum';

interface HeroCopy {
  eyebrow: string;
  headline: string;
  subheadline: string;
  primaryCta: string;
  secondaryCta: string;
}

const HERO_VARIANTS: Record<HeroVariant, HeroCopy> = {
  analysis: {
    eyebrow: 'Company-specific algorithm practice',
    headline: 'Practice algorithms the way {company} actually asks them',
    subheadline:
      'Turn Two Sum into Google\'s cache design or Meta\'s friend suggestions. Same patterns, real company context that mirrors actual interviews.',
    primaryCta: 'Start free with Blind 75',
    secondaryCta: 'See it work on a problem',
  },
  momentum: {
    eyebrow: 'Stop guessing what they\'ll ask',
    headline: 'Solved 200 problems but unsure what {company} actually asks?',
    subheadline:
      'Practice algorithms the way top companies frame them. Transform generic LeetCode into real scenarios from Google, Meta, and Amazon interviews.',
    primaryCta: 'Start free with Blind 75',
    secondaryCta: 'See a transformation',
  },
};

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

const ORIGINAL_PROBLEMS: Record<string, { title: string; description: string }> = {
  'two-sum': {
    title: 'Two Sum',
    description: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to target.

**Example:**
\`\`\`
Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: nums[0] + nums[1] == 9, so we return [0, 1].
\`\`\`

**Constraints:**
- 2 <= nums.length <= 10^4
- -10^9 <= nums[i] <= 10^9
- Only one valid answer exists.`
  },
  'contains-duplicate': {
    title: 'Contains Duplicate',
    description: `Given an integer array \`nums\`, return \`true\` if any value appears at least twice in the array, and return \`false\` if every element is distinct.

**Example:**
\`\`\`
Input: nums = [1,2,3,1]
Output: true
\`\`\`

**Constraints:**
- 1 <= nums.length <= 10^5
- -10^9 <= nums[i] <= 10^9`
  },
  'valid-anagram': {
    title: 'Valid Anagram',
    description: `Given two strings \`s\` and \`t\`, return \`true\` if \`t\` is an anagram of \`s\`, and \`false\` otherwise.

**Example:**
\`\`\`
Input: s = "anagram", t = "nagaram"
Output: true
\`\`\`

**Constraints:**
- 1 <= s.length, t.length <= 5 * 10^4
- s and t consist of lowercase English letters.`
  }
};

interface DemoState {
  title?: string;
  background?: string;
  problemStatement: string;
}

interface FeaturedCompany {
  id: string;
  name: string;
}

const DATA_FACTORS = [
  {
    icon: Building2,
    title: 'Company profiles',
    description:
      'We maintain detailed dossiers covering product domains, tech stacks, and interview focus areas for each supported company.',
  },
  {
    icon: Activity,
    title: 'Role-specific patterns',
    description:
      'Community reports from Reddit, Blind, Glassdoor, and internal alumni outline how backend, ML, and security loops emphasise signal.',
  },
  {
    icon: BarChart4,
    title: 'Quality scoring engine',
    description:
      'Every AI-generated scenario is judged across six metrics — company relevance, role alignment, realism, technical fidelity, clarity, and safety.',
  },
] as const;

const STUDY_PLAN_STEPS = [
  {
    icon: Target,
    title: 'Sign in and choose your dataset',
    description:
      'Start with Blind 75 (included) or unlock the 2,000+ premium library. Both options keep your progress synced.',
  },
  {
    icon: Cpu,
    title: 'Define company, role, and timeline',
    description:
      'Pick the hiring panel you are targeting, set interview dates, and optionally dial in difficulty and topic focus.',
  },
  {
    icon: Layers,
    title: 'AlgoIRL builds your blended plan',
    description:
      'Our engine balances recently asked questions with predicted scenarios, adapting daily scope while tracking coverage.',
  },
  {
    icon: LineChart,
    title: 'Practise and track anywhere',
    description:
      'Work through hyperrealistic problems, update completion states, and resume from any device with one sign-in.',
  },
] as const;

const FAQ_ITEMS = [
  {
    question: 'What is included in the free plan?',
    answer:
      'You get study plans powered by the Blind 75 dataset, company-aware transformations for those problems, and our privacy-first workspace — all synced across devices. No credit card required, no time limit.',
  },
  {
    question: 'How does AlgoIRL source company and role intelligence?',
    answer:
      'We aggregate community-shared interview reports from Reddit, Blind, and Glassdoor, then combine that with detailed company product and architecture insights. Every transformation is scored across six quality metrics — company relevance, role alignment, scenario realism, technical fidelity, clarity, and parsing quality — before reaching you. We use LLM-as-judge evaluation to maintain high standards (0.784/1.0 average quality, 87.3% parsing success).',
  },
  {
    question: 'Why upgrade to the $5 comprehensive tier?',
    answer:
      'Premium unlocks study plans that draw from the full 2,000+ problem dataset (vs Blind 75\'s 75 problems). This means deeper topic coverage — for example, 50 graph problems instead of just 10 — and AI-predicted questions specifically tailored to your target company and role. Free tier is perfect for focused 4-6 week prep; comprehensive is for 2-3 month deep dives.',
  },
  {
    question: 'How fresh is the data behind the recommendations?',
    answer:
      'We continuously refresh interview signals with new community reports, update company dossiers when products evolve, and re-score transformations using our internal evaluation pipeline. All data is hand-curated and verified against multiple sources (not just scraped) to ensure accuracy.',
  },
  {
    question: 'How does AlgoIRL handle sensitive company-specific details?',
    answer:
      'Company intelligence lives in a cache-first data layer on our servers. We never store proprietary company data, and we never resell or expose transformation content outside your workspace. Your code and progress are encrypted at rest (AES-256) and in transit (TLS 1.3), stored on Google Cloud Firestore. We follow a privacy-first architecture — your data is yours.',
  },
  {
    question: 'How is this platform different from the study plans created on LeetCode?',
    answer:
      'AlgoIRL is complementary to LeetCode, not a replacement. LeetCode teaches algorithms generically (e.g., "Two Sum"). AlgoIRL transforms those same problems into company-specific scenarios (e.g., "Google: Cache Shard User Matching"). Use LeetCode to master algorithmic patterns first. Then use AlgoIRL 2-8 weeks before your interview to practice in company context. Our study plans intelligently select problems from our dataset and adapt them to your target company, role, and timeline — something generic LeetCode study plans can\'t do.',
  },
] as const;

const FINAL_HIGHLIGHTS = [
  'Context-rich, hyperrealistic problems in under ten seconds',
  'Study plans that balance recent loops with AI-predicted scenarios',
  'Privacy-first experience with sync across every device',
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

  const [featuredCompanies, setFeaturedCompanies] = useState<FeaturedCompany[]>([]);
  const [heroIndex, setHeroIndex] = useState(0);
  const [selectedProblem, setSelectedProblem] = useState<(typeof PROBLEM_OPTIONS)[number]['id']>('two-sum');
  const [selectedCompany, setSelectedCompany] = useState<(typeof COMPANY_OPTIONS)[number]['id']>('amazon');
  const [selectedRole, setSelectedRole] = useState<(typeof ROLE_OPTIONS)[number]['id']>('backend');
  const [originalProblem, setOriginalProblem] = useState<{ title: string; description: string } | null>(ORIGINAL_PROBLEMS['two-sum']);
  const [demoState, setDemoState] = useState<DemoState | null>(null);
  const [demoError, setDemoError] = useState<string | null>(null);
  const [isTransforming, setIsTransforming] = useState(false);

  const activeRequestRef = useRef<AbortController | null>(null);

  const heroVariant = useMemo<HeroVariant>(() => {
    const raw = (import.meta.env.VITE_LANDING_HERO_VARIANT ?? '') as HeroVariant;
    return raw && raw in HERO_VARIANTS ? raw : 'analysis';
  }, []);

  const heroCopy = HERO_VARIANTS[heroVariant];

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const loadCompanies = async () => {
      try {
        if (isCompaniesCacheValid()) {
          const cached = getCachedCompanies();
          if (cached && cached.length) {
            setFeaturedCompanies(selectFeaturedCompanies(cached));
            return;
          }
        }

        const response = await fetchCompaniesAPI();
        const list =
          (response?.data && Array.isArray(response.data) && response.data) ||
          (response?.companies && Array.isArray(response.companies) && response.companies) ||
          (Array.isArray(response) && response) ||
          [];

        if (list.length) {
          cacheCompanies(list);
          setFeaturedCompanies(selectFeaturedCompanies(list));
        }
      } catch (error) {
        console.error('[Landing] Unable to load companies', error);
      }
    };

    loadCompanies();
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      setHeroIndex((index) => (index + 1) % Math.max(featuredCompanies.length || 1, 1));
    }, 2600);
    return () => window.clearInterval(id);
  }, [featuredCompanies.length]);

  const activeCompanyName =
    featuredCompanies.length > 0 ? featuredCompanies[heroIndex % featuredCompanies.length].name : 'top tech companies';

  const handlePrimaryCta = useCallback(() => {
    recordLandingEvent('landing_primary_cta_click', { variant: heroVariant });
    onStartClick();
  }, [heroVariant, onStartClick]);

  const handleHeroSubmit = useCallback(
    (event: FormEvent) => {
      event.preventDefault();
      handlePrimaryCta();
    },
    [handlePrimaryCta],
  );

  const handleSeeDemo = useCallback(() => {
    recordLandingEvent('landing_demo_scroll');
    document.getElementById('algoirl-live-demo')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const handleProblemChange = useCallback((problemId: typeof PROBLEM_OPTIONS[number]['id']) => {
    setSelectedProblem(problemId);
    setOriginalProblem(ORIGINAL_PROBLEMS[problemId] || null);
    setDemoState(null); // Clear transformed version
    setDemoError(null);
  }, []);

  const handleTransform = useCallback(async () => {
    if (isTransforming) {
      return;
    }

    recordLandingEvent('landing_demo_request', {
      problem: selectedProblem,
      company: selectedCompany,
      role: selectedRole,
    });

    if (activeRequestRef.current) {
      activeRequestRef.current.abort();
    }

    const controller = new AbortController();
    activeRequestRef.current = controller;
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

      const problem = response?.problem ?? {};
      setDemoState({
        title: problem.title,
        background: problem.background,
        problemStatement:
          problem.problemStatement ?? 'AlgoIRL is compiling a hyperrealistic scenario. Try again if nothing appears.',
      });
      recordLandingEvent('landing_demo_success', {
        problem: selectedProblem,
        company: selectedCompany,
        role: selectedRole,
      });
    } catch (error) {
      if (!controller.signal.aborted) {
        console.error('[Landing] prepareProblem failed', error);
        setDemoError('We could not generate that scenario right now. Please try again or switch the company or role.');
        recordLandingEvent('landing_demo_error', {
          problem: selectedProblem,
          company: selectedCompany,
          role: selectedRole,
        });
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsTransforming(false);
      }
    }
  }, [isTransforming, selectedCompany, selectedProblem, selectedRole]);

  return (
    <div className="bg-background text-content">
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 left-1/2 h-[26rem] w-[42rem] -translate-x-1/2 rounded-full bg-mint/15 blur-3xl dark:bg-mint/10" />
          <div className="absolute bottom-10 right-10 h-60 w-60 rounded-full bg-navy/10 blur-3xl dark:bg-navy/20" />
        </div>

        <SectionContainer className="relative">
          <CardSlot className="px-6 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12">
            {/* Eyebrow + Dark Mode Toggle */}
            <div className="mb-6 flex items-center justify-between sm:mb-8">
              <span className="inline-flex items-center gap-2 rounded-full border border-outline-subtle/40 bg-surface/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-content-muted">
                <CircleDot className="h-3.5 w-3.5 text-mint" />
                {heroCopy.eyebrow}
              </span>
              <button
                type="button"
                onClick={toggleDarkMode}
                className="rounded-full border border-outline-subtle/40 bg-surface/70 px-4 py-2 text-xs font-medium text-content-muted transition hover:text-content"
              >
                {isDarkMode ? 'Light mode' : 'Dark mode'}
              </button>
            </div>

            {/* Grid: Content + Sidebar */}
            <div className="grid gap-8 lg:grid-cols-[1.5fr,1fr] lg:gap-12">
              {/* Main Content Column */}
              <div className="space-y-6 sm:space-y-8">
                {/* Headline */}
                <div>
                  <h1 className="text-3xl font-black tracking-tight text-content sm:text-4xl lg:text-5xl">
                    <span className="font-playfair text-slate-900 dark:text-slate-100">AlgoIRL</span>{' '}
                    {heroCopy.headline.replace('{company}', activeCompanyName)}
                  </h1>
                  <p className="mt-4 text-base text-content-muted sm:text-lg lg:text-xl">
                    {heroCopy.subheadline}
                  </p>
                </div>

                {/* CTAs */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <CTAButton
                    variant="primary"
                    size="lg"
                    onClick={handlePrimaryCta}
                    icon={ArrowRightIcon}
                    className="w-full sm:w-auto"
                  >
                    {heroCopy.primaryCta}
                  </CTAButton>
                  <CTAButton
                    variant="secondary"
                    size="md"
                    onClick={handleSeeDemo}
                    icon={Play}
                    className="w-full sm:w-auto"
                  >
                    {heroCopy.secondaryCta}
                  </CTAButton>
                </div>

                {/* Data Factors Card */}
                <CardSlot variant="default" className="lg:mt-8">
                  <div className="text-xs font-semibold uppercase tracking-wide text-content-muted sm:text-sm">
                    How AlgoIRL sources company intelligence
                  </div>
                  <div className="mt-4 grid gap-6 sm:grid-cols-3">
                    {DATA_FACTORS.map((factor) => (
                      <FeatureCard
                        key={factor.title}
                        icon={factor.icon}
                        title={factor.title}
                        description={factor.description}
                      />
                    ))}
                  </div>
                </CardSlot>
              </div>

              {/* Sidebar Column (hidden on mobile) */}
              <aside className="hidden space-y-6 lg:block">
                {/* Coverage Snapshot */}
                <CardSlot variant="default">
                  <div className="text-xs font-semibold uppercase tracking-wide text-content-muted">
                    Coverage snapshot
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-content">
                    {featuredCompanies.length > 0
                      ? `Focused on ${featuredCompanies.length} hiring panels`
                      : 'Focused on top hiring panels'}
                  </div>
                  <p className="mt-4 text-sm text-content-muted">
                    Crafted for engineers targeting{' '}
                    {featuredCompanies.length > 0
                      ? `${featuredCompanies
                          .slice(0, 5)
                          .map((company) => company.name)
                          .join(', ')}${featuredCompanies.length > 5 ? ' and more.' : '.'}`
                      : 'leading product and infrastructure teams.'}
                  </p>
                </CardSlot>

                {/* Why Choose AlgoIRL */}
                <CardSlot variant="default">
                  <div className="font-medium text-content">Why engineers choose AlgoIRL</div>
                  <ul className="mt-4 space-y-3 text-sm text-content-muted">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-[2px] h-4 w-4 flex-shrink-0 text-mint" />
                      Company and role knowledge continuously refreshed from community data.
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-[2px] h-4 w-4 flex-shrink-0 text-mint" />
                      Study plans blend recent interview loops with AI-predicted questions.
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-[2px] h-4 w-4 flex-shrink-0 text-mint" />
                      Privacy-first workspace with seamless sync across devices.
                    </li>
                  </ul>
                </CardSlot>
              </aside>
            </div>
          </CardSlot>
        </SectionContainer>
      </section>

      <section>
        <SectionContainer>
          <CardSlot className="space-y-6">
            <div className="flex flex-col gap-3 text-sm text-content-muted md:flex-row md:items-center md:justify-between">
              <span className="font-semibold uppercase tracking-wide text-content-muted">Data-backed interview prep</span>
              <div>
                Our system cross-references curated company data, role patterns, and the latest community intel to prioritize what you should practice next.
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <CardSlot variant="default" className="p-6">
                <div className="text-sm font-semibold text-content">Without AlgoIRL</div>
                <p className="mt-4 text-base text-content">
                  Generic problem sets rarely match how interviewers frame questions today. Candidates spend hours guessing
                  which scenarios still matter.
                </p>
                <ul className="mt-6 space-y-2 text-sm text-content-muted">
                  <li className="flex items-start gap-2">
                    <span className="mt-1 text-mint">•</span>
                    <span>Unclear which questions each company prioritizes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 text-mint">•</span>
                    <span>Difficulty mapping algorithms to real products</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 text-mint">•</span>
                    <span>No signal on whether prep covers upcoming loops</span>
                  </li>
                </ul>
              </CardSlot>

              <CardSlot variant="default" className="p-6">
                <div className="text-sm font-semibold text-content">With AlgoIRL</div>
                <p className="mt-4 text-base text-content">
                  Study plans blend hand-curated recent questions with AI-predicted scenarios, tuned to the company and role
                  you selected.
                </p>
                <ul className="mt-6 space-y-2 text-sm text-content-muted">
                  <li className="flex items-start gap-2">
                    <span className="mt-1 text-mint">•</span>
                    <span>Ranked problems derived from verified community data</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 text-mint">•</span>
                    <span>AI-predicted questions using proven evaluation methods</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 text-mint">•</span>
                    <span>Ongoing quality scoring ensures scenarios stay technically accurate</span>
                  </li>
                </ul>
              </CardSlot>
            </div>
          </CardSlot>
        </SectionContainer>
      </section>

      <section id="algoirl-live-demo">
        <SectionContainer>
          <CardSlot className="space-y-8">
            <div className="max-w-3xl">
              <h2 className="text-3xl font-semibold text-content sm:text-4xl">Try it for yourself</h2>
              <p className="mt-4 text-base text-content-muted sm:text-lg">
                Pick a familiar problem, choose the company and role, then let AlgoIRL rewrite it with company-specific context. Run it again for a fresh take.
              </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-[420px,1fr]">
              {/* Controls Column */}
              <div className="space-y-6">
                {/* Problem Selection */}
                <CardSlot variant="default" className="p-6">
                  <div className="mb-4 text-sm font-semibold text-content sm:text-base">Choose a problem</div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    {PROBLEM_OPTIONS.map((problem) => (
                      <button
                        key={problem.id}
                        type="button"
                        onClick={() => handleProblemChange(problem.id)}
                        className={`min-h-[48px] rounded-full px-6 py-3 text-base font-medium transition ${
                          selectedProblem === problem.id
                            ? 'bg-mint text-slate-900'
                            : 'border border-outline-subtle/40 bg-background text-content-muted hover:border-mint hover:text-content'
                        }`}
                      >
                        {problem.label}
                      </button>
                    ))}
                  </div>
                </CardSlot>

                {/* Company Selection */}
                <CardSlot variant="default" className="p-6">
                  <div className="mb-4 text-sm font-semibold text-content sm:text-base">Pick a company</div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    {COMPANY_OPTIONS.map((company) => (
                      <button
                        key={company.id}
                        type="button"
                        onClick={() => setSelectedCompany(company.id)}
                        className={`min-h-[48px] rounded-full px-6 py-3 text-base font-medium transition ${
                          selectedCompany === company.id
                            ? 'bg-mint text-slate-900'
                            : 'border border-outline-subtle/40 bg-background text-content-muted hover:border-mint hover:text-content'
                        }`}
                      >
                        {company.label}
                      </button>
                    ))}
                  </div>
                </CardSlot>

                {/* Role Selection */}
                <CardSlot variant="default" className="p-6">
                  <div className="mb-4 text-sm font-semibold text-content sm:text-base">Focus on a role</div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    {ROLE_OPTIONS.map((role) => (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => setSelectedRole(role.id)}
                        className={`min-h-[48px] rounded-full px-6 py-3 text-base font-medium transition ${
                          selectedRole === role.id
                            ? 'bg-mint text-slate-900'
                            : 'border border-outline-subtle/40 bg-background text-content-muted hover:border-mint hover:text-content'
                        }`}
                      >
                        {role.label}
                      </button>
                    ))}
                  </div>
                </CardSlot>

                {/* Generate Button */}
                <CTAButton
                  variant="primary"
                  size="lg"
                  onClick={handleTransform}
                  disabled={isTransforming}
                  icon={ArrowRightIcon}
                  className="w-full"
                >
                  {isTransforming ? 'Generating scenario...' : 'Generate scenario'}
                </CTAButton>

                <p className="text-xs text-content-muted">
                  AlgoIRL continuously refreshes the data behind each transformation. Run it again for a different scenario.
                </p>
              </div>

              {/* Results Column */}
              <div className="space-y-6">
                {/* Original Problem (always visible when problem selected) */}
                {originalProblem && (
                  <div>
                    <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-content-muted">
                      Original LeetCode Problem
                    </div>
                    <CardSlot variant="default" className="bg-surface/50 p-6">
                      <div className="prose prose-sm max-w-none text-content dark:prose-invert">
                        <h3 className="text-lg font-semibold text-content">{originalProblem.title}</h3>
                        <ReactMarkdown>{originalProblem.description}</ReactMarkdown>
                      </div>
                    </CardSlot>
                  </div>
                )}

                {/* Arrow or spacing */}
                {originalProblem && demoState && (
                  <div className="flex items-center justify-center py-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-mint">
                      <span>Transformed for {COMPANY_OPTIONS.find(c => c.id === selectedCompany)?.label}</span>
                      <ArrowRightIcon className="h-4 w-4" />
                    </div>
                  </div>
                )}

                {/* Transformed Problem */}
                {isTransforming ? (
                  <CardSlot variant="default" className="p-6">
                    <div className="flex min-h-[200px] items-center justify-center">
                      <div className="flex flex-col items-center gap-4 text-sm text-content-muted">
                        <ThinkingIndicator
                          states={[
                            'Analyzing company patterns...',
                            'Blending role-specific context...',
                            'Crafting scenario...',
                          ]}
                          typingSpeed={70}
                          deletingSpeed={45}
                          pauseDuration={1200}
                        />
                        <span>Preparing a fresh scenario...</span>
                      </div>
                    </div>
                  </CardSlot>
                ) : demoError ? (
                  <CardSlot variant="default" className="p-6">
                    <div className="text-sm text-destructive">{demoError}</div>
                  </CardSlot>
                ) : demoState ? (
                  <div>
                    <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-mint">
                      AlgoIRL Transformed
                    </div>
                    <CardSlot variant="highlighted" className="p-6">
                      <div className="prose prose-sm max-w-none text-content dark:prose-invert">
                        {demoState.title && <h3 className="text-lg font-semibold text-content">{demoState.title}</h3>}
                        {demoState.background && <p className="text-content-muted">{demoState.background}</p>}
                        <ReactMarkdown>{demoState.problemStatement}</ReactMarkdown>
                      </div>
                    </CardSlot>
                  </div>
                ) : originalProblem ? (
                  <div className="rounded-2xl border border-dashed border-outline-subtle/60 bg-surface/30 p-8 text-center text-sm text-content-muted">
                    Click "Generate scenario" to see how AlgoIRL transforms this problem for {COMPANY_OPTIONS.find(c => c.id === selectedCompany)?.label} {ROLE_OPTIONS.find(r => r.id === selectedRole)?.label} engineers.
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-outline-subtle/60 bg-surface/30 p-8 text-center text-sm text-content-muted">
                    Select a problem to get started.
                  </div>
                )}

                {/* Quality Metrics Note */}
                {demoState && (
                  <div className="rounded-2xl border border-dashed border-outline-subtle/60 bg-surface/70 p-4 text-xs text-content-muted">
                    AlgoIRL evaluates every scenario across six quality metrics to keep company relevance and role accuracy high.
                  </div>
                )}
              </div>
            </div>
          </CardSlot>
        </SectionContainer>
      </section>

      <section>
        <SectionContainer>
          <CardSlot className="space-y-8">
            <div className="max-w-3xl">
              <h2 className="text-3xl font-semibold text-content sm:text-4xl">
                Study plans that adapt with your interview journey
              </h2>
              <p className="mt-4 text-base text-content-muted sm:text-lg">
                AlgoIRL guides you from dataset selection to daily execution, balancing recently asked questions with
                AI-predicted scenarios for the company and role you choose.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {STUDY_PLAN_STEPS.map((step) => (
                <CardSlot key={step.title} variant="default" className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-mint/10">
                      <step.icon className="h-5 w-5 text-mint" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-content">{step.title}</h3>
                      <p className="mt-2 text-sm text-content-muted">{step.description}</p>
                    </div>
                  </div>
                </CardSlot>
              ))}
            </div>

            {/* Cross-device sync emphasis */}
            <div className="rounded-2xl border border-dashed border-outline-subtle/40 bg-surface/30 p-6 text-center">
              <p className="text-sm text-content-muted">
                Your progress syncs automatically across desktop, tablet, and mobile. Start on your laptop, continue on your phone.
              </p>
            </div>
          </CardSlot>
        </SectionContainer>
      </section>

      <section>
        <SectionContainer>
          <CardSlot className="space-y-10">
            <div className="max-w-3xl">
              <h2 className="text-3xl font-semibold text-content sm:text-4xl">
                Choose the plan that fits your depth of prep
              </h2>
              <p className="mt-4 text-base text-content-muted sm:text-lg">
                Both plans include the same interface and privacy-first experience. Upgrade when you need the full company and role dataset.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Free Tier */}
              <CardSlot variant="default" className="flex flex-col p-8">
                <div className="text-sm font-semibold uppercase tracking-wide text-content-muted">Free</div>
                <div className="mt-3 text-3xl font-semibold text-content">$0</div>
                <div className="text-sm text-content-muted">Always available</div>

                <ul className="mt-6 flex-1 space-y-3 text-sm text-content">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-[2px] h-4 w-4 flex-shrink-0 text-mint" />
                    <span>Study plans powered by the Blind 75 dataset</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-[2px] h-4 w-4 flex-shrink-0 text-mint" />
                    <span>Company-aware transformations for every included problem</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-[2px] h-4 w-4 flex-shrink-0 text-mint" />
                    <span>Progress sync across desktop and mobile</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-[2px] h-4 w-4 flex-shrink-0 text-mint" />
                    <span>Full code editor with test case execution</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-[2px] h-4 w-4 flex-shrink-0 text-mint" />
                    <span>All companies and roles supported</span>
                  </li>
                </ul>

                <CTAButton
                  variant="secondary"
                  size="md"
                  onClick={handlePrimaryCta}
                  icon={ArrowRightIcon}
                  className="mt-6 w-full"
                >
                  Start free today
                </CTAButton>
              </CardSlot>

              {/* Comprehensive Tier */}
              <CardSlot variant="highlighted" className="flex flex-col p-8">
                <div className="text-sm font-semibold uppercase tracking-wide text-mint">Comprehensive</div>
                <div className="mt-3 text-3xl font-semibold text-content">$5</div>
                <div className="text-sm text-content-muted">Per month · cancel anytime</div>

                <ul className="mt-6 flex-1 space-y-3 text-sm text-content">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-[2px] h-4 w-4 flex-shrink-0 text-mint" />
                    <span>Everything in the free plan</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-[2px] h-4 w-4 flex-shrink-0 text-mint" />
                    <span>Study plans that draw from the full 2,000+ problem dataset</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-[2px] h-4 w-4 flex-shrink-0 text-mint" />
                    <span>AI-predicted scenarios tailored to your company and role</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-[2px] h-4 w-4 flex-shrink-0 text-mint" />
                    <span>Deeper topic coverage (e.g., 50 graph problems vs Blind 75's 10)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-[2px] h-4 w-4 flex-shrink-0 text-mint" />
                    <span>Priority support and early access to new features</span>
                  </li>
                </ul>

                <CTAButton
                  variant="primary"
                  size="md"
                  onClick={handlePrimaryCta}
                  icon={ArrowRightIcon}
                  className="mt-6 w-full"
                >
                  Unlock comprehensive plans
                </CTAButton>
              </CardSlot>
            </div>
          </CardSlot>
        </SectionContainer>
      </section>

      <section>
        <SectionContainer>
          <CardSlot className="space-y-8">
            <div className="max-w-3xl">
              <h2 className="text-3xl font-semibold text-content sm:text-4xl">Frequently asked questions</h2>
              <p className="mt-4 text-base text-content-muted sm:text-lg">
                Answers to the questions engineers ask most when switching to context-smart prep.
              </p>
            </div>

            <div className="space-y-4">
              {FAQ_ITEMS.map((faq, index) => (
                <details
                  key={faq.question}
                  className="group rounded-2xl border border-outline-subtle/40 bg-background/70 p-6"
                  open={index === 0}
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between text-left text-base font-semibold text-content sm:text-lg">
                    {faq.question}
                    <CircleDot className="h-5 w-5 flex-shrink-0 text-mint opacity-0 transition group-open:opacity-100" />
                  </summary>
                  <p className="mt-4 text-sm text-content-muted">{faq.answer}</p>
                </details>
              ))}
            </div>
          </CardSlot>
        </SectionContainer>
      </section>

      <section>
        <SectionContainer>
          <CardSlot className="text-center">
            <div className="mx-auto max-w-3xl space-y-6">
              <h2 className="text-3xl font-semibold text-content sm:text-4xl">
                Build confidence with company-aware, role-specific practice
              </h2>
              <p className="text-base text-content-muted sm:text-lg">
                Start for free, experience a live scenario, and upgrade when you are ready for the full dataset.
              </p>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-center sm:gap-6">
                <CTAButton
                  variant="primary"
                  size="lg"
                  onClick={handlePrimaryCta}
                  icon={ArrowRightIcon}
                  className="w-full sm:w-auto"
                >
                  Create my free account
                </CTAButton>
                <CTAButton
                  variant="secondary"
                  size="lg"
                  onClick={handleSeeDemo}
                  className="w-full sm:w-auto"
                >
                  Generate another scenario
                </CTAButton>
              </div>

              <div className="flex flex-col gap-3 text-sm text-content-muted sm:flex-row sm:items-center sm:justify-center sm:gap-6">
                {FINAL_HIGHLIGHTS.map((highlight) => (
                  <span key={highlight} className="inline-flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-mint" />
                    {highlight}
                  </span>
                ))}
              </div>

              <footer className="pt-6 text-xs text-content-muted">
                © {currentYear}{' '}
                <span className="font-playfair font-semibold text-slate-900 dark:text-slate-100">AlgoIRL</span>. Interview prep
                with company intelligence.
              </footer>
            </div>
          </CardSlot>
        </SectionContainer>
      </section>
    </div>
  );
}

function selectFeaturedCompanies(companies: Company[]): FeaturedCompany[] {
  if (!companies.length) {
    return [];
  }

  const uniqueMap = new Map<string, Company>();
  companies.forEach((company) => {
    if (company && company.id && company.name && !uniqueMap.has(company.id)) {
      uniqueMap.set(company.id, company);
    }
  });

  const uniqueCompanies = Array.from(uniqueMap.values()).sort((a, b) => a.name.localeCompare(b.name));

  const featured: FeaturedCompany[] = [];
  const sampleCount = Math.min(uniqueCompanies.length, 8);
  const usedIndexes = new Set<number>();

  while (featured.length < sampleCount) {
    const index = Math.floor(Math.random() * uniqueCompanies.length);
    if (usedIndexes.has(index)) {
      continue;
    }
    usedIndexes.add(index);
    featured.push({ id: uniqueCompanies[index].id, name: uniqueCompanies[index].name });
  }

  return featured;
}
