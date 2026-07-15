'use client';

import { useState } from 'react';
import { api, apiErrorMessage } from '@/lib/api';
import { AuthCard } from '@/components/AuthCard';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setMessage(data.message);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard title="Parolni tiklash">
      <form onSubmit={onSubmit} className="space-y-4">
        <input
          required
          type="email"
          placeholder="Email"
          className="w-full rounded-md border px-3 py-2 text-sm"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {message && <p className="text-sm text-green-700">{message}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          disabled={loading}
          className="w-full rounded-md bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? 'Yuborilmoqda...' : 'Havola yuborish'}
        </button>
      </form>
    </AuthCard>
  );
}
