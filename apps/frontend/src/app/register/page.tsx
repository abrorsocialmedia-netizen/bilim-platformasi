'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, apiErrorMessage } from '@/lib/api';
import { AuthCard } from '@/components/AuthCard';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/register', form);
      router.push(`/verify-email?email=${encodeURIComponent(form.email)}`);
    } catch (err) {
      setError(apiErrorMessage(err, "Ro'yxatdan o'tishda xatolik"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard title="Ro'yxatdan o'tish">
      <form onSubmit={onSubmit} className="space-y-4">
        <input
          required
          placeholder="To'liq ism"
          className="w-full rounded-md border px-3 py-2 text-sm"
          value={form.fullName}
          onChange={(e) => setForm({ ...form, fullName: e.target.value })}
        />
        <input
          required
          type="email"
          placeholder="Email"
          className="w-full rounded-md border px-3 py-2 text-sm"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          placeholder="Telefon"
          className="w-full rounded-md border px-3 py-2 text-sm"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
        <input
          required
          type="password"
          minLength={6}
          placeholder="Parol"
          className="w-full rounded-md border px-3 py-2 text-sm"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          disabled={loading}
          className="w-full rounded-md bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? 'Yuborilmoqda...' : "Ro'yxatdan o'tish"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-500">
        Akkountingiz bormi?{' '}
        <Link href="/login" className="text-indigo-600 hover:underline">
          Kirish
        </Link>
      </p>
    </AuthCard>
  );
}
