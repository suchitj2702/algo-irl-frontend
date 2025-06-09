import { ArrowRightIcon, Code2, Users, Zap, Shield, Target, Sparkles } from 'lucide-react';
import React, { useState, useEffect } from 'react';

interface IntroSectionProps {
  onStartClick: () => void;
}

export function IntroSection({ onStartClick }: IntroSectionProps) {
  const currentYear = new Date().getFullYear();
  const [typedText, setTypedText] = useState('');
  const [companyIndex, setCompanyIndex] = useState(0);
  const companies = ['Netflix', 'Google', 'Amazon', 'Meta', 'Apple', 'Microsoft', 'Spotify', 'Uber', 'OpenAI', 'Stripe', 'Figma', 'Notion', 'Discord', 'Airbnb', 'Tesla', 'Shopify', 'Canva', 'ByteDance', 'Coinbase', 'Databricks'];
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCompanyIndex((prev) => (prev + 1) % companies.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes glow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
        
        @keyframes pulse-ring {
          0% {
            transform: scale(0.95);
            opacity: 1;
          }
          70% {
            transform: scale(1.3);
            opacity: 0;
          }
          100% {
            transform: scale(1.3);
            opacity: 0;
          }
        }
        
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        @keyframes bubble-float {
          0%, 100% { transform: translateY(0px) rotate(-3deg); }
          50% { transform: translateY(-20px) rotate(3deg); }
        }
        
        @keyframes slide-up {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .animate-float { animation: float 8s ease-in-out infinite; }
        .animate-gradient { 
          background-size: 200% 200%;
          animation: gradient-x 5s ease infinite;
        }
        .animate-bubble { animation: bubble-float 10s ease-in-out infinite; }
        .animate-slide-up { animation: slide-up 0.6s ease-out forwards; }
        
        .glass-effect {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .light .glass-effect {
          background: rgba(255, 255, 255, 0.7);
          border: 1px solid rgba(0, 0, 0, 0.1);
        }
        
        .card-hover {
          transition: all 0.3s ease;
        }
        
        .card-hover:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        }
        
        .dark .card-hover:hover {
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }
        
        .pulse-ring {
          animation: pulse-ring 2s cubic-bezier(0.455, 0.03, 0.515, 0.955) infinite;
        }
        
        .text-gradient {
          background: linear-gradient(135deg, #10b981 0%, #14b8a6 50%, #06b6d4 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>
      
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-white relative overflow-hidden transition-colors duration-300">
        {/* Premium Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-50 to-emerald-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-emerald-950/20"></div>
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl"></div>
          </div>
        </div>

        {/* Floating Code Bubbles */}
        <div className="absolute top-32 left-16 hidden lg:block animate-bubble opacity-60" style={{ animationDelay: '0s' }}>
          <div className="glass-effect rounded-xl p-3 shadow-xl">
            <code className="text-xs text-emerald-600 dark:text-emerald-400 font-mono">findOptimalRoute()</code>
          </div>
        </div>
        <div className="absolute top-48 right-24 hidden lg:block animate-bubble opacity-60" style={{ animationDelay: '2s' }}>
          <div className="glass-effect rounded-xl p-3 shadow-xl">
            <code className="text-xs text-teal-600 dark:text-teal-400 font-mono">balanceWorkload()</code>
          </div>
        </div>
        <div className="absolute bottom-32 left-32 hidden lg:block animate-bubble opacity-60" style={{ animationDelay: '4s' }}>
          <div className="glass-effect rounded-xl p-3 shadow-xl">
            <code className="text-xs text-cyan-600 dark:text-cyan-400 font-mono">matchUsers()</code>
          </div>
        </div>

        {/* Hero Section */}
        <div className="relative flex items-center justify-center min-h-screen px-6 py-20">
          <div className="text-center max-w-5xl mx-auto">
            <div className="mb-8">
              <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 mb-6">
                <Sparkles className="w-4 h-4 mr-2" />
                Transform Your Interview Prep
              </span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 dark:text-white mb-8">
              Algorithms{' '}
              <span className="text-gradient">In Real Life</span>
        </h1>
            
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-4 max-w-3xl mx-auto">
              Practice coding problems in the context of{' '}
              <span className="font-semibold text-gray-900 dark:text-white transition-all duration-300">
                {companies[companyIndex]}
              </span>
            </p>
            
            <p className="text-lg text-gray-500 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
              Stop memorizing. Start understanding how algorithms solve real problems at top tech companies.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button 
                onClick={onStartClick} 
                className="group relative inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white overflow-hidden rounded-xl transition-all duration-300 hover:scale-105"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="relative flex items-center">
                  Start Practicing Free
                  <ArrowRightIcon className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </span>
                <div className="absolute top-0 right-0 -mt-1 -mr-1">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                  </span>
                </div>
              </button>
              <a 
                href="#demo" 
                className="px-8 py-4 text-base font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white glass-effect rounded-xl transition-all duration-300 hover:scale-105"
              >
                See Demo
              </a>
            </div>
            
            {/* Trust Indicators */}
            <div className="mt-16 flex items-center justify-center gap-8 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>100% Private</span>
              </div>
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4" />
                <span>75 Problems</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                <span>Instant Setup</span>
              </div>
            </div>
          </div>
        </div>

        {/* Who It's For Section */}
        <div className="relative py-24 px-6 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Built for both sides of the interview
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                Whether you're preparing for interviews or conducting them, AlgoIRL transforms the experience
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-12">
              {/* For Candidates */}
              <div className="relative">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg h-full">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center text-white mr-4">
                      <Target className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">For Candidates</h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Master algorithms by understanding their real world applications. Build confidence by solving problems in the context of actual products you use daily.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <span className="w-5 h-5 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 mr-3">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                      </span>
                      <span className="text-gray-700 dark:text-gray-300">Practice with problems from any company</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-5 h-5 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 mr-3">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                      </span>
                      <span className="text-gray-700 dark:text-gray-300">Learn the "why" behind each algorithm</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-5 h-5 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 mr-3">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                      </span>
                      <span className="text-gray-700 dark:text-gray-300">Connect technical skills to real business impact</span>
                    </li>
                  </ul>
                </div>
              </div>
              
              {/* For Companies */}
              <div className="relative">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg h-full">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-teal-500 rounded-xl flex items-center justify-center text-white mr-4">
                      <Users className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">For Companies</h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Create engaging interview problems that reflect your actual engineering challenges. Assess candidates on problems relevant to your product and tech stack.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <span className="w-5 h-5 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 mr-3">
                        <span className="w-2 h-2 bg-teal-500 rounded-full"></span>
                      </span>
                      <span className="text-gray-700 dark:text-gray-300">Generate problems based on your products</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-5 h-5 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 mr-3">
                        <span className="w-2 h-2 bg-teal-500 rounded-full"></span>
                      </span>
                      <span className="text-gray-700 dark:text-gray-300">Test real engineering thinking</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-5 h-5 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 mr-3">
                        <span className="w-2 h-2 bg-teal-500 rounded-full"></span>
                      </span>
                      <span className="text-gray-700 dark:text-gray-300">Make interviews more engaging</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Demo Section */}
        <div id="demo" className="relative py-24 px-6 bg-white dark:bg-gray-900/50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                See the magic in action
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                Watch how we transform a boring algorithm into an engaging real-world problem
              </p>
            </div>
            
            <div className="grid lg:grid-cols-2 gap-8 items-start">
              {/* Before */}
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
                <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 flex items-center">
                      <span className="text-2xl mr-3">😴</span> Traditional LeetCode
                    </h3>
                    <span className="px-3 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                      Boring
                    </span>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 font-mono text-sm">
                    <div className="text-gray-500 dark:text-gray-500 mb-4">// Problem: LRU Cache</div>
                    <div className="text-gray-700 dark:text-gray-300">
                      Design a data structure that follows the constraints of a Least Recently Used (LRU) cache with get and put operations.
                    </div>
                  </div>
                  <div className="mt-6 space-y-2">
                    <div className="flex items-center text-sm text-gray-500">
                      <span className="w-2 h-2 bg-red-400 rounded-full mr-2"></span>
                      No context or motivation
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <span className="w-2 h-2 bg-red-400 rounded-full mr-2"></span>
                      Easy to forget
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <span className="w-2 h-2 bg-red-400 rounded-full mr-2"></span>
                      Disconnected from real work
                    </div>
                  </div>
                </div>
              </div>

              {/* After */}
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
                <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-emerald-700 dark:text-emerald-400 flex items-center">
                      <span className="text-2xl mr-3">🚀</span> AlgoIRL Version
                    </h3>
                    <span className="px-3 py-1 text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full">
                      Engaging
                    </span>
                  </div>
                  <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-xl p-6 font-mono text-sm">
                    <div className="text-emerald-600 dark:text-emerald-400 mb-4">// Instagram: Story Viewer Tracking</div>
                    <div className="text-gray-700 dark:text-gray-300">
                      You're optimizing Instagram Stories. With millions of users viewing stories, you need to track who viewed each story while keeping memory usage minimal. Design a system that shows the most recent viewers first, automatically removes old viewer data when hitting memory limits, and handles celebrity accounts with 50M+ views efficiently.
                    </div>
                  </div>
                  <div className="mt-6 space-y-2">
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <span className="w-2 h-2 bg-emerald-400 rounded-full mr-2"></span>
                      Real product context
                    </div>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <span className="w-2 h-2 bg-emerald-400 rounded-full mr-2"></span>
                      Memorable story
                    </div>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <span className="w-2 h-2 bg-emerald-400 rounded-full mr-2"></span>
                      Interview ready framing
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works - Enhanced */}
        <div className="relative py-24 px-6 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Your journey to mastery
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                Three simple steps to transform your interview preparation
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-2xl blur opacity-0 group-hover:opacity-20 transition duration-300"></div>
                <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg card-hover">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center mb-6 text-white">
                    <Target className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">1. Choose Your Path</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Select from the Blind 75 problems or pick any company, from FAANG to your dream startup.
                  </p>
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                      ∞ Companies Available
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-2xl blur opacity-0 group-hover:opacity-20 transition duration-300"></div>
                <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg card-hover">
                  <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-2xl flex items-center justify-center mb-6 text-white">
                    <Code2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">2. Code with Context</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Solve algorithms framed as real engineering challenges you'd face on the job.
                  </p>
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-teal-600 dark:text-teal-400 font-medium">
                      Real time code execution
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-2xl blur opacity-0 group-hover:opacity-20 transition duration-300"></div>
                <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg card-hover">
                  <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center mb-6 text-white">
                    <Zap className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">3. Ace Interviews</h3>
                                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Walk in prepared, having already solved similar challenges in familiar contexts.
                    </p>
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-cyan-600 dark:text-cyan-400 font-medium">
                      Recognition breeds confidence
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Showcase */}
        <div className="relative py-24 px-6 bg-white dark:bg-gray-900/50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Everything you need to succeed
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                A complete platform designed for modern interview preparation
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Feature cards */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 rounded-2xl p-8 border border-emerald-200 dark:border-emerald-800">
                <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center mb-4 text-white">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  AI Powered Scenarios
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Our AI generates unique, company specific problem contexts that mirror real engineering challenges.
                </p>
              </div>

              <div className="bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950/20 dark:to-cyan-950/20 rounded-2xl p-8 border border-teal-200 dark:border-teal-800">
                <div className="w-12 h-12 bg-teal-500 rounded-xl flex items-center justify-center mb-4 text-white">
                  <Code2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Built in Code Editor
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Write, test, and debug your solutions with our powerful in browser development environment.
                </p>
              </div>

              <div className="bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950/20 dark:to-blue-950/20 rounded-2xl p-8 border border-cyan-200 dark:border-cyan-800">
                <div className="w-12 h-12 bg-cyan-500 rounded-xl flex items-center justify-center mb-4 text-white">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Company Collection
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Practice with problems styled after any company, from tech giants to innovative startups.
                </p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-2xl p-8 border border-purple-200 dark:border-purple-800">
                <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mb-4 text-white">
                  <Target className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Blind 75 Coverage
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Master all essential patterns with our curated collection of must know problems.
                </p>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 rounded-2xl p-8 border border-orange-200 dark:border-orange-800">
                <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center mb-4 text-white">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Instant Feedback
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Get immediate test results and understand your solution's performance in real time.
                </p>
              </div>

              <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-8 border border-gray-200 dark:border-gray-600">
                <div className="w-12 h-12 bg-gray-600 rounded-xl flex items-center justify-center mb-4 text-white">
                  <Shield className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Complete Privacy
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  All data stays in your browser. No accounts, no tracking, just pure learning.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="relative py-16 px-6 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">75</div>
                <p className="text-gray-600 dark:text-gray-400">Essential Problems</p>
              </div>
              <div>
                <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">∞</div>
                <p className="text-gray-600 dark:text-gray-400">Companies</p>
              </div>
              <div>
                <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">100%</div>
                <p className="text-gray-600 dark:text-gray-400">Private</p>
              </div>
              <div>
                <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">0</div>
                <p className="text-gray-600 dark:text-gray-400">Setup Time</p>
              </div>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="relative py-24 px-6 text-center bg-gradient-to-b from-gray-100 to-white dark:from-gray-800 dark:to-gray-900">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-6">
              Ready to transform your interview prep?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-12">
              Join the new generation of engineers who understand the "why" behind every algorithm.
            </p>
            <button 
              onClick={onStartClick} 
              className="group relative inline-flex items-center justify-center px-12 py-5 text-lg font-semibold text-white overflow-hidden rounded-2xl transition-all duration-300 hover:scale-105 shadow-2xl"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative flex items-center">
                Start Your Journey
                <ArrowRightIcon className="ml-3 h-6 w-6 transition-transform group-hover:translate-x-2" />
          </span>
        </button>
            <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
              No credit card required • Start practicing in seconds
            </p>
          </div>
          <footer className="mt-24 pt-8 border-t border-gray-200 dark:border-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              &copy; {currentYear} AlgoIRL. All rights reserved.
            </p>
          </footer>
        </div>
      </div>
    </>
  );
}