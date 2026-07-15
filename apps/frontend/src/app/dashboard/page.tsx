'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { AppShell } from '@/components/AppShell';
import { useAuthStore } from '@/store/auth';
import type { MyCourse } from '@/lib/types';

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [myCourses, setMyCourses] = useState<MyCourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/me/courses')
      .then(({ data }) => setMyCourses(data))
      .finally(() => setLoading(false));
  }, []);

  const active = myCourses.filter((c) => c.status === 'active');
  const inProgress = active.find((c) => c.progressPercent < 100) ?? active[0];

  return (
    <AppShell roles={['student', 'teacher']}>
      <h1 className="mb-1 text-2xl font-bold">Salom, {user?.fullName}!</h1>
      <p className="mb-6 text-gray-500">O&apos;rganishni davom ettiring.</p>

      {loading ? (
        <p className="text-gray-400">Yuklanmoqda...</p>
      ) : (
        <>
          {inProgress && (
            <div className="mb-8 rounded-xl bg-indigo-600 p-6 text-white">
              <p className="text-sm text-indigo-100">Davom etilayotgan kurs</p>
              <h2 className="mt-1 text-xl font-bold">{inProgress.course.title}</h2>
              <div className="mt-4 h-2 w-full rounded-full bg-indigo-400/50">
                <div
                  className="h-2 rounded-full bg-white"
                  style={{ width: `${inProgress.progressPercent}%` }}
                />
              </div>
              <p className="mt-2 text-sm">{inProgress.progressPercent}% bajarildi</p>
              <Link
                href={`/courses/${inProgress.course.id}`}
                className="mt-4 inline-block rounded-md bg-white px-4 py-2 text-sm font-medium text-indigo-600"
              >
                Davom ettirish
              </Link>
            </div>
          )}

          <h2 className="mb-4 text-lg font-semibold">Mening kurslarim</h2>
          {myCourses.length === 0 && (
            <p className="text-gray-500">
              Hali hech qanday kursga yozilmagansiz.{' '}
              <Link href="/courses" className="text-indigo-600 hover:underline">
                Katalogni ko&apos;rish
              </Link>
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {myCourses.map((mc) => (
              <Link
                key={mc.enrollmentId}
                href={mc.status === 'active' ? `/courses/${mc.course.id}` : '/pending-approval'}
                className="rounded-lg border bg-white p-4 hover:shadow-md"
              >
                <h3 className="font-semibold">{mc.course.title}</h3>
                <p className="mt-1 text-xs">
                  <StatusBadge status={mc.status} />
                </p>
                {mc.status === 'active' && (
                  <>
                    <div className="mt-3 h-1.5 w-full rounded-full bg-gray-100">
                      <div className="h-1.5 rounded-full bg-indigo-500" style={{ width: `${mc.progressPercent}%` }} />
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      {mc.progressPercent}% · {mc.daysLeft} kun qoldi
                    </p>
                  </>
                )}
              </Link>
            ))}
          </div>
        </>
      )}
    </AppShell>
  );
}

function StatusBadge({ status }: { status: MyCourse['status'] }) {
  const map: Record<MyCourse['status'], { text: string; className: string }> = {
    pending: { text: 'Tasdiq kutilmoqda', className: 'text-amber-600' },
    active: { text: 'Faol', className: 'text-green-600' },
    expired: { text: 'Muddati tugagan', className: 'text-red-600' },
    blocked: { text: 'Bloklangan', className: 'text-red-600' },
    rejected: { text: 'Rad etilgan', className: 'text-red-600' },
  };
  const info = map[status];
  return <span className={info.className}>{info.text}</span>;
}
