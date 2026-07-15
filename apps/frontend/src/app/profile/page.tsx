'use client';

import { useEffect, useState } from 'react';
import { api, apiErrorMessage } from '@/lib/api';
import { AppShell } from '@/components/AppShell';

interface MeDto {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: string;
  telegramLinked: boolean;
}

export default function ProfilePage() {
  const [me, setMe] = useState<MeDto | null>(null);
  const [form, setForm] = useState({ fullName: '', phone: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [telegramLink, setTelegramLink] = useState<string | null>(null);

  useEffect(() => {
    api.get('/me').then(({ data }) => {
      setMe(data);
      setForm({ fullName: data.fullName, phone: data.phone ?? '' });
    });
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await api.patch('/me', form);
      setMessage('Profil yangilandi');
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function connectTelegram() {
    const { data } = await api.post('/telegram/link');
    setTelegramLink(data.deepLink ?? `Kod: ${data.code}`);
  }

  return (
    <AppShell roles={['student', 'teacher']}>
      <h1 className="mb-6 text-2xl font-bold">Profil</h1>
      <div className="max-w-lg rounded-lg border bg-white p-6">
        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-gray-500">Email</label>
            <input disabled value={me?.email ?? ''} className="w-full rounded-md border bg-gray-50 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-500">To&apos;liq ism</label>
            <input
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-500">Telefon</label>
            <input
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          {message && <p className="text-sm text-green-700">{message}</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            disabled={saving}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? 'Saqlanmoqda...' : 'Saqlash'}
          </button>
        </form>

        <div className="mt-6 border-t pt-6">
          <h2 className="mb-2 text-sm font-semibold">Telegram</h2>
          {me?.telegramLinked ? (
            <p className="text-sm text-green-600">✓ Telegram ulangan</p>
          ) : telegramLink ? (
            <a href={telegramLink} target="_blank" rel="noreferrer" className="text-sm text-indigo-600 hover:underline">
              {telegramLink}
            </a>
          ) : (
            <button onClick={connectTelegram} className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50">
              Telegramni ulash
            </button>
          )}
        </div>
      </div>
    </AppShell>
  );
}
