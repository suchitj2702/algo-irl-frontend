import React, { useState } from 'react';
import { MenuIcon, XIcon, SunIcon, MoonIcon, TrendingUpIcon, Calendar } from 'lucide-react';
import { useDarkMode } from './DarkModeContext';

interface NavbarProps {
 onHomeClick?: () => void;
 onBlind75Click?: () => void;
 onStudyPlansClick?: () => void;
}

export function Navbar({ onHomeClick, onBlind75Click, onStudyPlansClick }: NavbarProps) {
 const [isMenuOpen, setIsMenuOpen] = useState(false);
 const {
  isDarkMode,
  toggleDarkMode
 } = useDarkMode();

 const handleHomeClick = () => {
  if (onHomeClick) {
   onHomeClick();
  }
  setIsMenuOpen(false);
 };

 const handleBlind75Click = () => {
  if (onBlind75Click) {
   onBlind75Click();
  }
  setIsMenuOpen(false);
 };

 const handleStudyPlansClick = () => {
  if (onStudyPlansClick) {
   onStudyPlansClick();
  }
  setIsMenuOpen(false);
 };

 return <header className="bg-surface/90 dark:bg-surface-elevated/80 backdrop-blur-lg shadow-subtle sticky top-0 z-10 transition-colors duration-200 border-b border-outline-subtle/40">
   <div className="mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex justify-between items-center h-14">
     <div className="flex-shrink-0">
      <button
       onClick={handleHomeClick}
       className="text-xl font-medium text-content hover:text-content-muted dark:hover:text-neutral-200 transition-colors font-playfair"
      >
       AlgoIRL
      </button>
     </div>
     <div className="hidden md:flex items-center space-x-2">
      <button
       onClick={handleStudyPlansClick}
       className="inline-flex items-center gap-1.5 px-4 py-2 text-[15px] font-medium text-content bg-white/90 dark:bg-white/10 hover:bg-mint-light /15 backdrop-blur-xl border border-slate/30 rounded-[14px] transition-all duration-200 active:scale-[0.98] shadow-[0_1px_2px_rgba(153,166,178,0.1),0_1px_20px_rgba(248,250,252,0.6)_inset] dark:shadow-[0_1px_2px_rgba(0,0,0,0.3),0_1px_20px_rgba(255,255,255,0.1)_inset] hover:shadow-[0_1px_3px_rgba(188,204,220,0.3),0_2px_30px_rgba(248,250,252,0.8)_inset] dark:hover:shadow-[0_1px_3px_rgba(0,0,0,0.4),0_2px_30px_rgba(255,255,255,0.15)_inset]"
      >
       <Calendar className="h-4 w-4" />
       My Study Plans
      </button>
      <button
       onClick={handleBlind75Click}
       className="inline-flex items-center gap-1.5 px-4 py-2 text-[15px] font-medium text-content bg-white/90 dark:bg-white/10 hover:bg-mint-light /15 backdrop-blur-xl border border-slate/30 rounded-[14px] transition-all duration-200 active:scale-[0.98] shadow-[0_1px_2px_rgba(153,166,178,0.1),0_1px_20px_rgba(248,250,252,0.6)_inset] dark:shadow-[0_1px_2px_rgba(0,0,0,0.3),0_1px_20px_rgba(255,255,255,0.1)_inset] hover:shadow-[0_1px_3px_rgba(188,204,220,0.3),0_2px_30px_rgba(248,250,252,0.8)_inset] dark:hover:shadow-[0_1px_3px_rgba(0,0,0,0.4),0_2px_30px_rgba(255,255,255,0.15)_inset]"
      >
       <TrendingUpIcon className="h-4 w-4" />
       Blind75 Progress
      </button>
      <button
       onClick={toggleDarkMode}
       className="p-2.5 text-content bg-white/90 dark:bg-white/10 hover:bg-mint-light /15 backdrop-blur-xl border border-slate/30 rounded-[14px] transition-all duration-200 active:scale-[0.95] shadow-[0_1px_2px_rgba(153,166,178,0.1),0_1px_20px_rgba(248,250,252,0.6)_inset] dark:shadow-[0_1px_2px_rgba(0,0,0,0.3),0_1px_20px_rgba(255,255,255,0.1)_inset] hover:shadow-[0_1px_3px_rgba(188,204,220,0.3),0_2px_30px_rgba(248,250,252,0.8)_inset] dark:hover:shadow-[0_1px_3px_rgba(0,0,0,0.4),0_2px_30px_rgba(255,255,255,0.15)_inset]"
       aria-label="Toggle dark mode"
      >
       {isDarkMode ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
      </button>
     </div>
     <div className="md:hidden flex items-center gap-2">
      <button
       onClick={handleBlind75Click}
       className="p-2 text-content bg-white/90 dark:bg-white/10 hover:bg-mint-light /15 backdrop-blur-xl border border-slate/30 rounded-[12px] transition-all duration-200 active:scale-[0.95] shadow-[0_1px_2px_rgba(153,166,178,0.1),0_1px_20px_rgba(248,250,252,0.6)_inset] dark:shadow-[0_1px_2px_rgba(0,0,0,0.3),0_1px_20px_rgba(255,255,255,0.1)_inset]"
       aria-label="Blind75 Progress"
      >
       <TrendingUpIcon className="h-5 w-5" />
      </button>
      <button
       onClick={toggleDarkMode}
       className="p-2 text-content bg-white/90 dark:bg-white/10 hover:bg-mint-light /15 backdrop-blur-xl border border-slate/30 rounded-[12px] transition-all duration-200 active:scale-[0.95] shadow-[0_1px_2px_rgba(153,166,178,0.1),0_1px_20px_rgba(248,250,252,0.6)_inset] dark:shadow-[0_1px_2px_rgba(0,0,0,0.3),0_1px_20px_rgba(255,255,255,0.1)_inset]"
       aria-label="Toggle dark mode"
      >
       {isDarkMode ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
      </button>
      <button
       onClick={() => setIsMenuOpen(!isMenuOpen)}
       type="button"
       className="p-2 text-content bg-white/90 dark:bg-white/10 hover:bg-mint-light /15 backdrop-blur-xl border border-slate/30 rounded-[12px] transition-all duration-200 active:scale-[0.95] shadow-[0_1px_2px_rgba(153,166,178,0.1),0_1px_20px_rgba(248,250,252,0.6)_inset] dark:shadow-[0_1px_2px_rgba(0,0,0,0.3),0_1px_20px_rgba(255,255,255,0.1)_inset]"
      >
       <span className="sr-only">Open main menu</span>
       {isMenuOpen ? <XIcon className="block h-6 w-6" aria-hidden="true" /> : <MenuIcon className="block h-6 w-6" aria-hidden="true" />}
      </button>
     </div>
    </div>
   </div>
   {isMenuOpen && <div className="md:hidden bg-surface/95 dark:bg-surface-elevated/95 border-t border-outline-subtle/40">
     <div className="pt-2 pb-3 space-y-2 px-4 sm:px-6 lg:px-8">
      <button
       onClick={handleStudyPlansClick}
       className="flex items-center gap-2 w-full px-4 py-2.5 text-[15px] font-medium text-content bg-white/90 dark:bg-white/10 hover:bg-mint-light /15 backdrop-blur-xl border border-slate/30 rounded-[14px] transition-all duration-200 active:scale-[0.98] shadow-[0_1px_2px_rgba(153,166,178,0.1),0_1px_20px_rgba(248,250,252,0.6)_inset] dark:shadow-[0_1px_2px_rgba(0,0,0,0.3),0_1px_20px_rgba(255,255,255,0.1)_inset]"
      >
       <Calendar className="h-4 w-4" />
       My Study Plans
      </button>
      <button
       onClick={handleBlind75Click}
       className="flex items-center gap-2 w-full px-4 py-2.5 text-[15px] font-medium text-content bg-white/90 dark:bg-white/10 hover:bg-mint-light /15 backdrop-blur-xl border border-slate/30 rounded-[14px] transition-all duration-200 active:scale-[0.98] shadow-[0_1px_2px_rgba(153,166,178,0.1),0_1px_20px_rgba(248,250,252,0.6)_inset] dark:shadow-[0_1px_2px_rgba(0,0,0,0.3),0_1px_20px_rgba(255,255,255,0.1)_inset]"
      >
       <TrendingUpIcon className="h-4 w-4" />
       Blind75 Progress
      </button>
     </div>
    </div>}
  </header>;
}
