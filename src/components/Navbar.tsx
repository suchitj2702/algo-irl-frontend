import React, { useState } from 'react';
import { MenuIcon, XIcon, SunIcon, MoonIcon } from 'lucide-react';
import { useDarkMode } from './DarkModeContext';
export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const {
    isDarkMode,
    toggleDarkMode
  } = useDarkMode();
  return <header className="bg-white/80 dark:bg-neutral-850/80 backdrop-blur-sm shadow-subtle sticky top-0 z-10 transition-colors duration-200">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center h-14 px-4 sm:px-6 lg:px-8">
          <div className="flex-shrink-0">
            <span className="text-xl font-medium text-neutral-750 dark:text-white">
              AlgoIRL
            </span>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-750 dark:hover:text-white transition-colors text-sm">
              GitHub
            </a>
            <button onClick={toggleDarkMode} className="p-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-750 dark:hover:text-white transition-colors" aria-label="Toggle dark mode">
              {isDarkMode ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
            </button>
          </div>
          <div className="md:hidden flex items-center">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-750 dark:hover:text-white transition-colors text-sm mr-2">
              GitHub
            </a>
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
          <div className="pt-2 pb-3 space-y-1">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="block px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400" onClick={() => setIsMenuOpen(false)}>
              GitHub
            </a>
          </div>
        </div>}
    </header>;
}