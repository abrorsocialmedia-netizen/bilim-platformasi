'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api, apiErrorMessage } from '@/lib/api';
import { AuthCard } from '@/components/AuthCard';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token] = useState(searchParams.get('token') ?? '');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, newPassword });
      router.push('/login');
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard title="Yangi parol">
      <form onSubmit={onSubmit} className="space-y-4">
        <input
          required
          type="password"
          minLength={6}
          placeholder="Yangi parol"
          className="w-full rounded-md border px-3 py-2 text-sm"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          disabled={loading}
          className="w-full rounded-md bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "O'zgartirilmoqda..." : "Parolni o'zgartirish"}
        </button>
      </form>
    </AuthCard>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
