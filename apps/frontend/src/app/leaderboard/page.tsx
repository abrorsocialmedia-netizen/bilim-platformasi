'use client';

import { useEffect, useState } from 'react';
import { Flame, Trophy } from 'lucide-react';
import { api } from '@/lib/api';
import { AppShell } from '@/components/AppShell';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

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
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Peshqadamlar reytingi</h1>

      {stats && (
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatTile label="Jami XP" value={stats.totalXp} />
          <StatTile label="O'rin" value={stats.rank ?? '-'} />
          <StatTile label="Streak" value={`${stats.streakDays} kun`} icon={<Flame className="h-4 w-4 text-warning" />} />
          <StatTile label="Tugatilgan darslar" value={stats.completedLessons} />
        </div>
      )}

      {stats && <ActivityHeatmap data={stats.heatmap} />}

      <Card className="mt-8">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-14">#</TableHead>
              <TableHead>Ism</TableHead>
              <TableHead>XP</TableHead>
              <TableHead>Streak</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.rank}>
                <TableCell className="font-medium">
                  {r.rank <= 3 ? <Trophy className="h-4 w-4 text-warning" /> : r.rank}
                </TableCell>
                <TableCell className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="bg-primary/10 text-[10px] text-primary">
                      {r.fullName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {r.fullName}
                </TableCell>
                <TableCell>{r.totalXp}</TableCell>
                <TableCell>{r.streakDays} kun</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </AppShell>
  );
}

function StatTile({ label, value, icon }: { label: string; value: string | number; icon?: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-1 py-4 text-center">
        <div className="flex items-center gap-1.5 text-2xl font-bold text-primary">
          {icon}
          {value}
        </div>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
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
    if (!minutes) return 'bg-muted';
    if (minutes < 15) return 'bg-primary/30';
    if (minutes < 45) return 'bg-primary/60';
    return 'bg-primary';
  }

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Faollik (oxirgi 60 kun)</h3>
        <div className="grid grid-flow-col grid-rows-7 gap-1 overflow-x-auto">
          {days.map((d) => (
            <div
              key={d.toISOString()}
              title={d.toLocaleDateString('uz-UZ')}
              className={`h-3 w-3 rounded-sm ${colorFor(map.get(d.toDateString()) ?? 0)}`}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
