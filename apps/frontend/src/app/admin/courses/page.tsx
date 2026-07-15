'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, apiErrorMessage } from '@/lib/api';
import { AppShell } from '@/components/AppShell';
import type { CourseSummary } from '@/lib/types';

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', durationDays: 120, isFree: true, price: 0, isCertified: false });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function load() {
    api.get('/admin/courses').then(({ data }) => setCourses(data));
  }

  useEffect(() => {
    load();
  }, []);

  async function createCourse(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/admin/courses', form);
      setShowForm(false);
      setForm({ title: '', description: '', durationDays: 120, isFree: true, price: 0, isCertified: false });
      load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell roles={['admin']}>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Kurslar</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700"
        >
          {showForm ? 'Bekor qilish' : '+ Yangi kurs'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={createCourse} className="mb-8 grid gap-3 rounded-lg border bg-white p-4 sm:grid-cols-2">
          <input
            required
            placeholder="Kurs nomi"
            className="rounded-md border px-3 py-2 text-sm sm:col-span-2"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <textarea
            placeholder="Tavsif"
            className="rounded-md border px-3 py-2 text-sm sm:col-span-2"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <label className="flex items-center gap-2 text-sm">
            Muddat (kun):
            <input
              type="number"
              className="w-24 rounded-md border px-2 py-1"
              value={form.durationDays}
              onChange={(e) => setForm({ ...form, durationDays: Number(e.target.value) })}
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isFree}
              onChange={(e) => setForm({ ...form, isFree: e.target.checked })}
            />
            Bepul
          </label>
          {!form.isFree && (
            <label className="flex items-center gap-2 text-sm">
              Narx:
              <input
                type="number"
                className="w-32 rounded-md border px-2 py-1"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
              />
            </label>
          )}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isCertified}
              onChange={(e) => setForm({ ...form, isCertified: e.target.checked })}
            />
            Sertifikatli
          </label>
          {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
          <button
            disabled={saving}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-50 sm:col-span-2"
          >
            {saving ? 'Yaratilmoqda...' : 'Yaratish'}
          </button>
        </form>
      )}

      <div className="overflow-hidden rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-2">Nomi</th>
              <th className="px-4 py-2">Darslar</th>
              <th className="px-4 py-2">Narx</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {courses.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="px-4 py-2 font-medium">{c.title}</td>
                <td className="px-4 py-2">{c.lessonsCount}</td>
                <td className="px-4 py-2">{c.isFree ? 'Bepul' : c.price}</td>
                <td className="px-4 py-2 text-right">
                  <Link href={`/admin/courses/${c.id}`} className="text-indigo-600 hover:underline">
                    Tahrirlash
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
