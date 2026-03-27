import { useEffect } from 'react';

type Theme = 'light' | 'dark';

export function useTheme() {
  // Permanently locked to dark mode
  const theme: Theme = 'dark';

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light');
    root.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  }, []);

  const setTheme = () => {
    // Theme switching disabled - always dark mode
    console.log('Dark mode is permanently enabled');
  };

  return { theme, setTheme };
}
