# AlgoIRL - Algorithms In Real Life

Transform LeetCode problems into real-world scenarios from top tech companies. Practice algorithms in the context of actual products you use daily.

## Features

- 🎯 **Company-Specific Context**: Solve problems framed as real features from Google, Meta, Netflix, and more
- 💡 **Blind 75 Progress Tracking**: Master the most important interview problems with progress tracking
- 📚 **Personalized Study Plans**: AI-generated study plans tailored to your timeline and difficulty preferences
- ⚡ **Cache-First Architecture**: Lightning-fast resume and navigation (<5ms) with intelligent caching
- 💾 **Hybrid Auto-Save**: Never lose progress with dual localStorage + Firestore sync
- 🚀 **Instant Code Execution**: Run your solutions against test cases without leaving the browser
- 🌓 **Dark Mode**: Easy on the eyes during those late-night practice sessions
- 📱 **Responsive Design**: Practice on any device

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui with Radix UI primitives
- **Code Editor**: Monaco Editor (VS Code's editor)
- **State Management**: React Hooks + Context with Optimistic Updates
- **Data Persistence**: Hybrid localStorage + Firebase Firestore
- **Build Tool**: Vite
- **Code Execution**: Judge0 API
- **Authentication**: Firebase Auth
- **Styling**: Tailwind CSS with CSS Variables

## Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/suchitj2702/algo-irl-frontend.git

# Navigate to project directory
cd algo-irl-frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Variables

Create a `.env` file in the root directory (copy from `env.example`):

```env
# Development API URL (leave empty to use Vite proxy)
VITE_API_URL=

# Production API URL (optional, overrides default)
VITE_PRODUCTION_API_URL=https://your-api-domain.com
```

**Note**: The application will fall back to the default production URL if no environment variables are set.

## Architecture

### Cache-First Data Strategy

AlgoIRL implements a sophisticated **cache-first architecture** that prioritizes instant user experience while ensuring data durability through background synchronization.

#### Core Principles

1. **Cache is Source of Truth** - During an active session, all reads come from localStorage
2. **Optimistic Updates** - UI updates instantly, sync happens in background
3. **Hybrid Auto-Save** - Dual-layer persistence with different debounce timings
4. **Smart Fallbacks** - Graceful degradation with multiple data sources

#### Data Flow Architecture

```
┌─────────────────────────────────────────────────────────┐
│  User Action: Edit Code / Resume Problem / Navigate    │
└─────────────────────────────────────────────────────────┘
                         ↓
              ┌──────────────────────┐
              │ 1. Check Cache FIRST │ ← ⚡ <5ms (INSTANT)
              │  localStorage         │
              └──────────────────────┘
                         ↓
                    ┌────────┐
                    │ Found? │
                    └────────┘
                    /          \
              YES ✅          NO ❌
                 ↓                ↓
    ┌──────────────────┐   ┌──────────────────────┐
    │ Load from cache  │   │ 2. Check Firestore   │ ← ☁️ 100-500ms
    │ (has latest data)│   │ (cross-device sync)  │
    └──────────────────┘   └──────────────────────┘
              ↓                      ↓
    ┌──────────────────┐        ┌────────┐
    │ Display to user  │        │ Found? │
    │ (instant)        │        └────────┘
    └──────────────────┘         /       \
         ↓                 YES ✅       NO ❌
    ┌─────────────┐         ↓            ↓
    │ Auto-save:  │   ┌───────────┐  ┌──────────┐
    │ 500ms local │   │ Cache it  │  │ 3. Fetch │
    │ 3s cloud    │   │ & display │  │ from API │
    └─────────────┘   └───────────┘  └──────────┘
```

### Hybrid Auto-Save System

Three specialized auto-save hooks work together for optimal performance:

#### 1. `useDebounceAutoSave` - Code Editor Auto-Save
**Location**: [src/hooks/useDebounceAutoSave.ts](src/hooks/useDebounceAutoSave.ts)

```typescript
// Used in: Code editor for saving user's solution
{
  localDebounceMs: 500,   // Save to localStorage every 500ms
  cloudDebounceMs: 3000,  // Sync to Firestore every 3s
  onLocalSave: (data) => updateProblemInCache(...),
  onCloudSave: (data) => saveProblemCode(...)
}
```

**Key Features:**
- ⚡ **Instant safety net**: Code saved to localStorage in 500ms
- ☁️ **Cost-efficient cloud sync**: Batches changes, syncs every 3s
- 🔒 **Force-save**: Immediate sync before navigation/sign-out
- 🔄 **Automatic recovery**: Code restored from cache on page reload

#### 2. `useStudyPlanAutoSave` - Study Plan Data
**Location**: [src/hooks/useStudyPlanAutoSave.ts](src/hooks/useStudyPlanAutoSave.ts)

Manages study plan creation, problem details, and metadata:
- **Optimistic plan creation**: Plan available instantly, syncs in background
- **Batch updates**: Multiple changes merged into single API call
- **Problem details caching**: Full problem data stored locally for instant resume

#### 3. `usePlanProgressState` - Progress Tracking
**Location**: [src/hooks/usePlanProgressState.ts](src/hooks/usePlanProgressState.ts)

Handles bookmarks, completion status, and progress:
- **Optimistic UI updates**: Checkboxes respond instantly
- **Debounced sync**: Progress changes batched every 3s
- **Collision-free**: Updates merged intelligently

### Performance Characteristics

| Operation | Before (Firestore-first) | After (Cache-first) | Improvement |
|-----------|-------------------------|---------------------|-------------|
| Resume problem (same session) | 100-500ms | **<5ms** | 20-100x faster |
| Next/Prev navigation | 100-500ms | **<5ms** | 20-100x faster |
| Code auto-save | N/A (on blur) | **500ms** debounce | Continuous |
| Cross-device sync | Manual refresh | **Background** | Seamless |
| First-time load | 200-1000ms | 100-500ms | 2x faster |

### Data Consistency Guarantees

✅ **No data loss**: Dual-layer persistence (localStorage + Firestore)
✅ **Cross-device sync**: Latest changes loaded on session start
✅ **Offline resilience**: Works offline, syncs when online
✅ **Conflict resolution**: Last-write-wins with timestamp tracking

### Key Files

| File | Purpose |
|------|---------|
| [AppRouter.tsx](src/components/AppRouter.tsx) | Central state management, cache-first logic |
| [studyPlanCacheService.ts](src/services/studyPlanCacheService.ts) | localStorage cache layer (CRUD operations) |
| [studyPlanFirestoreService.ts](src/services/studyPlanFirestoreService.ts) | Firestore API integration |
| [useDebounceAutoSave.ts](src/hooks/useDebounceAutoSave.ts) | Code editor auto-save hook |
| [useStudyPlanAutoSave.ts](src/hooks/useStudyPlanAutoSave.ts) | Study plan data auto-save hook |
| [usePlanProgressState.ts](src/hooks/usePlanProgressState.ts) | Progress tracking with optimistic updates |

### State Management Pattern

**Centralized Routing**: All application state is managed in `AppRouter.tsx` (1500+ lines)
- **Props-Down Architecture**: State flows down from AppRouter to child components
- **URL State Management**: Application state preserved in URL parameters for deep linking
- **Cache Integration**: Direct integration with cache services for instant data access

## Design System & v0 Integration

This project is set up to use **v0.dev** for component redesign with shadcn/ui. If you're looking to contribute or redesign components:

### Documentation
- **[REDESIGN_SUMMARY.md](./REDESIGN_SUMMARY.md)** - Complete setup overview and next steps
- **[V0_INTEGRATION_GUIDE.md](./V0_INTEGRATION_GUIDE.md)** - Detailed guide for using v0
- **[V0_QUICK_REFERENCE.md](./V0_QUICK_REFERENCE.md)** - Quick lookup for classes and patterns
- **[DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)** - Full design system specification

### Key Features
- ✅ shadcn/ui components ready to use
- ✅ CSS variables for consistent theming
- ✅ Dark mode support with Tailwind
- ✅ Path aliases configured (@/ imports)
- ✅ Component library (Button, Card, Badge, Dialog)

### Using Components
```tsx
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

// Use with variants
<Button variant="gradient" size="lg">Primary Action</Button>
<Badge variant="success">Completed</Badge>
```

## Developer Notes

### Debugging Cache & Auto-Save

The application uses console logging with emoji prefixes for easy debugging:

```javascript
// Cache operations
💾 [Cache] Loaded plan abc123 from localStorage
💾 [Auto-Save] Saved to localStorage
☁️ [Auto-Save] Saved to Firestore
☁️ [Sync] Updating plan abc123 from Firestore

// Resume flow
💾 [Resume] Checking cache for problem two-sum
✅ [Resume] Loaded from cache with 247 chars of code
☁️ [Resume] Not in cache, checking Firestore for first access
🆕 [Resume] No cached data found, starting fresh from API

// Progress tracking
💾 [Plan Progress] Bookmark toggled locally for two-sum
☁️ [Plan Progress] Syncing 3 updates to Firestore
```

**Enable detailed logging**: Open browser DevTools → Console, filter by emoji or keywords like `[Cache]`, `[Auto-Save]`, `[Resume]`

### Important Implementation Details

1. **Cache Keys Format**
   - Study plans: `algoirl_study_plan_{planId}`
   - Plans index: `algoirl_study_plans_index`
   - Old problem format: `problem_{planId}_{problemId}` (backward compatibility)

2. **Auto-Save Timing**
   - **Local save**: 500ms debounce (data safety)
   - **Cloud sync**: 3000ms debounce (cost efficiency)
   - **Force save**: Immediate (before navigation/sign-out)

3. **Resume Problem Priority**
   ```
   1. Check unified cache (getProblemFromCache) ← Instant
   2. Check old localStorage format            ← Migration path
   3. Check Firestore (first access)           ← Cross-device
   4. Fetch fresh from API (never accessed)    ← Fallback
   ```

4. **Optimistic Updates Pattern**
   - UI updates immediately (Set state)
   - Change queued for sync (pendingUpdates ref)
   - Debounced sync fires (3s delay)
   - Force sync before critical actions

5. **Data Migration**
   - Old localStorage problems are detected and migrated
   - Cache version tracking (`version: 1`)
   - Backward compatibility maintained for smooth transition

### Common Issues & Solutions

**Problem**: Code not saving
- **Check**: Browser console for auto-save logs
- **Verify**: localStorage quota not exceeded (common on mobile)
- **Fix**: Clear old cached plans or use incognito mode

**Problem**: Resume shows old code
- **Cause**: Cache hit with stale data
- **Check**: Look for `💾 [Resume] Loaded from cache` log
- **Fix**: Force refresh (Cmd/Ctrl + Shift + R) to reload from Firestore

**Problem**: Slow navigation between problems
- **Cause**: Firestore call instead of cache hit
- **Check**: Look for `☁️ [Resume]` log (should see `💾 [Resume]` instead)
- **Fix**: Ensure problem was accessed before (should be cached)

**Problem**: Changes not syncing to Firestore
- **Check**: Network tab for PATCH requests to `/api/user/study-plans/{planId}`
- **Verify**: Firebase authentication is active (`auth.currentUser` exists)
- **Fix**: Sign out and sign back in

### Performance Optimization Tips

1. **Preload problems**: When viewing study plan, problems are loaded on-demand, not all at once
2. **Batch operations**: Multiple rapid clicks → Single API call (debouncing)
3. **Cache warming**: Plan data loaded on session start for instant navigation
4. **Lazy loading**: Monaco editor and heavy components use React.lazy()

### Testing Locally

```bash
# Start dev server with API proxy
npm run dev

# Backend should be running on localhost:3000
# Frontend proxies /api/* requests automatically

# Test cache-first behavior:
# 1. Start a problem, write some code
# 2. Open DevTools → Application → Local Storage
# 3. Verify entry exists: algoirl_study_plan_*
# 4. Navigate away and back - should load instantly (<5ms)
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Guidelines

- Follow the cache-first pattern for new features
- Use optimistic updates for better UX
- Add console logging with emoji prefixes for debugging
- Test both online and offline scenarios
- Ensure force-save is called before navigation

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
