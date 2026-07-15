'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { AppShell } from '@/components/AppShell';

interface EnrollmentDto {
  id: string;
  status: string;
  progressPercent: number;
  expiresAt: string | null;
  user: { id: string; fullName: string; email: string; phone: string | null };
  course: { id: string; title: string };
}

export default function AdminStudentsPage() {
  const [items, setItems] = useState<EnrollmentDto[]>([]);
  const [filter, setFilter] = useState<string>('all');

  function load() {
    api.get('/admin/students').then(({ data }) => setItems(data));
  }

  useEffect(() => {
    load();
  }, []);

  async function approve(id: string) {
    await api.post(`/admin/students/${id}/approve`);
    load();
  }
  async function reject(id: string) {
    await api.post(`/admin/students/${id}/reject`);
    load();
  }
  async function block(id: string) {
    await api.post(`/admin/students/${id}/block`);
    load();
  }
  async function extend(id: string) {
    await api.post(`/admin/students/${id}/extend`, { days: 30 });
    load();
  }

  const filtered = filter === 'all' ? items : items.filter((i) => i.status === filter);

  return (
    <AppShell roles={['admin']}>
      <h1 className="mb-6 text-2xl font-bold">O&apos;quvchilar</h1>

      <div className="mb-4 flex gap-2 text-sm">
        {['all', 'pending', 'active', 'expired', 'blocked', 'rejected'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full px-3 py-1 ${filter === s ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-2">O&apos;quvchi</th>
              <th className="px-4 py-2">Kurs</th>
              <th className="px-4 py-2">Holat</th>
              <th className="px-4 py-2">Progress</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((e) => (
              <tr key={e.id} className="border-t">
                <td className="px-4 py-2">
                  <p className="font-medium">{e.user.fullName}</p>
                  <p className="text-xs text-gray-400">
                    {e.user.email} {e.user.phone ? `· ${e.user.phone}` : ''}
                  </p>
                </td>
                <td className="px-4 py-2">{e.course.title}</td>
                <td className="px-4 py-2">{e.status}</td>
                <td className="px-4 py-2">{e.progressPercent}%</td>
                <td className="space-x-2 px-4 py-2 text-right text-xs">
                  {e.status === 'pending' && (
                    <>
                      <button onClick={() => approve(e.id)} className="text-green-600 hover:underline">
                        Tasdiqlash
                      </button>
                      <button onClick={() => reject(e.id)} className="text-red-600 hover:underline">
                        Rad etish
                      </button>
                    </>
                  )}
                  {e.status === 'active' && (
                    <>
                      <button onClick={() => extend(e.id)} className="text-indigo-600 hover:underline">
                        Uzaytirish
                      </button>
                      <button onClick={() => block(e.id)} className="text-red-600 hover:underline">
                        Bloklash
                      </button>
                    </>
                  )}
                  {e.status === 'expired' && (
                    <button onClick={() => extend(e.id)} className="text-indigo-600 hover:underline">
                      Uzaytirish
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
