# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AlgoIRL is a React application that transforms LeetCode problems into real-world scenarios from top tech companies. Users practice algorithms in context of actual products, with features like Blind 75 progress tracking, AI-generated study plans, and instant code execution.

## Commands

```bash
# Development
npm run dev          # Start dev server (Vite on localhost:5173, proxies /api to localhost:3000)
npm run build        # Production build
npm run preview      # Preview production build

# Testing
npm test             # Run vitest unit tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
npm run test:e2e     # Run Playwright e2e tests (requires dev server)
npm run test:e2e:ui  # Run e2e tests with UI
npm run test:all     # Run both unit and e2e tests

# Linting
npm run lint         # ESLint for .js,.jsx,.ts,.tsx files
```

## Architecture

### State Management Pattern

**Centralized Routing in AppRouter.tsx** (~1500+ lines): All application state is managed here and flows down via props to child components. This is intentional - not a code smell.

- URL state management for deep linking
- Direct integration with cache services
- Coordinates between localStorage cache and Firestore sync

### Cache-First Data Strategy

The app prioritizes instant UX with background sync:

1. **Cache is source of truth** during active sessions (localStorage)
2. **Optimistic updates** - UI updates instantly, sync happens in background
3. **Hybrid auto-save** - localStorage at 500ms, Firestore at 3s debounce

Data flow: Cache check (<5ms) → Firestore fallback (100-500ms) → API fetch (if never accessed)

### Key Services

| Service | Purpose |
|---------|---------|
| `src/services/studyPlanCacheService.ts` | localStorage CRUD for study plans |
| `src/services/studyPlanFirestoreService.ts` | Firestore API integration |
| `src/hooks/useDebounceAutoSave.ts` | Code editor auto-save (500ms local, 3s cloud) |
| `src/hooks/useStudyPlanAutoSave.ts` | Study plan data auto-save |
| `src/hooks/usePlanProgressState.ts` | Progress tracking with optimistic updates |

### Context Providers

- `AuthContext` - Firebase auth, Google sign-in, subscription status
- `SubscriptionContext` - Premium/payment state
- `FeatureFlagsContext` - Feature toggles
- `AuthDialogContext` - Auth modal state
- `DarkModeContext` - Theme toggle

### Directory Structure

```
src/
├── components/           # React components
│   ├── pages/           # Route-level page components
│   ├── ui/              # shadcn/ui primitives (Button, Card, Badge, Dialog)
│   ├── auth/            # Auth-related components
│   ├── engineering-notes/ # Blog/documentation pages
│   └── AppRouter.tsx    # Central state + routing
├── contexts/            # React contexts
├── hooks/               # Custom hooks (auto-save, debounce, subscription)
├── services/            # API/cache services
├── utils/               # Utilities (cache, api-service, analytics, etc.)
├── types/               # TypeScript types
├── config/              # Firebase, Sentry, API config
├── constants/           # Static data (Blind 75 problems)
└── test/                # Test setup and mocks
```

### External Integrations

- **Firebase**: Auth + Firestore for cross-device sync
- **Razorpay**: Payment processing (India)
- **Judge0 API**: Code execution
- **Monaco Editor**: VS Code editor component
- **Sentry**: Error tracking (production)
- **Vercel Analytics**: Usage analytics

## Testing

**Unit tests**: Located in `src/__tests__/` and `src/utils/__tests__/`, run with Vitest + React Testing Library

**E2E tests**: Located in `tests/playwright-e2e/`, configured for Chromium

**Test setup**: `src/test/setup.ts` with mocks in `src/test/mocks/`

## Cache Key Format

- Study plans: `algoirl_study_plan_{planId}`
- Plans index: `algoirl_study_plans_index`
- Legacy problem format: `problem_{planId}_{problemId}`

## Environment Variables

Copy `env.example` to `.env`:
- `VITE_API_URL` - Dev API (empty = use Vite proxy)
- `VITE_PRODUCTION_API_URL` - Production API
- `VITE_FIREBASE_*` - Firebase config
- `VITE_RAZORPAY_KEY_ID` - Razorpay public key

## Debugging

Console logs use emoji prefixes for filtering:
- `💾 [Cache]` - localStorage operations
- `☁️ [Sync]` / `☁️ [Auto-Save]` - Firestore operations
- `✅ [Resume]` / `🆕 [Resume]` - Problem resume flow

## Path Aliases

`@/*` maps to `./src/*` (configured in tsconfig.json and vite.config.ts)

## UI Components

Uses shadcn/ui with Radix primitives. Import from `@/components/ui/`:
```tsx
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
```