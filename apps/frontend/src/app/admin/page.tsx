'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { AppShell } from '@/components/AppShell';

interface AnalyticsDto {
  totalStudents: number;
  activeEnrollments: number;
  pendingEnrollments: number;
  publishedCourses: number;
  certificatesIssued: number;
  courseCompletion: { courseId: string; courseTitle: string; studentsCount: number; averageProgress: number }[];
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<AnalyticsDto | null>(null);

  useEffect(() => {
    api.get('/admin/analytics').then(({ data }) => setData(data));
  }, []);

  return (
    <AppShell roles={['admin']}>
      <h1 className="mb-6 text-2xl font-bold">Dashboard</h1>
      {data && (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            <Tile label="O'quvchilar" value={data.totalStudents} />
            <Tile label="Faol dostuplar" value={data.activeEnrollments} />
            <Tile label="Tasdiq kutilmoqda" value={data.pendingEnrollments} highlight />
            <Tile label="Nashr etilgan kurslar" value={data.publishedCourses} />
            <Tile label="Berilgan sertifikatlar" value={data.certificatesIssued} />
          </div>

          <h2 className="mb-3 mt-8 text-lg font-semibold">Kurslar bo&apos;yicha tugatish statistikasi</h2>
          <div className="overflow-hidden rounded-lg border bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-500">
                <tr>
                  <th className="px-4 py-2">Kurs</th>
                  <th className="px-4 py-2">O&apos;quvchilar</th>
                  <th className="px-4 py-2">O&apos;rtacha progress</th>
                </tr>
              </thead>
              <tbody>
                {data.courseCompletion.map((c) => (
                  <tr key={c.courseId} className="border-t">
                    <td className="px-4 py-2">{c.courseTitle}</td>
                    <td className="px-4 py-2">{c.studentsCount}</td>
                    <td className="px-4 py-2">{c.averageProgress}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </AppShell>
  );
}

function Tile({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`rounded-lg border p-4 text-center ${highlight ? 'bg-amber-50' : 'bg-white'}`}>
      <p className={`text-2xl font-bold ${highlight ? 'text-amber-600' : 'text-indigo-600'}`}>{value}</p>
      <p className="mt-1 text-xs text-gray-500">{label}</p>
    </div>
  );
}
