'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api, apiErrorMessage } from '@/lib/api';
import { AuthCard } from '@/components/AuthCard';

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') ?? '');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/verify-email', { email, code });
      router.push('/login?verified=1');
    } catch (err) {
      setError(apiErrorMessage(err, 'Kodni tasdiqlashda xatolik'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard title="Emailni tasdiqlash">
      <form onSubmit={onSubmit} className="space-y-4">
        <input
          required
          type="email"
          placeholder="Email"
          className="w-full rounded-md border px-3 py-2 text-sm"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          required
          placeholder="Tasdiqlash kodi"
          className="w-full rounded-md border px-3 py-2 text-sm"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          disabled={loading}
          className="w-full rounded-md bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? 'Tekshirilmoqda...' : 'Tasdiqlash'}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-500">Kod emailingizga yuborildi, 15 daqiqa amal qiladi.</p>
    </AuthCard>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailForm />
    </Suspense>
  );
}
