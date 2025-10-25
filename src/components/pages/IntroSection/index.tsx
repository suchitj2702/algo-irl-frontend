import { ArrowRightIcon, Code2, Users, Zap, Shield, Target, Calendar, SunIcon, MoonIcon } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useDarkMode } from '../../DarkModeContext';

interface IntroSectionProps {
 onStartClick: () => void;
}

export function IntroSection({ onStartClick }: IntroSectionProps) {
 const currentYear = new Date().getFullYear();
 const [typedText, setTypedText] = useState('');
 const [companyIndex, setCompanyIndex] = useState(0);
 const companies = ['Netflix', 'Google', 'Amazon', 'Meta', 'Apple', 'Microsoft', 'Spotify', 'Uber', 'OpenAI', 'Stripe', 'Figma', 'Notion', 'Discord', 'Airbnb', 'Tesla', 'Shopify', 'Canva', 'ByteDance', 'Coinbase', 'Databricks'];
 const { isDarkMode, toggleDarkMode } = useDarkMode();

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
     background: linear-gradient(135deg, #80a1ba 0%, #91c4c3 50%, #b4debd 100%);
     -webkit-background-clip: text;
     -webkit-text-fill-color: transparent;
     background-clip: text;
    }
   `}</style>
   
   <div className="min-h-screen bg-surface dark:bg-surface text-content relative overflow-hidden transition-colors duration-300">
    {/* Dark Mode Toggle */}
    <button
     onClick={toggleDarkMode}
     className="fixed top-6 right-6 z-50 p-3 rounded-[14px] bg-white/80 dark:bg-accent/12 hover:bg-mint-light /16 backdrop-blur-2xl border border-slate/30 dark:border-accent/20 shadow-[0_1px_2px_rgba(153,166,178,0.1),0_1px_25px_rgba(248,250,252,0.7)_inset] dark:shadow-[0_1px_2px_rgba(0,0,0,0.3),0_1px_25px_rgba(200,216,255,0.12)_inset] hover:shadow-[0_1px_3px_rgba(188,204,220,0.2),0_2px_35px_rgba(248,250,252,0.9)_inset] dark:hover:shadow-[0_1px_3px_rgba(0,0,0,0.4),0_2px_35px_rgba(255,255,255,0.18)_inset] active:scale-[0.95] transition-all duration-200 text-content"
     aria-label="Toggle dark mode"
    >
     {isDarkMode ? <SunIcon className="h-6 w-6" /> : <MoonIcon className="h-6 w-6" />}
    </button>

    {/* Premium Background */}
    <div className="absolute inset-0">
     <div className="absolute inset-0 bg-gradient-to-br from-cream via-cream-light to-mint-light/20 dark:from-gray-900 dark:via-gray-900 dark:to-emerald-950/20"></div>
     <div className="absolute top-0 left-0 w-full h-full">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-mint/15 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal/15 rounded-full blur-3xl"></div>
     </div>
    </div>

    {/* Floating Code Bubbles */}
    <div className="absolute top-32 left-16 hidden lg:block animate-bubble opacity-60" style={{ animationDelay: '0s' }}>
     <div className="glass-effect rounded-xl p-3 shadow-xl">
      <code className="text-xs text-mint-dark dark:text-emerald-400 font-mono">findOptimalRoute()</code>
     </div>
    </div>
    <div className="absolute top-48 right-24 hidden lg:block animate-bubble opacity-60" style={{ animationDelay: '2s' }}>
     <div className="glass-effect rounded-xl p-3 shadow-xl">
      <code className="text-xs text-teal-dark dark:text-teal-400 font-mono">balanceWorkload()</code>
     </div>
    </div>
    <div className="absolute bottom-32 left-32 hidden lg:block animate-bubble opacity-60" style={{ animationDelay: '4s' }}>
     <div className="glass-effect rounded-xl p-3 shadow-xl">
      <code className="text-xs text-content font-mono">matchUsers()</code>
     </div>
    </div>

    {/* Hero Section */}
    <div className="relative flex items-center justify-center min-h-screen px-6 py-20">
     <div className="text-center max-w-5xl mx-auto">
      <div className="mb-8">
       <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-mint-light dark:bg-emerald-900/30 text-mint-dark dark:text-emerald-300 mb-6">
        Transform Your Interview Prep
       </span>
      </div>
      
      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-content mb-8">
       <span className="text-gradient font-playfair">AlgoIRL</span>
    </h1>

      <p className="text-lg sm:text-xl text-content-muted dark:text-content-subtle mb-4 max-w-3xl mx-auto">
       Practice coding problems in the context of{' '}
       <span className="font-semibold text-content transition-all duration-300">
        {companies[companyIndex]}
       </span>
      </p>

      <p className="text-lg text-content-muted/80 dark:text-content-subtle mb-12 max-w-2xl mx-auto">
       Stop memorizing. Start understanding how algorithms solve real problems at top tech companies.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
       <button
        onClick={onStartClick}
        className="group relative inline-flex items-center justify-center px-10 py-4 text-[17px] font-medium text-button-foreground overflow-hidden rounded-[16px] transition-all duration-200 active:scale-[0.98] backdrop-blur-xl border border-button-700 bg-button-600 hover:bg-button-500 shadow-[0_1px_2px_rgba(63,74,88,0.3),0_1px_20px_rgba(248,250,252,0.4)_inset] dark:shadow-[0_1px_2px_rgba(0,0,0,0.15),0_1px_20px_rgba(0,0,0,0.4)_inset]"
       >
        <span className="relative flex items-center gap-2">
         Start Practicing Free
         <ArrowRightIcon className="h-5 w-5 transition-transform group-hover:translate-x-1" />
        </span>
        <div className="absolute top-2 right-2">
         <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white/90 dark:bg-gray-900/90 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-white dark:bg-gray-900"></span>
         </span>
        </div>
       </button>
       <a
        href="#demo"
        className="inline-flex items-center justify-center px-10 py-4 text-[17px] font-medium text-content bg-cream/70 dark:bg-accent/12 hover:bg-cream/90 /16 backdrop-blur-2xl border border-slate/30 dark:border-accent/20 rounded-[16px] transition-all duration-200 active:scale-[0.98] shadow-[0_1px_2px_rgba(153,166,178,0.1),0_1px_25px_rgba(248,250,252,0.7)_inset] dark:shadow-[0_1px_2px_rgba(0,0,0,0.3),0_1px_25px_rgba(200,216,255,0.12)_inset] hover:shadow-[0_1px_3px_rgba(153,166,178,0.15),0_2px_35px_rgba(248,250,252,0.9)_inset] dark:hover:shadow-[0_1px_3px_rgba(0,0,0,0.4),0_2px_35px_rgba(255,255,255,0.18)_inset]"
       >
        See Demo
       </a>
      </div>
      
      {/* Trust Indicators */}
      <div className="mt-16 flex items-center justify-center gap-8 text-sm text-content-muted dark:text-content-subtle">
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
    <div className="relative py-24 px-6 bg-gradient-to-b from-cream to-cream-light dark:from-gray-900 dark:to-gray-800">
     <div className="max-w-6xl mx-auto">
      <div className="text-center mb-16">
       <h2 className="text-3xl sm:text-4xl font-bold text-content mb-4 font-playfair">
        Built for both sides of the interview
       </h2>
       <p className="text-xl text-content-muted dark:text-content-subtle max-w-3xl mx-auto">
        Whether you're preparing for interviews or conducting them, AlgoIRL transforms the experience
       </p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-12">
       {/* For Candidates */}
       <div className="relative">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg h-full">
         <div className="flex items-center mb-6">
          <div className="w-12 h-12 bg-mint rounded-xl flex items-center justify-center text-button-foreground mr-4">
           <Target className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-content font-playfair">For Candidates</h3>
         </div>
         <p className="text-content-muted dark:text-content-subtle mb-6">
          Master algorithms by understanding their real world applications. Build confidence by solving problems in the context of actual products you use daily.
         </p>
         <ul className="space-y-3">
          <li className="flex items-start">
           <span className="w-5 h-5 bg-mint-light dark:bg-emerald-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 mr-3">
            <span className="w-2 h-2 bg-mint rounded-full"></span>
           </span>
           <span className="text-content">Practice with problems from any company</span>
          </li>
          <li className="flex items-start">
           <span className="w-5 h-5 bg-mint-light dark:bg-emerald-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 mr-3">
            <span className="w-2 h-2 bg-mint rounded-full"></span>
           </span>
           <span className="text-content">Learn the "why" behind each algorithm</span>
          </li>
          <li className="flex items-start">
           <span className="w-5 h-5 bg-mint-light dark:bg-emerald-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 mr-3">
            <span className="w-2 h-2 bg-mint rounded-full"></span>
           </span>
           <span className="text-content">Connect technical skills to real business impact</span>
          </li>
         </ul>
        </div>
       </div>
       
       {/* For Companies */}
       <div className="relative">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg h-full">
         <div className="flex items-center mb-6">
          <div className="w-12 h-12 bg-teal rounded-xl flex items-center justify-center text-button-foreground mr-4">
           <Users className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-content font-playfair">For Companies</h3>
         </div>
         <p className="text-content-muted dark:text-content-subtle mb-6">
          Create engaging interview problems that reflect your actual engineering challenges. Assess candidates on problems relevant to your product and tech stack.
         </p>
         <ul className="space-y-3">
          <li className="flex items-start">
           <span className="w-5 h-5 bg-mint-light dark:bg-teal-dark/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 mr-3">
            <span className="w-2 h-2 bg-teal rounded-full"></span>
           </span>
           <span className="text-content">Generate problems based on your products</span>
          </li>
          <li className="flex items-start">
           <span className="w-5 h-5 bg-mint-light dark:bg-teal-dark/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 mr-3">
            <span className="w-2 h-2 bg-teal rounded-full"></span>
           </span>
           <span className="text-content">Test real engineering thinking</span>
          </li>
          <li className="flex items-start">
           <span className="w-5 h-5 bg-mint-light dark:bg-teal-dark/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 mr-3">
            <span className="w-2 h-2 bg-teal rounded-full"></span>
           </span>
           <span className="text-content">Make interviews more engaging</span>
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
       <h2 className="text-3xl sm:text-4xl font-bold text-content mb-4 font-playfair">
        See the magic in action
       </h2>
       <p className="text-xl text-content-muted dark:text-content-subtle max-w-3xl mx-auto">
        Watch how we transform a boring algorithm into an engaging real-world problem
       </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 items-start">
       {/* Before */}
       <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-slate-light to-slate dark:from-slate-dark dark:to-slate rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
        <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl">
         <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-content-muted dark:text-content-subtle flex items-center">
           <span className="text-2xl mr-3">😴</span> Traditional LeetCode
          </h3>
          <span className="px-3 py-1 text-xs font-medium bg-cream-light dark:bg-gray-700 text-content-muted dark:text-content-subtle rounded-full">
           Boring
          </span>
         </div>
         <div className="bg-cream-light dark:bg-gray-900 rounded-xl p-6 font-mono text-sm">
          <div className="text-content-muted/70 dark:text-content-subtle mb-4">// Problem: LRU Cache</div>
          <div className="text-content">
           Design a data structure that follows the constraints of a Least Recently Used (LRU) cache with get and put operations.
          </div>
         </div>
         <div className="mt-6 space-y-2">
          <div className="flex items-center text-sm text-content-muted/70">
           <span className="w-2 h-2 bg-red-400 rounded-full mr-2"></span>
           No context or motivation
          </div>
          <div className="flex items-center text-sm text-content-muted/70">
           <span className="w-2 h-2 bg-red-400 rounded-full mr-2"></span>
           Easy to forget
          </div>
          <div className="flex items-center text-sm text-content-muted/70">
           <span className="w-2 h-2 bg-red-400 rounded-full mr-2"></span>
           Disconnected from real work
          </div>
         </div>
        </div>
       </div>

       {/* After */}
       <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-mint to-slate rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
        <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl">
         <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-mint-dark dark:text-mint-light flex items-center">
           <span className="text-2xl mr-3">🚀</span> AlgoIRL Version
          </h3>
          <span className="px-3 py-1 text-xs font-medium bg-mint-light dark:bg-mint-dark/30 text-mint-dark dark:text-mint-light rounded-full">
           Engaging
          </span>
         </div>
         <div className="bg-mint-light/50 dark:bg-mint-dark/20 rounded-xl p-6 font-mono text-sm">
          <div className="text-mint-dark dark:text-mint-light mb-4">// Instagram: Story Viewer Tracking</div>
          <div className="text-content">
           You're optimizing Instagram Stories. With millions of users viewing stories, you need to track who viewed each story while keeping memory usage minimal. Design a system that shows the most recent viewers first, automatically removes old viewer data when hitting memory limits, and handles celebrity accounts with 50M+ views efficiently.
          </div>
         </div>
         <div className="mt-6 space-y-2">
          <div className="flex items-center text-sm text-content-muted dark:text-content-subtle">
           <span className="w-2 h-2 bg-mint rounded-full mr-2"></span>
           Real product context
          </div>
          <div className="flex items-center text-sm text-content-muted dark:text-content-subtle">
           <span className="w-2 h-2 bg-mint rounded-full mr-2"></span>
           Memorable story
          </div>
          <div className="flex items-center text-sm text-content-muted dark:text-content-subtle">
           <span className="w-2 h-2 bg-mint rounded-full mr-2"></span>
           Interview ready framing
          </div>
         </div>
        </div>
       </div>
      </div>
     </div>
    </div>

    {/* How It Works - Enhanced */}
    <div className="relative py-24 px-6 bg-cream-light dark:bg-gray-900">
     <div className="max-w-6xl mx-auto">
      <div className="text-center mb-16">
       <h2 className="text-3xl sm:text-4xl font-bold text-content mb-4 font-playfair">
        Your journey to mastery
       </h2>
       <p className="text-xl text-content-muted dark:text-content-subtle max-w-3xl mx-auto">
        Three simple steps to transform your interview preparation
       </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
       <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-mint to-slate rounded-2xl blur opacity-0 group-hover:opacity-20 transition duration-300"></div>
        <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg card-hover">
         <div className="w-16 h-16 bg-gradient-to-br from-mint to-slate rounded-2xl flex items-center justify-center mb-6 text-button-foreground">
          <Target className="w-8 h-8" />
         </div>
         <h3 className="text-xl font-bold text-content mb-4 font-playfair">1. Choose Your Path</h3>
         <p className="text-content-muted dark:text-content-subtle mb-4">
          Select from the Blind 75 problems or pick any company, from FAANG to your dream startup.
         </p>
         <div className="pt-4 border-t border-slate-light dark:border-gray-700">
          <p className="text-sm text-mint-dark dark:text-mint-light font-medium">
           ∞ Companies Available
          </p>
         </div>
        </div>
       </div>

       <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-slate to-navy rounded-2xl blur opacity-0 group-hover:opacity-20 transition duration-300"></div>
        <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg card-hover">
         <div className="w-16 h-16 bg-gradient-to-br from-slate to-navy rounded-2xl flex items-center justify-center mb-6 text-button-foreground">
          <Code2 className="w-8 h-8" />
         </div>
         <h3 className="text-xl font-bold text-content mb-4 font-playfair">2. Code with Context</h3>
         <p className="text-content-muted dark:text-content-subtle mb-4">
          Solve algorithms framed as real engineering challenges you'd face on the job.
         </p>
         <div className="pt-4 border-t border-slate-light dark:border-gray-700">
          <p className="text-sm text-teal-dark dark:text-teal-light font-medium">
           Real time code execution
          </p>
         </div>
        </div>
       </div>

       <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-navy to-mint rounded-2xl blur opacity-0 group-hover:opacity-20 transition duration-300"></div>
        <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg card-hover">
         <div className="w-16 h-16 bg-gradient-to-br from-navy to-mint rounded-2xl flex items-center justify-center mb-6 text-button-foreground">
          <Zap className="w-8 h-8" />
         </div>
         <h3 className="text-xl font-bold text-content mb-4 font-playfair">3. Ace Interviews</h3>
                   <p className="text-content-muted dark:text-content-subtle mb-4">
           Walk in prepared, having already solved similar challenges in familiar contexts.
          </p>
         <div className="pt-4 border-t border-slate-light dark:border-gray-700">
          <p className="text-sm text-content font-medium">
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
       <h2 className="text-3xl sm:text-4xl font-bold text-content mb-4 font-playfair">
        Everything you need to succeed
       </h2>
       <p className="text-xl text-content-muted dark:text-content-subtle max-w-3xl mx-auto">
        A complete platform designed for modern interview preparation
       </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
       {/* Feature cards */}
       <div className="bg-gradient-to-br from-sage-light to-teal-light dark:from-sage-dark/20 dark:to-mint-dark/20 rounded-2xl p-8 border border-sage-light dark:border-sage-dark">
        <h3 className="text-lg font-semibold text-content mb-2 font-playfair">
         AI Powered Scenarios
        </h3>
        <p className="text-content-muted dark:text-content-subtle">
         Our AI generates unique, company specific problem contexts that mirror real engineering challenges.
        </p>
       </div>

       <div className="bg-gradient-to-br from-teal-light to-slate-light dark:from-mint-dark/20 dark:to-slate-dark/20 rounded-2xl p-8 border border-mint-light dark:border-mint-dark">
        <div className="w-12 h-12 bg-teal rounded-xl flex items-center justify-center mb-4 text-button-foreground">
         <Code2 className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-semibold text-content mb-2 font-playfair">
         Built in Code Editor
        </h3>
        <p className="text-content-muted dark:text-content-subtle">
         Write, test, and debug your solutions with our powerful in browser development environment.
        </p>
       </div>

       <div className="bg-gradient-to-br from-slate-light to-mint-light dark:from-slate-dark/20 dark:to-sage-dark/20 rounded-2xl p-8 border border-slate-light dark:border-slate-dark">
        <div className="w-12 h-12 bg-slate rounded-xl flex items-center justify-center mb-4 text-button-foreground">
         <Users className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-semibold text-content mb-2 font-playfair">
         Company Collection
        </h3>
        <p className="text-content-muted dark:text-content-subtle">
         Practice with problems styled after any company, from tech giants to innovative startups.
        </p>
       </div>

       <div className="bg-gradient-to-br from-sage-light to-teal-light dark:from-sage-dark/20 dark:to-mint-dark/20 rounded-2xl p-8 border border-sage-light dark:border-sage-dark">
        <div className="w-12 h-12 bg-mint rounded-xl flex items-center justify-center mb-4 text-button-foreground">
         <Target className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-semibold text-content mb-2 font-playfair">
         Blind 75 Coverage
        </h3>
        <p className="text-content-muted dark:text-content-subtle">
         Master all essential patterns with our curated collection of must know problems.
        </p>
       </div>

       <div className="bg-gradient-to-br from-teal-light to-slate-light dark:from-mint-dark/20 dark:to-slate-dark/20 rounded-2xl p-8 border border-mint-light dark:border-mint-dark">
        <div className="w-12 h-12 bg-teal rounded-xl flex items-center justify-center mb-4 text-button-foreground">
         <Zap className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-semibold text-content mb-2 font-playfair">
         Instant Feedback
        </h3>
        <p className="text-content-muted dark:text-content-subtle">
         Get immediate test results and understand your solution's performance in real time.
        </p>
       </div>

       <div className="bg-gradient-to-br from-slate-light to-mint-light dark:from-slate-dark/20 dark:to-sage-dark/20 rounded-2xl p-8 border border-slate-light dark:border-slate-dark">
        <div className="w-12 h-12 bg-slate rounded-xl flex items-center justify-center mb-4 text-button-foreground">
         <Calendar className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-semibold text-content mb-2 font-playfair">
         Personalized Study Plans
        </h3>
        <p className="text-content-muted dark:text-content-subtle">
         AI powered schedules tailored to your target company, role, and timeline with prioritized problems.
        </p>
       </div>

       <div className="bg-gradient-to-br from-cream-light to-cream dark:from-gray-800 dark:to-gray-700 rounded-2xl p-8 border border-slate-light dark:border-gray-600">
        <div className="w-12 h-12 bg-slate rounded-xl flex items-center justify-center mb-4 text-button-foreground">
         <Shield className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-semibold text-content mb-2 font-playfair">
         Complete Privacy
        </h3>
        <p className="text-content-muted dark:text-content-subtle">
         All data stays in your browser. No accounts, no tracking, just pure learning.
        </p>
       </div>
      </div>
     </div>
    </div>

    {/* Stats Section */}
    <div className="relative py-16 px-6 bg-cream-light dark:bg-gray-900">
     <div className="max-w-5xl mx-auto">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
       <div>
        <div className="text-4xl font-bold text-content mb-2">75</div>
        <p className="text-content-muted dark:text-content-subtle">Essential Problems</p>
       </div>
       <div>
        <div className="text-4xl font-bold text-content mb-2">∞</div>
        <p className="text-content-muted dark:text-content-subtle">Companies</p>
       </div>
       <div>
        <div className="text-4xl font-bold text-content mb-2">100%</div>
        <p className="text-content-muted dark:text-content-subtle">Private</p>
       </div>
       <div>
        <div className="text-4xl font-bold text-content mb-2">0</div>
        <p className="text-content-muted dark:text-content-subtle">Setup Time</p>
       </div>
      </div>
     </div>
    </div>

    {/* Final CTA */}
    <div className="relative py-24 px-6 text-center bg-gradient-to-b from-cream-light to-cream dark:from-gray-800 dark:to-gray-900">
     <div className="max-w-3xl mx-auto">
      <h2 className="text-3xl sm:text-4xl font-bold text-content mb-6 font-playfair">
       Ready to transform your interview prep?
      </h2>
      <p className="text-xl text-content-muted dark:text-content-subtle mb-12">
       Join the new generation of engineers who understand the "why" behind every algorithm.
      </p>
      <button
       onClick={onStartClick}
       className="group relative inline-flex items-center justify-center px-12 py-5 text-[19px] font-medium text-button-foreground overflow-hidden rounded-[18px] transition-all duration-200 active:scale-[0.98] backdrop-blur-xl border border-button-700 bg-button-600 hover:bg-button-500 shadow-[0_1px_2px_rgba(63,74,88,0.3),0_1px_20px_rgba(248,250,252,0.4)_inset] dark:shadow-[0_1px_2px_rgba(0,0,0,0.15),0_1px_20px_rgba(0,0,0,0.4)_inset]"
      >
       <span className="relative flex items-center gap-3">
        Start Your Journey
        <ArrowRightIcon className="h-6 w-6 transition-transform group-hover:translate-x-2" />
     </span>
    </button>
      <p className="mt-6 text-sm text-content-muted/70 dark:text-content-subtle">
       No credit card required • Start practicing in seconds
      </p>
     </div>
     <footer className="mt-24 pt-8 border-t border-slate-light dark:border-gray-800">
      <p className="text-sm text-content-muted/70 dark:text-content-subtle">
       &copy; {currentYear} <span className="font-playfair">AlgoIRL</span>. All rights reserved.
      </p>
     </footer>
    </div>
   </div>
  </>
 );
}
