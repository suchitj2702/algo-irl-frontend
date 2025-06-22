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
- **Code Editor**: Monaco Editor (VS Code's editor)
- **State Management**: React Hooks + Context
- **Build Tool**: Vite
- **Code Execution**: Judge0 API

## Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/algo-irl-frontend.git

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

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
