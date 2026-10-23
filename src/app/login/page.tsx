'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Gamepad2, KeyRound } from 'lucide-react';
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
    <section className="flex flex-1 items-center justify-center bg-canvas p-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#007AFF] text-white">
            <Gamepad2 className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Login Akiba Core</h1>
          <p className="mt-1 text-sm text-slate-500">Masuk ke panel operasional</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="login-role" className="mb-1.5 block text-sm font-medium text-slate-700">
              Role
            </label>
            <select
              id="login-role"
              value={role}
              onChange={(event) => setRole(event.target.value as UserRole)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20"
            >
              <option value="kasir">Kasir</option>
              <option value="owner">Owner</option>
            </select>
          </div>

          <div>
            <label htmlFor="login-pin" className="mb-1.5 block text-sm font-medium text-slate-700">
              PIN / Password
            </label>
            <input
              id="login-pin"
              type="password"
              autoComplete="current-password"
              value={pin}
              onChange={(event) => setPin(event.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20"
              required
            />
          </div>

          {error && (
            <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#007AFF] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0066CC] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <KeyRound className="h-4 w-4" />
            {isSubmitting ? 'Memeriksa...' : 'Login'}
          </button>
        </form>
      </div>
    </section>
  );
}
