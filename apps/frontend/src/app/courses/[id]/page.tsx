'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, apiErrorMessage } from '@/lib/api';
import { AppShell } from '@/components/AppShell';
import type { CourseDetail } from '@/lib/types';

export default function CourseDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [progress, setProgress] = useState<{
    status: string | null;
    progressPercent: number;
    completedLessonIds: string[];
  }>({ status: null, progressPercent: 0, completedLessonIds: [] });
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get(`/courses/${params.id}`).then((r) => setCourse(r.data)),
      api.get(`/me/courses/${params.id}/progress`).then((r) => setProgress(r.data)),
    ]).finally(() => setLoading(false));
  }, [params.id]);

  async function enroll() {
    setEnrolling(true);
    setError('');
    try {
      await api.post(`/courses/${params.id}/enroll`);
      router.push('/pending-approval');
    } catch (err) {
      setError(apiErrorMessage(err, "Yozilishda xatolik yuz berdi"));
    } finally {
      setEnrolling(false);
    }
  }

  if (loading) {
    return (
      <AppShell roles={['student', 'teacher']}>
        <p className="text-gray-400">Yuklanmoqda...</p>
      </AppShell>
    );
  }

  if (!course) {
    return (
      <AppShell roles={['student', 'teacher']}>
        <p className="text-gray-500">Kurs topilmadi.</p>
      </AppShell>
    );
  }

  const hasAccess = progress.status === 'active';

  return (
    <AppShell roles={['student', 'teacher']}>
      <div className="mb-6 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 p-8 text-white">
        <h1 className="text-2xl font-bold">{course.title}</h1>
        <p className="mt-2 max-w-2xl text-indigo-100">{course.description}</p>
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <span>{course.isFree ? 'Bepul' : `${course.price} so'm`}</span>
          <span>{course.durationDays} kunlik dostup</span>
          {course.isCertified && <span>🎓 Sertifikatli</span>}
          {course.teacher && <span>O&apos;qituvchi: {course.teacher.fullName}</span>}
        </div>

        {!progress.status && (
          <button
            onClick={enroll}
            disabled={enrolling}
            className="mt-6 rounded-md bg-white px-5 py-2 text-sm font-semibold text-indigo-700 disabled:opacity-50"
          >
            {enrolling ? 'Yuborilmoqda...' : 'Kursga yozilish'}
          </button>
        )}
        {progress.status === 'pending' && (
          <p className="mt-6 rounded-md bg-white/10 px-4 py-2 text-sm">Yozilishingiz tasdiqlanishi kutilmoqda.</p>
        )}
        {progress.status === 'expired' && (
          <p className="mt-6 rounded-md bg-white/10 px-4 py-2 text-sm">Dostup muddati tugagan. Kurs egasiga murojaat qiling.</p>
        )}
        {error && <p className="mt-3 text-sm text-red-100">{error}</p>}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          <h2 className="mb-4 text-lg font-semibold">Kurs dasturi</h2>
          <div className="space-y-4">
            {course.modules.map((m) => (
              <div key={m.id} className="rounded-lg border bg-white">
                <div className="border-b bg-gray-50 px-4 py-2 font-medium">{m.title}</div>
                <ul>
                  {m.lessons.map((l) => {
                    const done = progress.completedLessonIds.includes(l.id);
                    return (
                      <li key={l.id} className="border-b last:border-0">
                        {hasAccess ? (
                          <Link
                            href={`/lessons/${l.id}`}
                            className="flex items-center justify-between px-4 py-3 text-sm hover:bg-gray-50"
                          >
                            <span className="flex items-center gap-2">
                              <span className={done ? 'text-green-600' : 'text-gray-300'}>●</span>
                              {l.title}
                            </span>
                            <span className="text-xs text-gray-400">
                              {l.durationSec ? `${Math.round(l.durationSec / 60)} daq` : ''}
                            </span>
                          </Link>
                        ) : (
                          <div className="flex items-center justify-between px-4 py-3 text-sm text-gray-400">
                            <span>🔒 {l.title}</span>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="rounded-lg border bg-white p-4">
            <h3 className="mb-3 text-sm font-semibold text-gray-700">Progress</h3>
            <div className="h-2 w-full rounded-full bg-gray-100">
              <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${progress.progressPercent}%` }} />
            </div>
            <p className="mt-2 text-sm text-gray-500">{progress.progressPercent}% bajarildi</p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
