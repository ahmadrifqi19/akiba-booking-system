'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { ShoppingCart, BarChart3, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/lib/auth/session';

export default function Navbar({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  const navLinks = [
    {
      href: '/kasir',
      label: 'Kasir POS',
      icon: ShoppingCart,
    },
    {
      href: '/analytics',
      label: 'Analytics',
      icon: BarChart3,
    },
  ].filter((item) => role === 'owner' || item.href !== '/analytics');

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setLogoutError(null);
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (!response.ok) {
        throw new Error('Logout gagal. Silakan coba kembali.');
      }
      router.replace('/login');
      router.refresh();
    } catch (error) {
      setLogoutError(error instanceof Error ? error.message : 'Logout gagal.');
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-sky-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-3 sm:px-6">
        
        {/* Navigation Tabs dipindah ke Pojok Kiri (menggantikan Brand) */}
        <nav className="flex items-center gap-1 rounded-2xl border border-sky-200 bg-sky-100/60 p-1 sm:gap-1.5">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-150',
                  isActive
                    ? 'bg-sky-500 text-white shadow-[0_4px_12px_-4px_rgba(14,165,233,0.7)] font-bold'
                    : 'text-sky-800 hover:text-sky-950 hover:bg-white/80'
                )}
              >
                <Icon className={cn('h-4 w-4', isActive ? 'text-white' : 'text-sky-500')} />
                <span className="hidden md:inline">{item.label}</span>
                <span className="md:hidden">{item.label.split(' ')[0]}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Actions & Logout di Pojok Kanan */}
        <div className="flex items-center gap-2">
          {logoutError && <span role="alert" className="hidden text-xs text-rose-600 sm:inline">{logoutError}</span>}
          <div className="hidden flex-col items-end text-right sm:flex">
            <span className="text-xs font-bold text-sky-950">{role === 'owner' ? 'Owner' : 'Kasir'}</span>
            <span className="text-[10px] font-bold text-sky-500">Cabang CBG-01</span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex items-center gap-1.5 rounded-2xl border border-sky-200 bg-white px-3 py-2 text-xs font-bold text-sky-700 shadow-2xs transition-all hover:bg-sky-50 active:scale-95 disabled:opacity-60"
          >
            <LogOut className="h-3.5 w-3.5 text-sky-500" />
            <span>{isLoggingOut ? 'Keluar...' : 'Logout'}</span>
          </button>
        </div>

      </div>
    </header>
  );
}