'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { AppShell } from '@/components/AppShell';
import type { CourseSummary } from '@/lib/types';

export default function CoursesCatalogPage() {
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/courses')
      .then(({ data }) => setCourses(data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell roles={['student', 'teacher']}>
      <h1 className="mb-6 text-2xl font-bold">Kurslar katalogi</h1>
      {loading ? (
        <p className="text-gray-400">Yuklanmoqda...</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <Link key={c.id} href={`/courses/${c.id}`} className="overflow-hidden rounded-xl border bg-white hover:shadow-md">
              <div className="h-36 bg-gradient-to-br from-indigo-400 to-indigo-600" />
              <div className="p-4">
                <h2 className="font-semibold">{c.title}</h2>
                <p className="mt-1 line-clamp-2 text-sm text-gray-500">{c.description}</p>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="font-medium text-indigo-600">{c.isFree ? 'Bepul' : `${c.price} so'm`}</span>
                  <span className="text-gray-400">{c.lessonsCount} ta dars</span>
                </div>
              </div>
            </Link>
          ))}
          {courses.length === 0 && <p className="text-gray-500">Hozircha kurslar mavjud emas.</p>}
        </div>
      )}
    </AppShell>
  );
}
