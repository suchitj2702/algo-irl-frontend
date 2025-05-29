import React, { useState } from 'react';
import { MenuIcon, XIcon, SunIcon, MoonIcon, TrendingUpIcon } from 'lucide-react';
import { useDarkMode } from './DarkModeContext';

interface NavbarProps {
  onProgressClick?: () => void;
  onHomeClick?: () => void;
}

export function Navbar({ onProgressClick, onHomeClick }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const {
    isDarkMode,
    toggleDarkMode
  } = useDarkMode();

  const handleProgressClick = () => {
    if (onProgressClick) {
      onProgressClick();
    }
    setIsMenuOpen(false);
  };

  const handleHomeClick = () => {
    if (onHomeClick) {
      onHomeClick();
    }
    setIsMenuOpen(false);
  };

  return <header className="bg-white/80 dark:bg-neutral-850/80 backdrop-blur-lg shadow-subtle sticky top-0 z-10 transition-colors duration-200">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          <div className="flex-shrink-0">
            <button 
              onClick={handleHomeClick}
              className="text-xl font-medium text-neutral-750 dark:text-white hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
            >
              AlgoIRL
            </button>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <button 
              onClick={handleProgressClick}
              className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-750 dark:hover:text-white transition-colors text-sm flex items-center gap-1"
            >
              <TrendingUpIcon className="h-4 w-4" />
              Progress
            </button>
            <button onClick={toggleDarkMode} className="p-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-750 dark:hover:text-white transition-colors" aria-label="Toggle dark mode">
              {isDarkMode ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
            </button>
          </div>
          <div className="md:hidden flex items-center">
            <button 
              onClick={handleProgressClick}
              className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-750 dark:hover:text-white transition-colors text-sm mr-2 p-2"
              aria-label="Progress"
            >
              <TrendingUpIcon className="h-5 w-5" />
            </button>
            <button onClick={toggleDarkMode} className="p-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-750 dark:hover:text-white transition-colors mr-2" aria-label="Toggle dark mode">
              {isDarkMode ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
            </button>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} type="button" className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500">
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? <XIcon className="block h-6 w-6" aria-hidden="true" /> : <MenuIcon className="block h-6 w-6" aria-hidden="true" />}
            </button>
          </div>
        </div>
      </div>
      {isMenuOpen && <div className="md:hidden">
          <div className="pt-2 pb-3 space-y-1 px-4 sm:px-6 lg:px-8">
            <button 
              onClick={handleProgressClick}
              className="block text-neutral-600 dark:text-neutral-400 hover:text-neutral-750 dark:hover:text-white transition-colors text-sm py-2 flex items-center gap-2"
            >
              <TrendingUpIcon className="h-4 w-4" />
              Progress
            </button>
          </div>
        </div>}
    </header>;
}