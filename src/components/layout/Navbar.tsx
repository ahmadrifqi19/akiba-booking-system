'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { Gamepad2, ShoppingCart, BarChart3, LogOut } from 'lucide-react';
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
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-3 sm:px-6">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#007AFF] text-white shadow-[0_1px_3px_rgba(0,122,255,0.2)] transition-transform group-hover:scale-105">
            <Gamepad2 className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-slate-900 text-base sm:text-lg">
                AKIBA CORE
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 border border-emerald-200/80">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Sync
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-normal">Panel {role === 'owner' ? 'Owner' : 'Kasir'}</span>
          </div>
        </Link>

        {/* Center Navigation Tabs */}
        <nav className="flex items-center gap-1 rounded-xl border border-slate-200/70 bg-slate-100/80 p-1 sm:gap-1.5">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-[#007AFF] text-white shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                )}
              >
                <Icon className={cn('h-4 w-4', isActive ? 'text-white' : 'text-slate-500')} />
                <span className="hidden md:inline">{item.label}</span>
                <span className="md:hidden">{item.label.split(' ')[0]}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {logoutError && <span role="alert" className="hidden text-xs text-rose-600 sm:inline">{logoutError}</span>}
          <div className="hidden flex-col items-end text-right sm:flex">
            <span className="text-xs font-semibold text-slate-800">{role === 'owner' ? 'Owner' : 'Kasir'}</span>
            <span className="text-[10px] text-slate-500">Cabang CBG-01</span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition-colors hover:bg-slate-50 disabled:opacity-60"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>{isLoggingOut ? 'Keluar...' : 'Logout'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
