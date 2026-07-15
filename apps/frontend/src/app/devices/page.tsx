'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { AppShell } from '@/components/AppShell';

interface DeviceDto {
  id: string;
  deviceInfo: string;
  ip: string | null;
  lastActive: string;
}

export default function DevicesPage() {
  const [devices, setDevices] = useState<DeviceDto[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    api
      .get('/auth/sessions')
      .then(({ data }) => setDevices(data))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function revoke(id: string) {
    await api.delete(`/auth/sessions/${id}`);
    load();
  }

  return (
    <AppShell roles={['student', 'teacher']}>
      <h1 className="mb-2 text-2xl font-bold">Qurilmalar</h1>
      <p className="mb-6 text-sm text-gray-500">Bir vaqtning o&apos;zida maksimal 2 ta qurilmadan foydalanishingiz mumkin.</p>
      {loading ? (
        <p className="text-gray-400">Yuklanmoqda...</p>
      ) : (
        <div className="space-y-2">
          {devices.map((d) => (
            <div key={d.id} className="flex items-center justify-between rounded-md border bg-white p-4">
              <div>
                <p className="text-sm font-medium">{d.deviceInfo}</p>
                <p className="text-xs text-gray-400">Faol: {new Date(d.lastActive).toLocaleString('uz-UZ')}</p>
              </div>
              <button onClick={() => revoke(d.id)} className="text-sm text-red-600 hover:underline">
                Chiqarish
              </button>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
