import type { CSSProperties, FormEvent } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { secureLog } from '@/utils/secureLogger';
import {
  Activity,
  BarChart4,
  Building2,
  CheckCircle2,
  Cpu,
  Layers,
  LineChart,
  Target,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { useFeatureFlags } from '@/contexts/FeatureFlagsContext';
import PaymentModal from '@/components/PaymentModal';
import AuthModal from '@/components/AuthModal';
import { trackPaymentEvent, storePaymentContext } from '@/utils/payment';
import { useAuthDialog } from '@/contexts/AuthDialogContext';
import { useDarkMode } from '../../DarkModeContext';
import { ThinkingIndicator } from '../../ThinkingIndicator';
import {
  prepareProblem,
} from '../../../utils/api-service';
import { APIRateLimitError } from '@/utils/api-errors';
import SectionBlock from './components/SectionBlock';
import { InlineStudyPlanBuilder } from './InlineStudyPlanBuilder';

const PROBLEM_OPTIONS = [
  { id: 'two-sum', label: 'Two Sum' },
  { id: 'contains-duplicate', label: 'Contains Duplicate' },
  { id: 'valid-anagram', label: 'Valid Anagram' },
  { id: 'best-time-to-buy-and-sell-stock', label: 'Best Time to Buy and Sell Stock' },
  { id: 'merge-two-sorted-lists', label: 'Merge Two Sorted Lists' },
  { id: 'maximum-subarray', label: 'Maximum Subarray' },
  { id: 'climbing-stairs', label: 'Climbing Stairs' },
  { id: 'reverse-linked-list', label: 'Reverse Linked List' },
  { id: 'invert-binary-tree', label: 'Invert Binary Tree' },
] as const;

const COMPANY_OPTIONS = [
  { id: 'google', label: 'Google' },
  { id: 'meta', label: 'Meta' },
  { id: 'amazon', label: 'Amazon' },
  { id: 'apple', label: 'Apple' },
  { id: 'netflix', label: 'Netflix' },
  { id: 'uber', label: 'Uber' },
  { id: 'bytedance', label: 'ByteDance' },
  { id: 'doordash', label: 'DoorDash' },
  { id: 'airbnb', label: 'Airbnb' },
  { id: 'coinbase', label: 'Coinbase' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'stripe', label: 'Stripe' },
] as const;

const ROLE_OPTIONS = [
  { id: 'backend', label: 'Backend' },
  { id: 'frontend', label: 'Frontend' },
  { id: 'ml', label: 'ML' },
  { id: 'infrastructure', label: 'Infrastructure' },
  { id: 'security', label: 'Security' },
] as const;

const ORIGINAL_PROBLEMS: Record<string, { title: string; description: string }> = {
  'two-sum': {
    title: 'Two Sum',
    description: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to target.`
  },
  'contains-duplicate': {
    title: 'Contains Duplicate',
    description: `Given an integer array \`nums\`, return \`true\` if any value appears at least twice in the array, and return \`false\` if every element is distinct.`
  },
  'valid-anagram': {
    title: 'Valid Anagram',
    description: `Given two strings \`s\` and \`t\`, return \`true\` if \`t\` is an anagram of \`s\`, and \`false\` otherwise.`
  },
  'best-time-to-buy-and-sell-stock': {
    title: 'Best Time to Buy and Sell Stock',
    description: `You are given an array \`prices\` where \`prices[i]\` is the price of a given stock on the ith day. You want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock. Return the maximum profit you can achieve from this transaction.`
  },
  'merge-two-sorted-lists': {
    title: 'Merge Two Sorted Lists',
    description: `You are given the heads of two sorted linked lists \`list1\` and \`list2\`. Merge the two lists into one sorted list by splicing together the nodes of the first two lists. Return the head of the merged linked list.`
  },
  'maximum-subarray': {
    title: 'Maximum Subarray',
    description: `Given an integer array \`nums\`, find the contiguous subarray which has the largest sum and return its sum.`
  },
  'climbing-stairs': {
    title: 'Climbing Stairs',
    description: `You are climbing a staircase. It takes \`n\` steps to reach the top. Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?`
  },
  'reverse-linked-list': {
    title: 'Reverse Linked List',
    description: `Given the head of a singly linked list, reverse the list, and return the reversed list.`
  },
  'invert-binary-tree': {
    title: 'Invert Binary Tree',
    description: `Given the root of a binary tree, invert the tree, and return its root.`
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
      'Community reports from Reddit, Blind, Glassdoor, and internal alumni outline how ML, Backend, Frontend, Infrastructure and Security coding interview loops at FAANG+ companies emphasise signal.',
  },
  {
    icon: BarChart4,
    title: 'Quality scoring engine',
    description:
      'Every AI-generated scenario is judged across six metrics - company relevance, role alignment, realism, technical fidelity, clarity, and safety.',
  },
] as const;

const STUDY_PLAN_STEPS = [
  {
    icon: Cpu,
    title: 'Define company, role, and timeline',
    description: (
      <>
        Select your target company from the tracked companies, specify your role (Backend, ML, Frontend, Infrastructure, Security), set your interview timeline, and optionally filter by difficulty or focus topics, the algorithm uses all this to match you with the most relevant problems.
      </>
    ),
  },
  {
    icon: Layers,
    title: 'AlgoIRL builds your personalized plan',
    description: (
      <>
        Our multi-dimensional scoring algorithm <strong>(frequency + recency + role alignment + company context)</strong> selects problems from our <strong>2000+ problem question bank</strong> and schedules them across your timeline with intelligent topic diversity to maximize coverage.
      </>
    ),
  },
  {
    icon: LineChart,
    title: 'Practice and track anywhere',
    description: (
      <>
        Solve company-contextualized problems with <strong>real-time code execution</strong>, mark progress as you go, and seamlessly resume from laptop, tablet, or phone, everything syncs automatically via our dual-layer persistence system.
      </>
    ),
  },
];

// FAQ items - will be filtered based on payments feature flag
const BASE_FAQ_ITEMS = [
  {
    question: 'Why not just use LeetCode\'s company tags or premium filters?',
    answer:
      'LeetCode company tags flag "Google asked this problem," but that\'s where they end - a static hint attached to a generic prompt. AlgoIRL rewrites every scenario using the company\'s product terminology, tech stack, and role expectations pulled from verified interview reports, then quality-scores it for relevance, realism, and clarity. You end up practicing the exact framing you\'ll have to navigate in the interview, not just the underlying algorithm. That context training under pressure is what company tags and premium filters don\'t deliver.',
  },
  {
    question: 'How are the study plans generated by this platform different from the study plans created on LeetCode?',
    answer:
      'LeetCode study plans sequence generic problems by topic and difficulty. AlgoIRL starts with your target company, role, prep timeline, and focus areas, then uses a multi-dimensional scoring engine (frequency, recency, role alignment, company context) to schedule problems across your calendar with intentional topic diversity. As you work the plan, it surfaces fresh company-contextualized transformations instead of recycling the same generic prompts. The result is a roadmap anchored to real interview signals rather than a static checklist.',
  },
  {
    question: 'When should I start using AlgoIRL for my interview prep?',
    answer:
      'Start 2 - 3 weeks before your interview. Use LeetCode first to master core patterns (aim for 50 - 200 problems solved). Once you\'re comfortable with the fundamentals, switch to AlgoIRL to train pattern recognition in company-specific contexts. This timeline gives you enough exposure to realistic scenarios without burning out. Our study plans automatically adjust problem difficulty and pacing based on your interview date, prioritizing recently-asked questions and company-specific patterns that matter most.',
  },
  {
    question: 'Should I use AlgoIRL with LeetCode, or instead of it?',
    answer:
      'Use LeetCode first, then AlgoIRL. LeetCode builds your foundational algorithmic skills through pattern repetition. AlgoIRL is designed to train users the skill of recognizing those same patterns when they\'re wrapped in company-specific context and jargon. Think of LeetCode as learning chess moves, and AlgoIRL as practicing against opponents with different playing styles. Most successful users solve 50 - 200 LeetCode problems first, then spend 2 - 3 weeks on AlgoIRL to build context-switching confidence before their interview.',
  },
] as const;

// Payment-related FAQs (only shown when payments are enabled)
const PAYMENT_FAQ_ITEMS = [
  {
    question: 'Can I see a few examples before I upgrade to the paid tier?',
    answer:
      'Yes! The free tier is designed for exactly this. You get full access to the Blind 75 dataset with unlimited company-role transformations. Try 10-15 problems across different companies and roles to see if AlgoIRL\'s context-rich scenarios help you recognize patterns faster. If you find the transformations valuable and want deeper topic coverage (50 graph problems instead of 10, advanced DP patterns, etc.), upgrade to access the full 2,000+ problem library. No trial periods, no credit card required to start.',
  },
  {
    question: 'What is included in the free plan?',
    answer:
      'You get study plans powered by the Blind 75 dataset, company-aware transformations for those problems, and our privacy-first workspace — all synced across devices. No credit card required, no time limit.',
  },
] as const;

const ADDITIONAL_FAQ_ITEMS = [
  {
    question: 'How accurate are the company-specific transformations?',
    answer:
      'Our fine-tuned LLM model was trained to optimize on six quality metrics - company relevance, role alignment, scenario realism, technical fidelity, clarity, and parsing accuracy. If a scenario doesn\'t feel realistic, regenerate it for a fresh take. We\'re continuously improving the model based on user feedback and new interview data to ensure high-quality transformations that truly reflect how companies frame problems in their interviews.',
  },
  {
    question: 'How does AlgoIRL source company and role intelligence?',
    answer:
      'We aggregate community-shared interview reports from Reddit, Blind, and Glassdoor, then combine that with detailed company product and architecture insights. We use LLM-as-judge evaluation to maintain high standards',
  }
] as const;

const FINAL_HIGHLIGHTS = [
  'Context-rich, hyperrealistic problems in under ten seconds',
  'Personalized study plans tailored to your company, role, and timeline',
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

export function IntroSection() {
  const currentYear = new Date().getFullYear();
  const { isDarkMode } = useDarkMode();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasActiveSubscription, loading } = useSubscription();
  const { flags } = useFeatureFlags();
  const { openAuthDialog } = useAuthDialog();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [postAuthAction, setPostAuthAction] = useState<string | null>(() => {
    if (typeof window === 'undefined') {
      return null;
    }
    return sessionStorage.getItem('post_auth_action');
  });

  const [selectedProblem, setSelectedProblem] = useState<(typeof PROBLEM_OPTIONS)[number]['id']>('two-sum');
  const [selectedCompany, setSelectedCompany] = useState<(typeof COMPANY_OPTIONS)[number]['id']>('google');
  const [selectedRole, setSelectedRole] = useState<(typeof ROLE_OPTIONS)[number]['id']>('backend');
  const [originalProblem, setOriginalProblem] = useState<{ title: string; description: string } | null>(ORIGINAL_PROBLEMS['two-sum']);
  const [demoState, setDemoState] = useState<DemoState | null>(null);
  const [demoError, setDemoError] = useState<string | null>(null);
  const [isTransforming, setIsTransforming] = useState(false);
  const [openStudyPlanSteps, setOpenStudyPlanSteps] = useState<number[]>(() => {
    if (typeof window === 'undefined') {
      return [0];
    }
    return window.innerWidth >= 1024 ? [0] : [];
  });

  useEffect(() => {
    if (!user || postAuthAction !== 'unlock-comprehensive') {
      return;
    }

    setPostAuthAction(null);
    sessionStorage.removeItem('post_auth_action');

    if (!hasActiveSubscription) {
      const timeoutId = window.setTimeout(() => {
        setShowPaymentModal(true);
      }, 500);

      return () => window.clearTimeout(timeoutId);
    }

    navigate('/my-study-plans');
  }, [user, postAuthAction, hasActiveSubscription, navigate]);

  const handleUnlockComprehensive = useCallback(() => {
    trackPaymentEvent('unlock_comprehensive_clicked', {
      source: 'landing_page_pricing_card',
      user_state: user ? 'authenticated' : 'anonymous',
    });

    if (loading) {
      return;
    }

    // Guard: Don't show payment UI if payments are disabled
    if (!flags.paymentsEnabled) {
      return;
    }

    if (!user) {
      sessionStorage.setItem('post_auth_action', 'unlock-comprehensive');
      setPostAuthAction('unlock-comprehensive');
      setShowAuthModal(true);
      return;
    }

    if (hasActiveSubscription) {
      toast.success('You already have the Comprehensive Plan!');
      navigate('/my-study-plans');
      return;
    }

    setShowPaymentModal(true);
    storePaymentContext({
      returnUrl: '/my-study-plans',
      feature: 'Comprehensive Plan',
      timestamp: Date.now(),
    });
  }, [hasActiveSubscription, loading, navigate, user, flags.paymentsEnabled]);

  const handlePaymentSuccess = useCallback(() => {
    trackPaymentEvent('unlock_comprehensive_payment_success', {
      source: 'landing_page_pricing_card',
    });
    setShowPaymentModal(false);
    toast.success('Welcome to Comprehensive Plan!');

    window.setTimeout(() => {
      navigate('/my-study-plans');
    }, 2000);
  }, [navigate]);

  const planButtonBaseClasses =
    'mt-6 inline-flex w-full items-center justify-center rounded-full px-6 py-2.5 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint/40 active:scale-[0.98]';
  const finalCtaClasses =
    'inline-flex items-center justify-center rounded-full px-8 py-3 text-base font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint/40 active:scale-[0.98]';

  const activeRequestRef = useRef<AbortController | null>(null);

  const handleSeeDemo = useCallback(() => {
    recordLandingEvent('landing_demo_scroll');
    document.getElementById('algoirl-live-demo')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const handlePlansRedirect = useCallback(() => {
    if (user) {
      navigate('/my-study-plans');
      return;
    }

    openAuthDialog({
      onSuccess: () => {
        navigate('/my-study-plans');
      },
    });
  }, [navigate, openAuthDialog, user]);

  // Dynamically build FAQ items based on payment feature flag
  const FAQ_ITEMS = [
    ...BASE_FAQ_ITEMS,
    ...(flags.paymentsEnabled ? PAYMENT_FAQ_ITEMS : []),
    ...ADDITIONAL_FAQ_ITEMS,
  ];

  // Debug logging
  useEffect(() => {
    secureLog.dev('IntroSection', 'Payments feature flag', { paymentsEnabled: flags.paymentsEnabled });
  }, [flags.paymentsEnabled]);

  const handleProblemChange = useCallback((problemId: typeof PROBLEM_OPTIONS[number]['id']) => {
    setSelectedProblem(problemId);
    setOriginalProblem(ORIGINAL_PROBLEMS[problemId] || null);
    setDemoState(null); // Clear transformed version
    setDemoError(null);
  }, []);

  const contextualizedResultRef = useRef<HTMLDivElement | null>(null);

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

      // Auto-scroll to contextualized result on mobile
      if (window.innerWidth < 1024) {
        setTimeout(() => {
          if (contextualizedResultRef.current) {
            const navbarHeight = 64; // Approximate navbar height
            const elementPosition = contextualizedResultRef.current.getBoundingClientRect().top + window.scrollY;
            const offsetPosition = elementPosition - navbarHeight - 5; // 5px additional padding

            window.scrollTo({
              top: offsetPosition,
              behavior: 'smooth',
            });
          }
        }, 100);
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        console.error('[Landing] prepareProblem failed', error);
        if (error instanceof APIRateLimitError) {
          setDemoError(null);
        } else {
          setDemoError('We could not generate that scenario right now. Please try again or switch the company or role.');
        }
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
      <SectionBlock surface="base" className="min-h-[calc(100vh-3.5rem)] flex items-center overflow-visible">
        <div className="w-full max-w-4xl mx-auto text-center space-y-6 sm:space-y-8 -mt-14">
          <h1 className="text-7xl sm:text-8xl lg:text-9xl font-light tracking-tight font-playfair leading-[1.2] group">
            <span
              className="inline-block px-4 py-4 logo-hover-scale relative cursor-pointer"
              style={{
                '--logo-gradient-image': `
                  linear-gradient(135deg,
                    var(--logo-gradient-start) 0%,
                    var(--logo-gradient-mid1) 25%,
                    var(--logo-gradient-mid2) 60%,
                    var(--logo-gradient-end) 100%),
                  linear-gradient(90deg,
                    transparent 0%,
                    rgba(255, 255, 255, 0.1) 50%,
                    transparent 100%)`,
                '--logo-background-size': '200% 200%, 200% 100%',
                '--logo-background-position': '0% 50%, -200% 0%',
                '--logo-gradient-name': 'logo-gradient-shift',
                '--logo-gradient-duration': '4s',
                '--logo-gradient-timing': 'ease-in-out',
                '--logo-gradient-iterations': 'infinite',
                letterSpacing: '-0.01em',
                transition: 'transform 0.3s ease',
              } as CSSProperties}
            >
              <span
                className="logo-text-segment"
                style={{
                  '--logo-letter-delay': '0.1s',
                } as CSSProperties}
              >
                Algo
              </span>
              <span
                className="font-normal logo-text-segment"
                style={{
                  '--logo-letter-delay': '0.3s',
                  letterSpacing: '-0.01em',
                } as CSSProperties}
              >
                IRL
              </span>
            </span>
          </h1>

          <p className="text-sm text-content-muted sm:text-base">
            A hyperrealistic interview simulator, designed to bridge the gap between your coding interview preparation and how companies actually frame problems in the real interview
          </p>

          <div>
            <button
              onClick={handleSeeDemo}
              className="inline-flex items-center justify-center px-8 py-3 text-base font-medium text-white bg-gradient-to-r from-[#3B82F6] to-[#6366F1] hover:from-[#2563EB] hover:to-[#4F46E5] rounded-full border border-[#6366F1]/30 shadow-[0_2px_8px_rgba(99,102,241,0.25),0_1px_18px_rgba(255,255,255,0.4)_inset] dark:shadow-[0_2px_8px_rgba(99,102,241,0.3),0_1px_18px_rgba(255,255,255,0.12)_inset] transition-all duration-300 hover:shadow-[0_4px_16px_rgba(99,102,241,0.35),0_2px_26px_rgba(255,255,255,0.5)_inset] dark:hover:shadow-[0_4px_16px_rgba(99,102,241,0.4),0_2px_26px_rgba(255,255,255,0.16)_inset] hover:scale-[1.02] transform hover:-translate-y-0.5 backdrop-blur-xl"
            >
              See it in action
            </button>
          </div>
        </div>
      </SectionBlock>

      <SectionBlock
        id="algoirl-live-demo"
        surface="muted"
        containerClassName="text-center"
      >
        <div className="max-w-3xl mx-auto space-y-3 sm:space-y-4 text-center">
          <h2 className="text-3xl font-thin text-content font-playfair sm:text-4xl">Try it for yourself</h2>
          <p className="text-sm text-content-muted leading-relaxed sm:text-base">
            Pick a familiar problem, choose the company and role, and let AlgoIRL do its magic
          </p>
        </div>
        <div className="grid gap-4 sm:gap-6 lg:gap-8 text-center lg:grid-cols-[minmax(0,320px),1fr]">
          <div className="space-y-2 sm:space-y-3 rounded-3xl border border-outline-subtle/25 bg-background p-4 text-center">
            <div className="space-y-2">
              <label className="text-sm font-medium text-content">Select problem</label>
              <select
                value={selectedProblem}
                onChange={(event) => handleProblemChange(event.target.value as (typeof PROBLEM_OPTIONS)[number]['id'])}
                className="w-full rounded-xl border border-outline-subtle/25 bg-background px-3 py-2 text-sm text-content focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint/30"
              >
                {PROBLEM_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2 sm:gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-content-muted">Company</label>
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
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-content-muted">Role</label>
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
            <p className="text-xs text-content-muted">
              Run it again for a fresh take (no two problems are exactly same!)
            </p>
          </div>
          <div className="space-y-4 sm:space-y-6 text-center">
            {originalProblem && (
              <div className="space-y-3 sm:space-y-4">
                <div className="space-y-2">
                  <div className="text-xs font-medium text-content-muted">
                    Original LeetCode problem
                  </div>
                  <div className="rounded-3xl border border-outline-subtle/25 bg-background p-6">
                    <div className="prose prose-sm max-w-none text-content dark:prose-invert text-left">
                      <h3 className="text-lg font-thin text-content font-playfair">{originalProblem.title}</h3>
                      <ReactMarkdown>{originalProblem.description}</ReactMarkdown>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleTransform}
                  disabled={isTransforming}
                  className="w-full inline-flex items-center justify-center px-5 py-2 text-sm font-medium rounded-xl transition duration-200 bg-gradient-to-r from-[#3B82F6] to-[#6366F1] text-white border border-[#6366F1]/30 shadow-[0_2px_8px_rgba(99,102,241,0.25),0_1px_18px_rgba(255,255,255,0.4)_inset] dark:shadow-[0_2px_8px_rgba(99,102,241,0.3),0_1px_18px_rgba(255,255,255,0.12)_inset] hover:-translate-y-0.5 hover:from-[#2563EB] hover:to-[#4F46E5] hover:shadow-[0_4px_16px_rgba(99,102,241,0.35),0_2px_26px_rgba(255,255,255,0.5)_inset] dark:hover:shadow-[0_4px_16px_rgba(99,102,241,0.4),0_2px_26px_rgba(255,255,255,0.16)_inset] hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]/40 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-xl"
                >
                  {isTransforming ? 'Contextualizing...' : 'Contextualize'}
                </button>
              </div>
            )}
            {isTransforming ? (
              <div className="rounded-3xl border border-outline-subtle/25 bg-background p-6">
                <div className="flex min-h-[100px] items-start justify-start">
                  <ThinkingIndicator
                    states={[
                      'Thinking...',
                      'Analyzing...',
                      'Generating...',
                      'Processing...',
                      'Computing...',
                    ]}
                    typingSpeed={80}
                    deletingSpeed={40}
                    pauseDuration={1500}
                  />
                </div>
              </div>
            ) : demoError ? (
              <div className="rounded-3xl border border-outline-subtle/25 bg-background p-6">
                <div className="text-sm text-destructive">{demoError}</div>
              </div>
            ) : demoState ? (
              <div className="space-y-4">
                <div className="space-y-2" ref={contextualizedResultRef}>
                  <div className="text-xs font-medium text-mint">
                    Contextualized by AlgoIRL for {COMPANY_OPTIONS.find((company) => company.id === selectedCompany)?.label}{' '}
                    {ROLE_OPTIONS.find((role) => role.id === selectedRole)?.label} role
                  </div>
                  <div className="rounded-3xl border border-mint/60 bg-background p-6">
                    <div className="prose prose-sm max-w-none text-content dark:prose-invert text-left">
                      {demoState.title && <h3 className="text-lg font-thin text-content font-playfair">{demoState.title}</h3>}
                      {demoState.background && <p className="text-content-muted">{demoState.background}</p>}
                      <ReactMarkdown>{demoState.problemStatement}</ReactMarkdown>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-dashed border-outline-subtle/40 bg-background/70 p-4 text-xs text-content-muted">
                  <strong>Does this look similar to what you've seen in real interviews?</strong> Our LLM has been trained to provide hyperrealistic interviewing scenarios tailored to each company's style, products, and tech stack, combined with role-specific insights. AlgoIRL evaluates every scenario across six quality metrics to maintain high company relevance and role accuracy.
                </div>
              </div>
            ) : originalProblem ? (
              <div className="rounded-3xl border border-dashed border-outline-subtle/40 bg-background/70 p-8 text-center text-sm text-content-muted">
                Click "Contextualize" to see how AlgoIRL transforms this problem for {COMPANY_OPTIONS.find((company) => company.id === selectedCompany)?.label}{' '}
                {ROLE_OPTIONS.find((role) => role.id === selectedRole)?.label} role.
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-outline-subtle/40 bg-background/70 p-8 text-center text-sm text-content-muted">
                Select a problem to get started.
              </div>
            )}
          </div>
        </div>
      </SectionBlock>

      <SectionBlock surface="muted" containerClassName="py-16">
        <div className="space-y-6">
          <div className="space-y-3 text-center">
            <h2 className="text-3xl font-thin text-content font-playfair text-center sm:text-4xl">Study plans tailored to your timeline, role, and target company</h2>
            <p className="mx-auto max-w-2xl text-sm text-content-muted leading-relaxed sm:text-base">
              Set your company, role, and timeline to get a personalized plan tuned to the latest interview signals.
            </p>
          </div>

          <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-8">
            <div className="w-full space-y-6 px-1 flex-none lg:w-1/2 lg:max-w-none">
              <div className="w-full overflow-hidden rounded-2xl border border-outline-subtle/25 bg-background/90 shadow-[0_18px_45px_rgba(15,23,42,0.06)] dark:shadow-[0_18px_45px_rgba(15,23,42,0.35)]">
                {STUDY_PLAN_STEPS.map((step, index) => {
                  const isOpen = openStudyPlanSteps.includes(index);
                  return (
                    <details
                      key={step.title}
                      open={isOpen}
                      onToggle={(event) => {
                        const { open } = event.currentTarget;
                        setOpenStudyPlanSteps((prev) => {
                          if (open) {
                            if (prev.includes(index)) {
                              return prev;
                            }
                            return [...prev, index];
                          }
                          return prev.filter((value) => value !== index);
                        });
                      }}
                      className="group relative border-t border-outline-subtle/20 transition-colors first:border-t-0 open:bg-panel-50/60 dark:open:bg-panel-200/30"
                    >
                      <summary className="flex w-full cursor-pointer list-none items-start justify-between gap-3 sm:gap-4 py-4 sm:py-5 pl-5 pr-5 sm:pl-6 sm:pr-6 text-left text-base font-medium leading-snug text-content transition-colors duration-200 sm:text-lg">
                        <span className="flex flex-1 items-start gap-3 sm:gap-4">
                          <span className="flex-1 min-w-0">
                            <span className="text-xs font-medium tracking-wide text-content-muted">Step {index + 1}</span>
                            <span className="mt-1 block text-base font-thin text-content font-playfair sm:text-lg">{step.title}</span>
                          </span>
                        </span>
                        <span className="relative mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center">
                          <span className="absolute block h-px w-4 bg-content transition-transform duration-200 ease-out group-open:rotate-90" />
                          <span className="block h-4 w-px bg-content transition-opacity duration-200 ease-out group-open:opacity-0" />
                        </span>
                      </summary>
                      <div className="pb-5 pl-5 pr-5 sm:pb-6 sm:pl-6 sm:pr-6 pt-1 text-[0.9375rem] leading-relaxed text-content-muted">
                        {step.description}
                      </div>
                      <span className="pointer-events-none absolute left-0 top-0 h-full w-[3px] bg-mint/50 opacity-0 transition-opacity duration-200 ease-out group-open:opacity-100" />
                    </details>
                  );
                })}
              </div>
            </div>

            <div className="w-full flex-none lg:w-1/2 lg:max-w-none">
              <InlineStudyPlanBuilder onAuthModalOpen={() => setShowAuthModal(true)} />
            </div>
          </div>
        </div>
      </SectionBlock>

      <SectionBlock surface="tinted">
        <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6">
          <div className="max-w-3xl mx-auto text-center space-y-1 sm:space-y-2">
            <h2 className="text-3xl font-thin text-content font-playfair text-center sm:text-4xl">Data-backed interview prep</h2>
          </div>

          <p className="mx-auto max-w-3xl text-center text-sm text-content-muted leading-relaxed sm:text-base">
            Studies show{' '}
            <a
              href="https://www.carejobz.com.au/i-froze-completely-interview-response-uncovered/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-content hover:text-mint"
            >
              62% of professionals freeze during interviews
            </a>
            , often on problems they have already mastered, while{' '}
            <a
              href="https://resources.biginterview.com/interviews-101/interview-anxiety/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-content hover:text-mint"
            >
              93% experience anxiety
            </a>
            {' '}severe enough to{' '}
            <a
              href="https://www.tandfonline.com/doi/full/10.1080/10253890.2024.2364333"
              target="_blank"
              rel="noopener noreferrer"
              className="text-content hover:text-mint"
            >
              impair working memory and pattern recognition
            </a>
            . Candidates average 5 to 10 minutes wrestling with problems they could solve instantly in practice.
          </p>

          <p className="mx-auto max-w-3xl text-center text-sm text-content-muted leading-relaxed sm:text-base">
            The disconnect? You studied "Reverse a Linked List," but the interviewer asks about "Implementing undo functionality for our document editor." Same algorithm, unrecognizable context. This gap between practice and reality is where preparation breaks down.
          </p>

          <div className="grid gap-3 sm:gap-4 text-left md:grid-cols-2">
            <div className="space-y-1.5 sm:space-y-2 rounded-3xl border border-outline-subtle/25 bg-background p-4 sm:p-5">
              <h3 className="text-lg font-thin text-content font-playfair">Without AlgoIRL</h3>
              <p className="text-sm text-content-muted">
                Pure problem drilling builds algorithmic skill but rarely mirrors how your target company sets the stage.
              </p>
              <ul className="space-y-1.5 text-sm text-content-muted">
                <li>No product or stack context to anchor pattern recognition under stress.</li>
              </ul>
            </div>
            <div className="space-y-1.5 sm:space-y-2 rounded-3xl border border-outline-subtle/25 bg-background p-4 sm:p-5">
              <h3 className="text-lg font-thin text-content font-playfair">With AlgoIRL</h3>
              <p className="text-sm text-content-muted">
                Hyperrealistic scenarios rehearse recognition, not just solutions, so you stay composed when the framing shifts.
              </p>
              <ul className="space-y-1.5 text-sm text-content-muted">
                <li>Context-rich rewrites across 20 companies and 5 roles keep patterns recognizable.</li>
                <li>Adaptive study plans adjust sequencing as your interview date approaches.</li>
              </ul>
            </div>
          </div>

          <div className="space-y-2 sm:space-y-3 rounded-3xl border border-outline-subtle/25 bg-background p-4 sm:p-5">
            <h3 className="text-lg font-thin text-content font-playfair">How AlgoIRL closes the gap</h3>
            <div className="space-y-2.5 sm:space-y-3">
              {DATA_FACTORS.map((factor) => (
                <div key={factor.title} className="flex items-start gap-3">
                  <factor.icon className="mt-1 h-5 w-5 text-mint" />
                  <div>
                    <div className="text-base font-thin text-content font-playfair">{factor.title}</div>
                    <p className="text-sm text-content-muted">{factor.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SectionBlock>

      {flags.paymentsEnabled && (
        <SectionBlock surface="tinted" containerClassName="text-center" className="sm:py-20 md:py-24">
          <div className="max-w-3xl mx-auto space-y-3 sm:space-y-4 text-center">
            <h2 className="text-3xl font-thin text-content font-playfair sm:text-4xl">
              Choose the plan that fits your depth of prep
            </h2>
            <p className="text-sm text-content-muted leading-relaxed sm:text-base">
              Both plans include the same interface and privacy-first experience. Upgrade when you need the full company and role dataset.
            </p>
          </div>
          <div className="grid gap-4 sm:gap-6 text-center md:grid-cols-2">
            <div className="flex flex-col rounded-3xl border border-outline-subtle/25 bg-background p-6 sm:p-8 text-center">
            <div className="text-sm font-semibold uppercase tracking-wide text-content-muted">Free</div>
            <div className="mt-3 text-3xl font-semibold text-content">$0</div>
            <div className="text-sm text-content-muted">Always available</div>
            <ul className="mt-4 sm:mt-6 flex-1 space-y-2.5 sm:space-y-3 text-sm text-content">
              <li className="flex items-start gap-3 text-left">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-mint" />
                <span className="leading-snug">Study plans powered by the Blind 75 dataset</span>
              </li>
              <li className="flex items-start gap-3 text-left">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-mint" />
                <span className="leading-snug">Company-aware transformations for every included problem</span>
              </li>
              <li className="flex items-start gap-3 text-left">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-mint" />
                <span className="leading-snug">Progress sync across devices</span>
              </li>
              <li className="flex items-start gap-3 text-left">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-mint" />
                <span className="leading-snug">Full code editor with test case execution</span>
              </li>
              <li className="flex items-start gap-3 text-left">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-mint" />
                <span className="leading-snug">All companies and roles supported</span>
              </li>
            </ul>
            <button
              type="button"
              onClick={handlePlansRedirect}
              className={`${planButtonBaseClasses} border border-outline-subtle/40 bg-background text-content shadow-sm hover:border-mint/60 hover:text-mint hover:shadow-md`}
            >
              Start free today
            </button>
            </div>
            <div className="flex flex-col rounded-3xl border border-mint/60 bg-background p-6 sm:p-8 text-center">
            <div className="text-sm font-semibold uppercase tracking-wide text-mint">Comprehensive</div>
            <div className="mt-3 flex flex-col items-center gap-3">
              <span className="inline-flex items-center gap-1 rounded-full border border-mint/50 bg-mint/10 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-mint-700">
                Beta access
              </span>
              <span className="text-sm font-medium text-content-muted line-through decoration-2 decoration-mint-500/80">
                $5.99 per month
              </span>
              <span className="text-3xl font-semibold text-content">
                Free for a limited time
              </span>
            </div>
            <p className="mt-2 text-sm font-medium text-mint-600">
              Secure beta access before pricing goes live.
            </p>
            <ul className="mt-4 sm:mt-6 flex-1 space-y-2.5 sm:space-y-3 text-sm text-content">
              <li className="flex items-start gap-3 text-left">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-mint" />
                <span className="leading-snug">Everything in the free plan</span>
              </li>
              <li className="flex items-start gap-3 text-left">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-mint" />
                <span className="leading-snug">Study plans that draw from the full 2,000+ problem dataset</span>
              </li>
              <li className="flex items-start gap-3 text-left">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-mint" />
                <span className="leading-snug">Deeper topic coverage (e.g., 50 graph problems vs Blind 75's 10)</span>
              </li>
            </ul>
            <button
              type="button"
              onClick={handleUnlockComprehensive}
              disabled={loading || hasActiveSubscription}
              className={`${planButtonBaseClasses} bg-gradient-to-r from-[#7DD3FC] to-[#60A5FA] text-white shadow-lightblue-glow hover:-translate-y-0.5 hover:from-[#60A5FA] hover:to-[#3B82F6] hover:shadow-lg hover:scale-[1.02] ${
                loading ? 'cursor-wait opacity-70' : ''
              } ${hasActiveSubscription ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {hasActiveSubscription ? 'Already subscribed' : 'Unlock comprehensive plans'}
            </button>
            </div>
          </div>
        </SectionBlock>
      )}

      <SectionBlock surface="muted" containerClassName="text-left">
        <div className="max-w-3xl mx-auto space-y-3 sm:space-y-4 text-center">
          <h2 className="text-3xl font-thin text-content font-playfair sm:text-4xl">Frequently asked questions</h2>
        </div>
        <div className="mx-auto w-full max-w-3xl px-1">
          <div className="w-full overflow-hidden rounded-2xl border border-outline-subtle/25 bg-background/90 shadow-[0_18px_45px_rgba(15,23,42,0.06)] dark:shadow-[0_18px_45px_rgba(15,23,42,0.35)]">
            {FAQ_ITEMS.map((faq) => (
              <details
                key={faq.question}
                className="group relative border-t border-outline-subtle/20 transition-colors first:border-t-0 open:bg-panel-50/60 dark:open:bg-panel-200/30"
              >
                <summary className="flex w-full cursor-pointer list-none items-start justify-between gap-3 sm:gap-4 py-4 sm:py-5 pl-5 pr-5 sm:pl-6 sm:pr-6 text-left text-base font-medium leading-snug text-content transition-colors duration-200 sm:text-lg">
                  <span className="flex-1 tracking-tight">{faq.question}</span>
                  <span className="relative mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center">
                    <span className="absolute block h-px w-4 bg-content transition-transform duration-200 ease-out group-open:rotate-90" />
                    <span className="block h-4 w-px bg-content transition-opacity duration-200 ease-out group-open:opacity-0" />
                  </span>
                </summary>
                <div className="pb-5 pl-5 pr-5 sm:pb-6 sm:pl-6 sm:pr-6 pt-1 text-sm leading-relaxed text-content-muted sm:text-base">
                  {faq.answer}
                </div>
                <span className="pointer-events-none absolute left-0 top-0 h-full w-[3px] bg-mint/50 opacity-0 transition-opacity duration-200 ease-out group-open:opacity-100" />
              </details>
            ))}
          </div>
        </div>
      </SectionBlock>

      <SectionBlock surface="base" containerClassName="text-center">
        <div className="mx-auto max-w-3xl space-y-4 sm:space-y-6 text-center">
          <h2 className="text-3xl font-thin text-content font-playfair sm:text-4xl">Build confidence with company-aware, role-specific practice powered by AI</h2>
          <p className="text-sm text-content-muted leading-relaxed sm:text-base">
            {flags.paymentsEnabled
              ? "Start for free and upgrade when you are ready for comprehensive study plans"
              : "Start for free with comprehensive study plans powered by AI"
            }
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
            <button
              type="button"
              onClick={handlePlansRedirect}
              className={`${finalCtaClasses} w-full bg-gradient-to-r from-[#3B82F6] to-[#6366F1] text-white border border-[#6366F1]/30 shadow-[0_2px_8px_rgba(99,102,241,0.25),0_1px_18px_rgba(255,255,255,0.4)_inset] dark:shadow-[0_2px_8px_rgba(99,102,241,0.3),0_1px_18px_rgba(255,255,255,0.12)_inset] hover:-translate-y-0.5 hover:from-[#2563EB] hover:to-[#4F46E5] hover:shadow-[0_4px_16px_rgba(99,102,241,0.35),0_2px_26px_rgba(255,255,255,0.5)_inset] dark:hover:shadow-[0_4px_16px_rgba(99,102,241,0.4),0_2px_26px_rgba(255,255,255,0.16)_inset] hover:scale-[1.02] backdrop-blur-xl sm:w-auto`}
            >
              Create my free account
            </button>
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
      </SectionBlock>

      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          postAuthAction="unlock-comprehensive"
          message="Access the full 2,000+ problem dataset with tailored walkthroughs and interview intel."
          onAuthSuccess={() =>
            trackPaymentEvent('unlock_comprehensive_auth_success', { source: 'landing_page_pricing_card' })
          }
        />
      )}

      {showPaymentModal && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            trackPaymentEvent('unlock_comprehensive_payment_closed', { source: 'landing_page_pricing_card' });
          }}
          returnUrl="/my-study-plans"
          feature="Comprehensive Plan"
          onSuccess={handlePaymentSuccess}
          onFailure={(error) => {
            trackPaymentEvent('unlock_comprehensive_payment_failed', {
              source: 'landing_page_pricing_card',
              message: error.message,
            });
            toast.error(error.message);
          }}
        />
      )}
    </div>
  );
}
