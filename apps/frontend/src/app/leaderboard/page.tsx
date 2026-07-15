'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { AppShell } from '@/components/AppShell';

interface LeaderboardRow {
  rank: number;
  fullName: string;
  totalXp: number;
  streakDays: number;
}

interface StatsDto {
  totalXp: number;
  rank: number | null;
  streakDays: number;
  completedLessons: number;
  completedCourses: number;
  heatmap: { date: string; minutes: number }[];
}

export default function LeaderboardPage() {
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [stats, setStats] = useState<StatsDto | null>(null);

  useEffect(() => {
    api.get('/leaderboard').then(({ data }) => setRows(data));
    api.get('/me/stats').then(({ data }) => setStats(data));
  }, []);

  return (
    <AppShell roles={['student', 'teacher']}>
      <h1 className="mb-6 text-2xl font-bold">Peshqadamlar reytingi</h1>

      {stats && (
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatTile label="Jami XP" value={stats.totalXp} />
          <StatTile label="O'rin" value={stats.rank ?? '-'} />
          <StatTile label="Streak" value={`${stats.streakDays} kun`} />
          <StatTile label="Tugatilgan darslar" value={stats.completedLessons} />
        </div>
      )}

      {stats && <ActivityHeatmap data={stats.heatmap} />}

      <div className="mt-8 overflow-hidden rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-2">#</th>
              <th className="px-4 py-2">Ism</th>
              <th className="px-4 py-2">XP</th>
              <th className="px-4 py-2">Streak</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.rank} className="border-t">
                <td className="px-4 py-2 font-medium">{r.rank}</td>
                <td className="px-4 py-2">{r.fullName}</td>
                <td className="px-4 py-2">{r.totalXp}</td>
                <td className="px-4 py-2">{r.streakDays} kun</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border bg-white p-4 text-center">
      <p className="text-2xl font-bold text-indigo-600">{value}</p>
      <p className="mt-1 text-xs text-gray-500">{label}</p>
    </div>
  );
}

function ActivityHeatmap({ data }: { data: { date: string; minutes: number }[] }) {
  const map = new Map(data.map((d) => [new Date(d.date).toDateString(), d.minutes]));
  const days = Array.from({ length: 60 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (59 - i));
    return d;
  });

  function colorFor(minutes: number) {
    if (!minutes) return 'bg-gray-100';
    if (minutes < 15) return 'bg-indigo-200';
    if (minutes < 45) return 'bg-indigo-400';
    return 'bg-indigo-600';
  }

  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-gray-700">Faollik (oxirgi 60 kun)</h3>
      <div className="grid grid-flow-col grid-rows-7 gap-1 overflow-x-auto">
        {days.map((d) => (
          <div
            key={d.toISOString()}
            title={d.toLocaleDateString('uz-UZ')}
            className={`h-3 w-3 rounded-sm ${colorFor(map.get(d.toDateString()) ?? 0)}`}
          />
        ))}
      </div>
    </div>
  );
}
