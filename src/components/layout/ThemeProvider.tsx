'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

type ThemeContextValue = {
  isBlackTheme: boolean;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isBlackTheme, setIsBlackTheme] = useState(false);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem('akiba-theme');
    const shouldUseBlackTheme = savedTheme === 'black';
    document.documentElement.dataset.theme = shouldUseBlackTheme ? 'black' : 'light';
    const frame = requestAnimationFrame(() => setIsBlackTheme(shouldUseBlackTheme));
    return () => cancelAnimationFrame(frame);
  }, []);

  const value = useMemo(
    () => ({
      isBlackTheme,
      toggleTheme: () => {
        const nextIsBlackTheme = !isBlackTheme;
        document.documentElement.dataset.theme = nextIsBlackTheme ? 'black' : 'light';
        window.localStorage.setItem('akiba-theme', nextIsBlackTheme ? 'black' : 'light');
        setIsBlackTheme(nextIsBlackTheme);
      },
    }),
    [isBlackTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const theme = useContext(ThemeContext);
  if (!theme) {
    throw new Error('useTheme harus digunakan di dalam ThemeProvider.');
  }
  return theme;
}
