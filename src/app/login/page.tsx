'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound } from 'lucide-react';
import Image from "next/image";
import type { UserRole } from '@/lib/auth/session';

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<UserRole>('kasir');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, pin }),
      });
      const result: { error?: string; role?: UserRole } = await response.json();

      if (!response.ok || !result.role) {
        setError(result.error || 'Login gagal. Silakan coba kembali.');
        return;
      }

      router.replace(result.role === 'owner' ? '/analytics' : '/kasir');
      router.refresh();
    } catch {
      setError('Tidak dapat menghubungi server. Periksa koneksi lalu coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="flex flex-1 items-center justify-center bg-linear-to-b from-sky-50/40 to-white p-4 min-h-screen">
      <div className="w-full max-w-sm rounded-3xl border border-sky-100 bg-white p-6 sm:p-8 shadow-[0_12px_40px_-20px_rgba(14,165,233,0.35)]">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center">
            <Image
              src="/akibacore.png"
              alt="Akiba Core Logo"
              width={80}
              height={80}
              className="h-full w-full object-contain"
              priority
            />
          </div>
          <h1 className="text-xl font-bold text-sky-950 tracking-tight">Login Akiba Core</h1>
          <p className="mt-1 text-xs text-sky-600/80">Masuk ke panel operasional sistem</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="login-role" className="mb-1.5 block text-xs font-bold text-sky-950">
              Role Akses
            </label>
            <select
              id="login-role"
              value={role}
              onChange={(event) => setRole(event.target.value as UserRole)}
              className="w-full rounded-2xl border border-sky-200 bg-white px-3.5 py-2.5 text-xs font-medium text-sky-950 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 shadow-2xs"
            >
              <option value="kasir">Kasir</option>
              <option value="owner">Owner</option>
            </select>
          </div>

          <div>
            <label htmlFor="login-pin" className="mb-1.5 block text-xs font-bold text-sky-950">
              PIN / Password
            </label>
            <input
              id="login-pin"
              type="password"
              autoComplete="current-password"
              value={pin}
              onChange={(event) => setPin(event.target.value)}
              className="w-full rounded-2xl border border-sky-200 bg-white px-3.5 py-2.5 text-xs font-medium text-sky-950 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 shadow-2xs"
              required
            />
          </div>

          {error && (
            <p role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-500 px-4 py-3 text-xs font-bold text-white shadow-[0_6px_20px_-6px_rgba(14,165,233,0.7)] hover:bg-sky-600 transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <KeyRound className="h-4 w-4" />
            {isSubmitting ? 'Memeriksa...' : 'Login'}
          </button>
        </form>
      </div>
    </section>
  );
}