// Centralized type definitions
// Interfaces extracted from various components for better code organization

// From AppRouter.tsx
export interface Problem {
  title: string;
  background: string;
  problemStatement: string;
  testCases: TestCase[];
  constraints: string[];
  requirements: string[];
  leetcodeUrl: string;
  problemId?: string;
}

// From utils/codeExecution.ts
export interface TestCase {
  stdin: any;
  expectedStdout: any;
  isSample?: boolean;
  explanation?: string;
  // Add any other relevant fields for a test case
}

// From AppRouter.tsx
export interface CodeDetails {
  defaultUserCode?: string;
  functionName?: string;
  solutionStructureHint?: string;
  boilerplateCode: string;
  language: string;
}

// From ProblemForm.tsx
export interface FormData {
  dataset: string;
  company: string;
  difficulty: string;
  topic: string;
  specificProblemSlug?: string;
}

// Company from API
export interface Company {
  id: string;
  name: string;
} 