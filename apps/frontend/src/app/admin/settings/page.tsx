'use client';

import { useEffect, useState } from 'react';
import { api, apiErrorMessage } from '@/lib/api';
import { AppShell } from '@/components/AppShell';

interface ConfigDto {
  brandName: string;
  logoUrl: string | null;
  primaryColor: string;
  domain: string | null;
  telegramBotToken: string | null;
  ownerChatId: string | null;
  featureFlags: Record<string, boolean>;
}

const FEATURE_LABELS: Record<string, string> = {
  aiQa: 'AI savol-javob',
  forum: 'Forum',
  onlinePayments: 'Onlayn to\'lov',
  gamification: 'Geymifikatsiya',
  certificates: 'Sertifikatlar',
};

export default function AdminSettingsPage() {
  const [config, setConfig] = useState<ConfigDto | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/admin/config').then(({ data }) => setConfig(data));
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!config) return;
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await api.put('/admin/config', config);
      setMessage('Sozlamalar saqlandi');
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (!config) {
    return (
      <AppShell roles={['admin']}>
        <p className="text-gray-400">Yuklanmoqda...</p>
      </AppShell>
    );
  }

  return (
    <AppShell roles={['admin']}>
      <h1 className="mb-6 text-2xl font-bold">Sozlamalar</h1>
      <form onSubmit={save} className="max-w-xl space-y-6">
        <div className="rounded-lg border bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-gray-700">Brend</h2>
          <div className="space-y-3">
            <input
              placeholder="Platforma nomi"
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={config.brandName}
              onChange={(e) => setConfig({ ...config, brandName: e.target.value })}
            />
            <input
              placeholder="Logo URL"
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={config.logoUrl ?? ''}
              onChange={(e) => setConfig({ ...config, logoUrl: e.target.value })}
            />
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={config.primaryColor}
                onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
              />
              <span className="text-sm text-gray-500">Asosiy rang</span>
            </div>
            <input
              placeholder="Domen"
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={config.domain ?? ''}
              onChange={(e) => setConfig({ ...config, domain: e.target.value })}
            />
          </div>
        </div>

        <div className="rounded-lg border bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-gray-700">Telegram bot</h2>
          <div className="space-y-3">
            <input
              placeholder="Bot token"
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={config.telegramBotToken ?? ''}
              onChange={(e) => setConfig({ ...config, telegramBotToken: e.target.value })}
            />
            <input
              placeholder="Egasi chat ID"
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={config.ownerChatId ?? ''}
              onChange={(e) => setConfig({ ...config, ownerChatId: e.target.value })}
            />
          </div>
        </div>

        <div className="rounded-lg border bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-gray-700">Modullar (feature flags)</h2>
          <div className="space-y-2">
            {Object.entries(FEATURE_LABELS).map(([key, label]) => (
              <label key={key} className="flex items-center justify-between text-sm">
                {label}
                <input
                  type="checkbox"
                  checked={Boolean(config.featureFlags[key])}
                  onChange={(e) =>
                    setConfig({ ...config, featureFlags: { ...config.featureFlags, [key]: e.target.checked } })
                  }
                />
              </label>
            ))}
          </div>
        </div>

        {message && <p className="text-sm text-green-700">{message}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          disabled={saving}
          className="rounded-md bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? 'Saqlanmoqda...' : 'Saqlash'}
        </button>
      </form>
    </AppShell>
  );
}
