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
  Target,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useDarkMode } from '../../DarkModeContext';
import { ThinkingIndicator } from '../../ThinkingIndicator';
import {
  prepareProblem,
} from '../../../utils/api-service';
import SectionContainer from './components/SectionContainer';
import CTAButton from './components/CTAButton';

interface IntroSectionProps {
  onStartClick: () => void;
}


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
      'Community reports from Reddit, Blind, Glassdoor, and internal alumni outline how ML, Backend, Frontend, Infrastructure and Security coding interview loops at big tech. emphasise signal.',
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
      'Choose Blind 75 (free, 75 curated problems) or unlock the full 2,000+ dataset for deeper coverage—study plans adapt to whichever you select, with automatic progress sync across all devices.',
  },
  {
    icon: Cpu,
    title: 'Define company, role, and timeline',
    description:
      'Select your target company from the 20 tracked companies (more companies coming soon), specify your role (Backend, ML, Frontend, Infrastructure, Security), set your interview timeline, and optionally filter by difficulty or focus topics—the algorithm uses all this to match you with the most relevant problems.',
  },
  {
    icon: Layers,
    title: 'AlgoIRL builds your personalized plan',
    description:
      'Our multi-dimensional scoring algorithm (frequency + recency + role alignment + company context) selects problems from verified interview data, then schedules them across your timeline with intelligent topic diversity to maximize coverage.',
  },
  {
    icon: LineChart,
    title: 'practice and track anywhere',
    description:
      'Solve company-contextualized problems with real-time code execution, mark progress as you go, and seamlessly resume from laptop, tablet, or phone—everything syncs automatically via our dual-layer persistence system.',
  },
] as const;

const FAQ_ITEMS = [
  {
    question: 'When should I start using AlgoIRL before my interview?',
    answer:
      'Start 2-4 weeks before your interview. Use LeetCode first to master core patterns (aim for 50-200 problems solved). Once you\'re comfortable with the fundamentals, switch to AlgoIRL to train pattern recognition in company-specific contexts. This timeline gives you enough exposure to realistic scenarios without burning out. Our study plans automatically adjust problem difficulty and pacing based on your interview date, prioritizing recently-asked questions and company-specific patterns that matter most.',
  },
  {
    question: 'How many company-specific problems will I actually get access to?',
    answer:
      'The free tier gives you 75 problems (Blind 75) transformed for all 20+ companies and 5 roles—that\'s 7,500+ unique scenarios. The comprehensive tier unlocks the full 2,000+ problem library, generating 280,000+ company-role combinations. For example, if you\'re targeting Google Backend, free tier covers ~75 scenarios, while comprehensive tier gives you ~2,000 Google Backend-specific transformations spanning all major algorithmic categories (arrays, graphs, trees, dynamic programming, system design fundamentals, etc.).',
  },
  {
    question: 'Should I use AlgoIRL with LeetCode, or instead of it?',
    answer:
      'Use LeetCode first, then AlgoIRL. LeetCode builds your foundational algorithmic skills through pattern repetition. AlgoIRL trains a different skill—recognizing those same patterns when they\'re wrapped in company-specific context and jargon. Think of LeetCode as learning chess moves, and AlgoIRL as practicing against opponents with different playing styles. Most successful users solve 50-200 LeetCode problems first, then spend 2-4 weeks on AlgoIRL to build context-switching confidence before their interview.',
  },
  {
    question: 'Why not just use LeetCode\'s company tags or premium filters?',
    answer:
      'LeetCode company tags tell you "Google asked this problem." AlgoIRL shows you how Google frames it in the actual interview—using their product terminology (Search indexing, YouTube recommendations, Maps routing), tech stack references (Bigtable, Spanner, Colossus), and role-specific expectations. The algorithmic solution is the same, but your brain needs to recognize the pattern through company-specific context under interview pressure. LeetCode company tags don\'t rewrite the problem; AlgoIRL does. That context-switching skill is what separates candidates who freeze from candidates who execute.',
  },
  {
    question: 'How is this platform different from the study plans created on LeetCode?',
    answer:
      'AlgoIRL is complementary to LeetCode, not a replacement. LeetCode teaches algorithms generically (e.g., "Two Sum"). AlgoIRL transforms those same problems into company-specific scenarios (e.g., "Google: Cache Shard User Matching"). Use LeetCode to master algorithmic patterns first. Then use AlgoIRL 2-3 weeks before your interview to practice in company context. Our study plans intelligently select problems from our dataset and adapt them to your target company, role, and timeline — something generic LeetCode study plans can\'t do.',
  },
  {
    question: 'Can I see a few examples before I upgrade to the paid tier?',
    answer:
      'Yes—the free tier is designed for exactly this. You get full access to the Blind 75 dataset with unlimited company-role transformations. Try 10-15 problems across different companies and roles to see if AlgoIRL\'s context-rich scenarios help you recognize patterns faster. If you find the transformations valuable and want deeper topic coverage (50 graph problems instead of 10, advanced DP patterns, etc.), upgrade to access the full 2,000+ problem library. No trial periods, no credit card required to start.',
  },
  {
    question: 'Why upgrade to the $5 comprehensive tier?',
    answer:
      'Premium unlocks study plans that draw from the full 2,000+ problem dataset (vs Blind 75\'s 75 problems). This means deeper topic coverage — for example, 50 graph problems instead of just 10 — and AI-predicted questions specifically tailored to your target company and role. Free tier is perfect for focused 4-6 week prep; comprehensive is for 2-3 month deep dives.',
  },
  {
    question: 'How accurate are the company-specific transformations?',
    answer:
      'Every transformation is evaluated across six quality metrics—company relevance, role alignment, scenario realism, technical fidelity, clarity, and parsing accuracy. Our fine-tuned GPT-4.1-nano model achieves 0.784/1.0 average quality score with 87.3% parsing success. We continuously refresh transformations based on new community reports from Reddit, Blind, and Glassdoor, and manually verify company product/tech stack details. If a scenario doesn\'t feel realistic, regenerate it—our system produces multiple variations to ensure you get high-quality, interview-relevant context.',
  },
  {
    question: 'Which 20 companies do you currently support?',
    answer:
      'We currently support transformations for Google, Meta, Amazon, Apple, Microsoft, Netflix, Stripe, Airbnb, Uber, Lyft, Coinbase, Robinhood, DoorDash, Instacart, Pinterest, Snap, Twitter/X, LinkedIn, Dropbox, and Salesforce—covering the most commonly interviewed FAANG+ and high-growth tech companies. Each company profile includes product domain expertise, tech stack references, and interview focus areas curated from thousands of community reports. If your target company isn\'t listed, our generic \'Big Tech\' transformation still provides role-specific context. We\'re adding 5-10 new companies per quarter based on user requests.',
  },
  {
    question: 'What if I complete all 75 free problems? Do I lose my progress when I upgrade?',
    answer:
      'Your progress is fully preserved when you upgrade—all completed problems, code submissions, and study plan history carry over automatically. Upgrading unlocks the full 2,000+ problem library, and your study plan seamlessly expands to include advanced topics and deeper coverage. If you\'ve completed the Blind 75, our algorithm will prioritize new problem types you haven\'t seen yet (advanced DP, graph algorithms, system design patterns) while respecting your existing mastery. Think of it as leveling up, not starting over.',
  },
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
    question: 'How fresh is the data behind the recommendations?',
    answer:
      'We continuously refresh interview signals with new community reports, update company dossiers when products evolve, and re-score transformations using our internal evaluation pipeline. All data is hand-curated and verified against multiple sources (not just scraped) to ensure accuracy.',
  }
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
  const { isDarkMode } = useDarkMode();

  const [selectedProblem, setSelectedProblem] = useState<(typeof PROBLEM_OPTIONS)[number]['id']>('two-sum');
  const [selectedCompany, setSelectedCompany] = useState<(typeof COMPANY_OPTIONS)[number]['id']>('amazon');
  const [selectedRole, setSelectedRole] = useState<(typeof ROLE_OPTIONS)[number]['id']>('backend');
  const [originalProblem, setOriginalProblem] = useState<{ title: string; description: string } | null>(ORIGINAL_PROBLEMS['two-sum']);
  const [demoState, setDemoState] = useState<DemoState | null>(null);
  const [demoError, setDemoError] = useState<string | null>(null);
  const [isTransforming, setIsTransforming] = useState(false);

  const activeRequestRef = useRef<AbortController | null>(null);

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
      <section className="border-b border-outline-subtle/20">
        <SectionContainer className="py-16 sm:py-20 lg:py-24">
          {/* Large centered AlgoIRL logo and hero content */}
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-content font-playfair">
              AlgoIRL
            </h1>

            <p className="text-base text-content-muted sm:text-lg lg:text-xl">
              A hyperrealistic interview simulator, designed to bridge the gap between your coding interview preparation and how companies actually frame problems in the interview
            </p>

            {/* Single CTA button - sleek design */}
            <div>
              <button
                onClick={handleSeeDemo}
                className="inline-flex items-center justify-center px-8 py-3 text-base font-medium text-white bg-gradient-to-r from-mint-600 to-mint-700 hover:from-mint-700 hover:to-mint-800 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                See it in action
              </button>
            </div>
          </div>
          <div className="mt-12 grid gap-6 pt-6 text-sm text-content-muted sm:grid-cols-3">
            {DATA_FACTORS.map((factor) => (
              <div key={factor.title} className="space-y-2">
                <div className="text-sm font-semibold text-content">{factor.title}</div>
                <p>{factor.description}</p>
              </div>
            ))}
          </div>
        </SectionContainer>
      </section>

      <section className="border-b border-outline-subtle/20">
        <SectionContainer className="py-16 sm:py-20">
          <div className="space-y-8">
            <div className="max-w-3xl mx-auto text-center space-y-3">
              <h2 className="text-3xl font-semibold text-content sm:text-4xl">Data-backed interview prep</h2>
              <p className="text-base text-content-muted sm:text-lg">
                Our system cross-references curated company data, role patterns, and the latest community intel to prioritize what you should practice next.
              </p>
            </div>

            <div className="max-w-4xl mx-auto space-y-4 text-content-muted">
              <p className="text-base sm:text-lg">
                Studies show that{' '}
                <a
                  href="https://www.carejobz.com.au/i-froze-completely-interview-response-uncovered/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-content underline decoration-mint/50 hover:decoration-mint transition-colors"
                >
                  62% of professionals have frozen at least once in an interview
                </a>
                , often on problems they mastered during practice. This isn't about skill—it's about stress. When{' '}
                <a
                  href="https://resources.biginterview.com/interviews-101/interview-anxiety/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-content underline decoration-mint/50 hover:decoration-mint transition-colors"
                >
                  93% of candidates experience interview anxiety
                </a>
                , even familiar algorithms feel unrecognizable when wrapped in company-specific jargon and framed through a product lens you've never encountered.
              </p>
              <p className="text-base sm:text-lg">
                The freeze response isn't rare.{' '}
                <a
                  href="https://www.tandfonline.com/doi/full/10.1080/10253890.2024.2364333"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-content underline decoration-mint/50 hover:decoration-mint transition-colors"
                >
                  Research indicates that interview stress impairs working memory, problem-solving, and pattern recognition
                </a>
                —the exact skills you need most. Candidates spend an average of 5-10 minutes wrestling with problems they could solve instantly in practice, simply because the real interview presents them differently.
              </p>
              <p className="text-base sm:text-lg">
                <strong className="text-content">Why this happens:</strong> Your brain trained on "Two Sum." The interviewer asks about "cache shard user matching" at Google or "content recommendation deduplication" at Netflix. Same algorithm, completely different context. This gap between practice and reality is where preparation breaks down.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4 rounded-3xl border border-outline-subtle/25 bg-background p-6">
                <div className="text-sm font-semibold text-content">Without AlgoIRL</div>
                <p className="text-base text-content">
                  Generic problem sets that don't match how your target company frames questions. When interview stress hits, familiar patterns become unrecognizable.
                </p>
                <ul className="space-y-2 text-sm text-content-muted">
                  <li>Practice builds algorithmic skill but not recognition under pressure</li>
                  <li>No exposure to product-specific context that appears in real interviews</li>
                  <li>Freeze on problems you already know when they're presented differently</li>
                </ul>
              </div>
              <div className="space-y-4 rounded-3xl border border-outline-subtle/25 bg-background p-6">
                <div className="text-sm font-semibold text-content">With AlgoIRL</div>
                <p className="text-base text-content">
                  Train with hyperrealistic scenarios tailored to your company's products, tech stack, and interview style. Build the muscle to recognize familiar patterns in company-specific context.
                </p>
                <ul className="space-y-2 text-sm text-content-muted">
                  <li>Practice the same recognition skill you'll need when anxiety strikes mid-interview</li>
                  <li>Study plans intelligently match problems from our 2,000+ curated dataset to your target profile and interview timeline</li>
                </ul>
              </div>
            </div>
          </div>
        </SectionContainer>
      </section>

      <section id="algoirl-live-demo" className="border-b border-outline-subtle/30">
        <SectionContainer className="py-16 sm:py-20">
          <div className="space-y-10">
            <div className="max-w-3xl space-y-4">
              <h2 className="text-3xl font-semibold text-content sm:text-4xl">Try it for yourself</h2>
              <p className="text-base text-content-muted sm:text-lg">
                Pick a familiar problem, choose the company and role, then let AlgoIRL rewrite it with company-specific context. Run it again for a fresh take.
              </p>
            </div>
            <div className="grid gap-8 lg:grid-cols-[minmax(0,360px),1fr]">
              <div className="space-y-6 rounded-3xl border border-outline-subtle/25 bg-background p-6">
                <div className="space-y-3">
                  <label className="text-sm font-medium text-content">Original problem</label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {PROBLEM_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => handleProblemChange(option.id)}
                        className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${
                          selectedProblem === option.id
                            ? 'border-mint bg-mint/10 text-content'
                            : 'border-outline-subtle/25 bg-background text-content-muted hover:text-content'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wide text-content-muted">Company</label>
                    <select
                      value={selectedCompany}
                      onChange={(event) => setSelectedCompany(event.target.value as (typeof COMPANY_OPTIONS)[number]['id'])}
                      className="w-full rounded-xl border border-outline-subtle/25 bg-background px-3 py-2 text-sm text-content focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint/30"
                    >
                      {COMPANY_OPTIONS.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                    <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wide text-content-muted">Role</label>
                    <select
                      value={selectedRole}
                      onChange={(event) => setSelectedRole(event.target.value as (typeof ROLE_OPTIONS)[number]['id'])}
                      className="w-full rounded-xl border border-outline-subtle/25 bg-background px-3 py-2 text-sm text-content focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint/30"
                    >
                      {ROLE_OPTIONS.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <CTAButton
                  variant="primary"
                  size="md"
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
                {demoState && (
                  <div className="rounded-2xl border border-dashed border-outline-subtle/40 bg-background/70 p-4 text-xs text-content-muted">
                    AlgoIRL evaluates every scenario across six quality metrics to keep company relevance and role accuracy high.
                  </div>
                )}
              </div>
              <div className="space-y-6">
                {originalProblem && (
                  <div className="space-y-2">
                    <div className="text-xs font-semibold uppercase tracking-wide text-content-muted">
                      Original LeetCode Problem
                    </div>
                    <div className="rounded-3xl border border-outline-subtle/25 bg-background p-6">
                      <div className="prose prose-sm max-w-none text-content dark:prose-invert">
                        <h3 className="text-lg font-semibold text-content">{originalProblem.title}</h3>
                        <ReactMarkdown>{originalProblem.description}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                )}
                {originalProblem && demoState && (
                  <div className="flex items-center gap-2 text-sm font-medium text-mint">
                    <ArrowRightIcon className="h-4 w-4" />
                    <span>
                      Transformed for {COMPANY_OPTIONS.find((company) => company.id === selectedCompany)?.label}{' '}
                      {ROLE_OPTIONS.find((role) => role.id === selectedRole)?.label} engineers
                    </span>
                  </div>
                )}
                {isTransforming ? (
                  <div className="rounded-3xl border border-outline-subtle/25 bg-background p-6">
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
                  </div>
                ) : demoError ? (
                  <div className="rounded-3xl border border-outline-subtle/25 bg-background p-6">
                    <div className="text-sm text-destructive">{demoError}</div>
                  </div>
                ) : demoState ? (
                  <div className="space-y-2">
                    <div className="text-xs font-semibold uppercase tracking-wide text-mint">
                      AlgoIRL Transformed
                    </div>
                    <div className="rounded-3xl border border-mint/60 bg-background p-6">
                      <div className="prose prose-sm max-w-none text-content dark:prose-invert">
                        {demoState.title && <h3 className="text-lg font-semibold text-content">{demoState.title}</h3>}
                        {demoState.background && <p className="text-content-muted">{demoState.background}</p>}
                        <ReactMarkdown>{demoState.problemStatement}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                ) : originalProblem ? (
                  <div className="rounded-3xl border border-dashed border-outline-subtle/40 bg-background/70 p-8 text-center text-sm text-content-muted">
                    Click "Generate scenario" to see how AlgoIRL transforms this problem for {COMPANY_OPTIONS.find((company) => company.id === selectedCompany)?.label}{' '}
                    {ROLE_OPTIONS.find((role) => role.id === selectedRole)?.label} engineers.
                  </div>
                ) : (
                  <div className="rounded-3xl border border-dashed border-outline-subtle/40 bg-background/70 p-8 text-center text-sm text-content-muted">
                    Select a problem to get started.
                  </div>
                )}
              </div>
            </div>
          </div>
        </SectionContainer>
      </section>

      <section className="border-b border-outline-subtle/20">
        <SectionContainer className="py-16 sm:py-20">
          <div className="space-y-8">
            <div className="max-w-3xl space-y-4">
              <h2 className="text-3xl font-semibold text-content sm:text-4xl">
                Study plans tailored to your timeline, role, and target company
              </h2>
              <p className="text-base text-content-muted sm:text-lg">
                Tell AlgoIRL your target company, role, and interview timeline—our algorithm designs a custom study plan matched to your goals. We've collected company-specific interview data and role-specific patterns through thousands of community reports on Reddit, Blind, and Glassdoor, then manually verified and organized them into our 2,000+ problem dataset. Our matching algorithm intelligently selects the most relevant problems for your specific company and role profile, ranking recently asked questions higher. The data is continuously refreshed and re-scored to ensure you're practicing what's most likely to appear in your actual interview.
              </p>
            </div>
            <ol className="space-y-4">
              {STUDY_PLAN_STEPS.map((step, index) => (
                <li
                  key={step.title}
                  className="flex items-start gap-4 rounded-3xl border border-outline-subtle/25 bg-background p-6"
                >
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border border-outline-subtle/25 text-sm font-semibold text-mint">
                    {String(index + 1).padStart(2, '0')}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-lg font-semibold text-content">{step.title}</h3>
                      <step.icon className="h-5 w-5 text-mint" />
                    </div>
                    <p className="mt-2 text-sm text-content-muted">{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </SectionContainer>
      </section>

      <section className="border-b border-outline-subtle/20">
        <SectionContainer className="py-16 sm:py-20">
          <div className="space-y-8">
            <div className="max-w-3xl space-y-4">
              <h2 className="text-3xl font-semibold text-content sm:text-4xl">
                Choose the plan that fits your depth of prep
              </h2>
              <p className="text-base text-content-muted sm:text-lg">
                Both plans include the same interface and privacy-first experience. Upgrade when you need the full company and role dataset.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="flex flex-col rounded-3xl border border-outline-subtle/25 bg-background p-8">
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
                  onClick={onStartClick}
                  icon={ArrowRightIcon}
                  className="mt-6 w-full"
                >
                  Start free today
                </CTAButton>
              </div>
              <div className="flex flex-col rounded-3xl border border-mint/60 bg-background p-8">
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
                    <span>Deeper topic coverage (e.g., 50 graph problems vs Blind 75's 10)</span>
                  </li>
                </ul>
                <CTAButton
                  variant="primary"
                  size="md"
                  onClick={onStartClick}
                  icon={ArrowRightIcon}
                  className="mt-6 w-full"
                >
                  Unlock comprehensive plans
                </CTAButton>
              </div>
            </div>
          </div>
        </SectionContainer>
      </section>

      <section className="border-b border-outline-subtle/20">
        <SectionContainer className="py-16 sm:py-20">
          <div className="space-y-8">
            <div className="max-w-3xl space-y-4">
              <h2 className="text-3xl font-semibold text-content sm:text-4xl">Frequently asked questions</h2>
            </div>
            <div className="space-y-4">
              {FAQ_ITEMS.map((faq, index) => (
                <details
                  key={faq.question}
                  className="group rounded-3xl border border-outline-subtle/25 bg-background p-6"
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
          </div>
        </SectionContainer>
      </section>

      <section>
        <SectionContainer className="py-16 sm:py-20">
          <div className="mx-auto max-w-3xl space-y-6 text-center">
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
                onClick={onStartClick}
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
              © {currentYear} AlgoIRL. All rights reserved.
            </footer>
          </div>
        </SectionContainer>
      </section>
    </div>
  );
}
