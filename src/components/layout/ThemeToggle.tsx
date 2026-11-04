'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from './ThemeProvider';

export default function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { isBlackTheme, toggleTheme } = useTheme();
  const label = isBlackTheme ? 'Tema terang' : 'Tema hitam';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      aria-pressed={isBlackTheme}
      title={label}
      className="flex items-center justify-center gap-1.5 rounded-2xl border border-sky-200 bg-white px-3 py-2 text-xs font-bold text-sky-700 shadow-2xs transition-all hover:bg-sky-50 active:scale-95"
    >
      {isBlackTheme ? <Sun className="h-3.5 w-3.5 text-amber-500" /> : <Moon className="h-3.5 w-3.5 text-sky-500" />}
      {!compact && <span>{label}</span>}
    </button>
  );
}
