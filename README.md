# AlgoIRL - Algorithms In Real Life

Transform LeetCode problems into real-world scenarios from top tech companies. Practice algorithms in the context of actual products you use daily.

## Features

- 🎯 **Company-Specific Context**: Solve problems framed as real features from Google, Meta, Netflix, and more
- 💡 **Blind 75 Progress Tracking**: Master the most important interview problems with progress tracking
- 🚀 **Instant Code Execution**: Run your solutions against test cases without leaving the browser
- 🌓 **Dark Mode**: Easy on the eyes during those late-night practice sessions
- 📱 **Responsive Design**: Practice on any device

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui with Radix UI primitives
- **Code Editor**: Monaco Editor (VS Code's editor)
- **State Management**: React Hooks + Context
- **Build Tool**: Vite
- **Code Execution**: Judge0 API
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

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
