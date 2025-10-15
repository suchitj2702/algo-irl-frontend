import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MenuIcon, XIcon, SunIcon, MoonIcon, TrendingUpIcon, Calendar, LogIn, User, LogOut, ChevronDown } from 'lucide-react';
import { useDarkMode } from './DarkModeContext';
import { useAuth } from '../contexts/AuthContext';
import { AuthModal } from './auth/AuthModal';

interface NavbarProps {
 onHomeClick?: () => void;
 onBlind75Click?: () => void;
 onStudyPlansClick?: () => void;
 onBeforeSignOut?: () => Promise<void>;
}

export function Navbar({ onHomeClick, onBlind75Click, onStudyPlansClick, onBeforeSignOut }: NavbarProps) {
 const [isMenuOpen, setIsMenuOpen] = useState(false);
 const [showAuthModal, setShowAuthModal] = useState(false);
 const [showProfileDropdown, setShowProfileDropdown] = useState(false);
 const navigate = useNavigate();
 const location = useLocation();
 const {
  isDarkMode,
  toggleDarkMode
 } = useDarkMode();
 const { user, signOut, loading } = useAuth();

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

 const handleSignOut = async () => {
  setShowProfileDropdown(false);
  setIsMenuOpen(false);

  try {
   // 1. Force sync BEFORE signing out
   if (onBeforeSignOut) {
    console.log('🔄 [Navbar] Calling pre-signout sync...');
    await onBeforeSignOut();
   }

   // 2. Now sign out
   await signOut();

   // 3. Redirect from study plan routes
   const redirectRoutes = [
    '/my-study-plans',
    '/study-plan-view',
    '/study-plan-form',
    '/study-plan-loading',
    '/study-plan/problem'
   ];
   const shouldRedirect = redirectRoutes.some(route => location.pathname.startsWith(route));

   if (shouldRedirect) {
    navigate('/my-study-plans');
   }
  } catch (error) {
   console.error('Sign out error:', error);
  }
 };

 const handleSignInClick = () => {
  setShowAuthModal(true);
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

      {/* Auth Button / User Menu */}
      {!loading && (
       user ? (
        <div className="relative">
         <button
          onClick={() => setShowProfileDropdown(!showProfileDropdown)}
          className="inline-flex items-center gap-2 px-4 py-2 text-[15px] font-medium text-content bg-white/90 dark:bg-white/10 hover:bg-mint-light /15 backdrop-blur-xl border border-slate/30 rounded-[14px] transition-all duration-200 active:scale-[0.98] shadow-[0_1px_2px_rgba(153,166,178,0.1),0_1px_20px_rgba(248,250,252,0.6)_inset] dark:shadow-[0_1px_2px_rgba(0,0,0,0.3),0_1px_20px_rgba(255,255,255,0.1)_inset] hover:shadow-[0_1px_3px_rgba(188,204,220,0.3),0_2px_30px_rgba(248,250,252,0.8)_inset] dark:hover:shadow-[0_1px_3px_rgba(0,0,0,0.4),0_2px_30px_rgba(255,255,255,0.15)_inset]"
         >
          <User className="h-4 w-4" />
          <span className="max-w-[150px] truncate">{user.email || 'Account'}</span>
          <ChevronDown className="h-4 w-4" />
         </button>

         {showProfileDropdown && (
          <>
           {/* Backdrop to close dropdown */}
           <div
            className="fixed inset-0 z-10"
            onClick={() => setShowProfileDropdown(false)}
           />

           {/* Dropdown menu */}
           <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-panel-500 rounded-xl shadow-xl border border-panel-200 dark:border-panel-400 overflow-hidden z-20">
            <div className="px-4 py-3 border-b border-panel-200 dark:border-panel-400">
             <p className="text-sm font-medium text-content">{user.displayName || 'User'}</p>
             <p className="text-xs text-content-muted truncate">{user.email}</p>
            </div>
            <button
             onClick={handleSignOut}
             className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
             <LogOut className="h-4 w-4" />
             Sign Out
            </button>
           </div>
          </>
         )}
        </div>
       ) : (
        <button
         onClick={handleSignInClick}
         className="inline-flex items-center gap-2 px-4 py-2 text-[15px] font-medium text-white bg-mint-600 hover:bg-mint-700 backdrop-blur-xl border border-mint-700 rounded-[14px] transition-all duration-200 active:scale-[0.98] shadow-[0_1px_2px_rgba(16,185,129,0.3),0_1px_20px_rgba(16,185,129,0.2)_inset] hover:shadow-[0_1px_3px_rgba(16,185,129,0.4),0_2px_30px_rgba(16,185,129,0.3)_inset]"
        >
         <LogIn className="h-4 w-4" />
         Sign In
        </button>
       )
      )}
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

      {/* Mobile Auth */}
      {!loading && (
       user ? (
        <>
         <div className="flex items-center gap-2 px-4 py-2.5 text-[15px] text-content bg-white/90 dark:bg-white/10 border border-slate/30 rounded-[14px]">
          <User className="h-4 w-4" />
          <div className="flex-1 min-w-0">
           <p className="text-sm font-medium truncate">{user.displayName || 'User'}</p>
           <p className="text-xs text-content-muted truncate">{user.email}</p>
          </div>
         </div>
         <button
          onClick={handleSignOut}
          className="flex items-center gap-2 w-full px-4 py-2.5 text-[15px] font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-[14px] transition-all duration-200 active:scale-[0.98]"
         >
          <LogOut className="h-4 w-4" />
          Sign Out
         </button>
        </>
       ) : (
        <button
         onClick={handleSignInClick}
         className="flex items-center gap-2 w-full px-4 py-2.5 text-[15px] font-medium text-white bg-mint-600 hover:bg-mint-700 border border-mint-700 rounded-[14px] transition-all duration-200 active:scale-[0.98] shadow-[0_1px_2px_rgba(16,185,129,0.3),0_1px_20px_rgba(16,185,129,0.2)_inset]"
        >
         <LogIn className="h-4 w-4" />
         Sign In
        </button>
       )
      )}
     </div>
    </div>}
   <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
  </header>;
}
