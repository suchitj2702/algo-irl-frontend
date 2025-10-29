import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MenuIcon, XIcon, SunIcon, MoonIcon, User, ChevronDown } from 'lucide-react';
import { useDarkMode } from './DarkModeContext';
import { useAuth } from '../contexts/AuthContext';
import { useAuthDialog } from '../contexts/AuthDialogContext';

interface NavbarProps {
 onHomeClick?: () => void;
 onBlind75Click?: () => void;
 onStudyPlansClick?: () => void;
 onBeforeSignOut?: () => Promise<void>;
 hideLogo?: boolean;
}

export function Navbar({ onHomeClick, onBlind75Click, onStudyPlansClick, onBeforeSignOut, hideLogo }: NavbarProps) {
 const [isMenuOpen, setIsMenuOpen] = useState(false);
 const [showProfileDropdown, setShowProfileDropdown] = useState(false);
 const navigate = useNavigate();
 const location = useLocation();
 const {
  isDarkMode,
  toggleDarkMode
 } = useDarkMode();
 const { user, signOut, loading } = useAuth();
 const { openAuthDialog, navSignInHidden } = useAuthDialog();

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
  openAuthDialog({
   intent: 'navbar',
   title: 'Sign in to access your study plans',
   description: 'Save study plans, sync your progress, and access premium prep tools across every device.'
  });
  setIsMenuOpen(false);
 };

 return <header className="bg-white/40 dark:bg-gray-900/30 backdrop-blur-xl backdrop-saturate-150 shadow-sm sticky top-0 z-50 transition-all duration-200 border-b border-white/20 dark:border-gray-800/30">
   <div className="mx-auto px-4 lg:px-6">
    <div className="flex justify-between items-center h-14">
     {!hideLogo && (
      <div className="flex-shrink-0">
       <button
        onClick={handleHomeClick}
        className="text-xl font-medium text-content hover:text-content-muted dark:hover:text-neutral-200 transition-colors font-playfair"
       >
        AlgoIRL
       </button>
      </div>
     )}
     {hideLogo && <div className="flex-shrink-0"></div>}
     <div className="hidden md:flex items-center space-x-2">
      <button
       onClick={handleStudyPlansClick}
       className="inline-flex items-center gap-1.5 px-4 py-2 text-[15px] font-medium text-content bg-white/50 dark:bg-white/10 hover:bg-white/70 dark:hover:bg-white/20 border border-gray-200/50 dark:border-gray-700/50 rounded-[14px] transition-all duration-200 active:scale-[0.98] backdrop-blur-sm"
      >
       Study Plans
      </button>
      <button
       onClick={handleBlind75Click}
       className="inline-flex items-center px-4 py-2 text-[15px] font-medium text-content bg-white/50 dark:bg-white/10 hover:bg-white/70 dark:hover:bg-white/20 border border-gray-200/50 dark:border-gray-700/50 rounded-[14px] transition-all duration-200 active:scale-[0.98] backdrop-blur-sm"
      >
       Practice Blind 75
      </button>
      <button
       onClick={toggleDarkMode}
       className="p-2.5 text-content bg-white/50 dark:bg-white/10 hover:bg-white/70 dark:hover:bg-white/20 border border-gray-200/50 dark:border-gray-700/50 rounded-[14px] transition-all duration-200 active:scale-[0.95] backdrop-blur-sm"
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
          className="inline-flex items-center gap-2 px-4 py-2 text-[15px] font-medium text-content bg-white/50 dark:bg-white/10 hover:bg-white/70 dark:hover:bg-white/20 border border-gray-200/50 dark:border-gray-700/50 rounded-[14px] transition-all duration-200 active:scale-[0.98] backdrop-blur-sm"
         >
          <User className="h-4 w-4" />
          <span className="max-w-[150px] truncate">{user.displayName || user.email || 'Account'}</span>
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
           <div className="absolute right-0 mt-2 w-64 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden z-20">
            <div className="px-4 py-3 border-b border-outline-subtle">
             <p className="text-sm font-medium text-content">{user.displayName || 'User'}</p>
             <p className="text-xs text-content-muted truncate">{user.email}</p>
            </div>
            <button
             onClick={handleSignOut}
             className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
             Sign Out
            </button>
           </div>
          </>
         )}
        </div>
       ) : (
        !navSignInHidden && (
         <button
          onClick={handleSignInClick}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-[15px] font-medium text-content bg-white/50 dark:bg-white/10 hover:bg-white/70 dark:hover:bg-white/20 border border-gray-200/50 dark:border-gray-700/50 rounded-[14px] transition-all duration-200 active:scale-[0.98] backdrop-blur-sm"
         >
          Sign In
         </button>
        )
       )
      )}
     </div>
     <div className="md:hidden flex items-center gap-2">
      <button
       onClick={toggleDarkMode}
       className="p-2 text-content bg-white/50 dark:bg-white/10 hover:bg-white/70 dark:hover:bg-white/20 border border-gray-200/50 dark:border-gray-700/50 rounded-[12px] transition-all duration-200 active:scale-[0.95] backdrop-blur-sm"
       aria-label="Toggle dark mode"
      >
       {isDarkMode ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
      </button>
      <button
       onClick={() => setIsMenuOpen(!isMenuOpen)}
       type="button"
       className="p-2 text-content bg-white/50 dark:bg-white/10 hover:bg-white/70 dark:hover:bg-white/20 border border-gray-200/50 dark:border-gray-700/50 rounded-[12px] transition-all duration-200 active:scale-[0.95] backdrop-blur-sm"
      >
       <span className="sr-only">Open main menu</span>
       {isMenuOpen ? <XIcon className="block h-6 w-6" aria-hidden="true" /> : <MenuIcon className="block h-6 w-6" aria-hidden="true" />}
      </button>
     </div>
    </div>
   </div>
   {isMenuOpen && <div className="md:hidden bg-white/95 dark:bg-gray-900/90 backdrop-blur-xl border-t border-white/20 dark:border-gray-800/30">
     <div className="pt-2 pb-3 space-y-2 px-4 lg:px-6">
      <button
       onClick={handleStudyPlansClick}
       className="flex items-center gap-2 w-full px-4 py-2.5 text-[15px] font-medium text-content bg-white/50 dark:bg-white/10 hover:bg-white/70 dark:hover:bg-white/20 border border-gray-200/50 dark:border-gray-700/50 rounded-[14px] transition-all duration-200 active:scale-[0.98] backdrop-blur-sm"
      >
       Study Plans
      </button>
      <button
       onClick={handleBlind75Click}
       className="flex items-center w-full px-4 py-2.5 text-[15px] font-medium text-content bg-white/50 dark:bg-white/10 hover:bg-white/70 dark:hover:bg-white/20 border border-gray-200/50 dark:border-gray-700/50 rounded-[14px] transition-all duration-200 active:scale-[0.98] backdrop-blur-sm"
      >
       Practice Blind 75
      </button>

      {/* Mobile Auth */}
      {!loading && (
       user ? (
        <>
         <div className="flex items-center gap-2 px-4 py-2.5 text-[15px] text-content bg-white/50 dark:bg-white/10 border border-gray-200/50 dark:border-gray-700/50 rounded-[14px] backdrop-blur-sm">
          <User className="h-4 w-4" />
          <div className="flex-1 min-w-0">
           <p className="text-sm font-medium truncate">{user.displayName || 'User'}</p>
           <p className="text-xs text-content-muted truncate">{user.email}</p>
          </div>
         </div>
         <button
          onClick={handleSignOut}
          className="flex items-center gap-2 w-full px-4 py-2.5 text-[15px] font-medium text-red-600 dark:text-red-400 bg-red-50/50 dark:bg-red-900/10 border border-red-200/50 dark:border-red-800/50 rounded-[14px] transition-all duration-200 active:scale-[0.98] backdrop-blur-sm"
         >
          Sign Out
         </button>
        </>
       ) : (
        !navSignInHidden && (
         <button
          onClick={handleSignInClick}
          className="flex items-center gap-2 w-full px-4 py-2.5 text-[15px] font-medium text-content bg-white/50 dark:bg-white/10 hover:bg-white/70 dark:hover:bg-white/20 border border-gray-200/50 dark:border-gray-700/50 rounded-[14px] transition-all duration-200 active:scale-[0.98] backdrop-blur-sm"
         >
          Sign In
         </button>
        )
       )
      )}
     </div>
    </div>}
  </header>;
}
