import { useEffect, useState, createContext, useContext } from 'react';
type DarkModeContextType = {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
};
const DarkModeContext = createContext<DarkModeContextType | undefined>(undefined);
export function DarkModeProvider({
  children
}: {
  children: React.ReactNode;
}) {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode ? JSON.parse(savedMode) : false;
  });
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };
  return <DarkModeContext.Provider value={{
    isDarkMode,
    toggleDarkMode
  }}>
      {children}
    </DarkModeContext.Provider>;
}
export function useDarkMode() {
  const context = useContext(DarkModeContext);
  if (context === undefined) {
    throw new Error('useDarkMode must be used within a DarkModeProvider');
  }
  return context;
}