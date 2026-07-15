'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { AppShell } from '@/components/AppShell';

interface NotificationDto {
  id: string;
  type: string;
  text: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationDto[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    api
      .get('/me/notifications')
      .then(({ data }) => setItems(data))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function markAllRead() {
    await api.patch('/me/notifications/read-all');
    load();
  }

  return (
    <AppShell roles={['student', 'teacher']}>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Bildirishnomalar</h1>
        <button onClick={markAllRead} className="text-sm text-indigo-600 hover:underline">
          Barchasini o&apos;qilgan deb belgilash
        </button>
      </div>
      {loading ? (
        <p className="text-gray-400">Yuklanmoqda...</p>
      ) : items.length === 0 ? (
        <p className="text-gray-500">Bildirishnomalar yo&apos;q.</p>
      ) : (
        <div className="space-y-2">
          {items.map((n) => (
            <div key={n.id} className={`rounded-md border p-4 text-sm ${n.isRead ? 'bg-white' : 'bg-indigo-50'}`}>
              <p>{n.text}</p>
              <p className="mt-1 text-xs text-gray-400">{new Date(n.createdAt).toLocaleString('uz-UZ')}</p>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
