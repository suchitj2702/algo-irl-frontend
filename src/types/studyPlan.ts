// Study Plan Type Definitions
// These types match the API response from /api/study-plan/generate

export type RoleFamily = 'backend' | 'ml' | 'frontend' | 'infrastructure' | 'security';

export type ProblemDifficulty = 'Easy' | 'Medium' | 'Hard';

export interface DifficultyPreference {
  easy: boolean;
  medium: boolean;
  hard: boolean;
}

export interface StudyPlanConfig {
  companyId: string;
  roleFamily: RoleFamily;
  timeline: number; // days (1-90)
  hoursPerDay: number; // 0.5-8
  difficultyPreference?: DifficultyPreference;
  topicFocus?: string[]; // max 5 topics
}

export interface HotnessBreakdown {
  frequency: number; // 0-35 points
  recency: number; // 0-25 points
  roleRelevance: number; // 0-25 points
  companyContext: number; // 0-15 points
}

export interface FrequencyData {
  overall: number; // 0-100
  recency: string[]; // ['thirtyDays', 'threeMonths', etc.]
  isActuallyAsked: boolean;
}

export interface EnrichedTopics {
  dataStructures: string[];
  algorithmPatterns: string[];
  domainConcepts: string[];
  complexityClass: string;
}

export interface EnrichedProblem {
  problemId: string;
  title: string;
  difficulty: ProblemDifficulty;
  hotnessScore: number; // 0-100
  hotnessBreakdown: HotnessBreakdown;
  frequencyData: FrequencyData;
  roleRelevance: number; // 0-100
  enrichedTopics: EnrichedTopics;
  estimatedTimeMinutes: number;
  dayAssigned: number;
}

export interface DaySchedule {
  day: number;
  date: string; // ISO date string
  problems: EnrichedProblem[];
  estimatedHours: number;
  topics: string[]; // unique topics for this day
}

export interface StudyPlanQuality {
  actualCompanyProblems: number;
  extrapolatedProblems: number;
  topicCoverage: number;
}

export interface StudyPlanMetadata {
  companyName: string;
  role: RoleFamily;
  generatedAt: string; // ISO timestamp
  quality: StudyPlanQuality;
}

export interface StudyPlanResponse {
  studyPlan: {
    totalProblems: number;
    estimatedHours: number;
    dailySchedule: DaySchedule[];
    metadata: StudyPlanMetadata;
  };
}

// For caching study plans locally
export interface CachedStudyPlan {
  id: string; // unique identifier
  config: StudyPlanConfig;
  response: StudyPlanResponse;
  progress: {
    completedProblems: string[]; // problem IDs
    bookmarkedProblems: string[];
    inProgressProblems: string[];
    currentDay: number;
    lastUpdated: number; // timestamp
  };
  createdAt: number; // timestamp
}

// For displaying role options in the form
export interface RoleOption {
  id: RoleFamily;
  name: string;
  description: string;
  icon: string; // emoji or icon identifier
}

export const ROLE_OPTIONS: RoleOption[] = [
  {
    id: 'backend',
    name: 'Backend',
    description: 'APIs, databases, distributed systems',
    icon: '⚙️'
  },
  {
    id: 'ml',
    name: 'Machine Learning',
    description: 'Algorithms, data processing, optimization',
    icon: '🤖'
  },
  {
    id: 'frontend',
    name: 'Frontend',
    description: 'UI/UX, rendering, state management',
    icon: '🎨'
  },
  {
    id: 'infrastructure',
    name: 'Infrastructure',
    description: 'Systems, networking, scalability',
    icon: '🏗️'
  },
  {
    id: 'security',
    name: 'Security',
    description: 'Cryptography, authentication, vulnerabilities',
    icon: '🔒'
  }
];

// Timeline options for the form
export const TIMELINE_OPTIONS = [7, 14, 21, 30] as const;

// Common algorithm topics for topic focus dropdown
export const COMMON_TOPICS = [
  'Array',
  'Hash Table',
  'Two Pointers',
  'Sliding Window',
  'Binary Search',
  'Dynamic Programming',
  'Greedy',
  'Backtracking',
  'DFS',
  'BFS',
  'Tree',
  'Graph',
  'Heap',
  'Stack',
  'Queue',
  'Linked List',
  'String',
  'Math',
  'Bit Manipulation',
  'Trie',
  'Union Find',
  'Topological Sort',
  'Sorting',
  'Recursion'
];
