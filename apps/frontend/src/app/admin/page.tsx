'use client';

import { useEffect, useState } from 'react';
import { Award, BookOpen, Clock, GraduationCap, Users } from 'lucide-react';
import { api } from '@/lib/api';
import { AppShell } from '@/components/AppShell';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';

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
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Dashboard</h1>
      {!data ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            <Tile icon={<Users className="h-4 w-4" />} label="O'quvchilar" value={data.totalStudents} />
            <Tile icon={<GraduationCap className="h-4 w-4" />} label="Faol dostuplar" value={data.activeEnrollments} />
            <Tile icon={<Clock className="h-4 w-4" />} label="Tasdiq kutilmoqda" value={data.pendingEnrollments} highlight />
            <Tile icon={<BookOpen className="h-4 w-4" />} label="Nashr etilgan kurslar" value={data.publishedCourses} />
            <Tile icon={<Award className="h-4 w-4" />} label="Berilgan sertifikatlar" value={data.certificatesIssued} />
          </div>

          <h2 className="mb-3 mt-8 text-lg font-semibold tracking-tight">Kurslar bo&apos;yicha tugatish statistikasi</h2>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kurs</TableHead>
                  <TableHead>O&apos;quvchilar</TableHead>
                  <TableHead className="w-64">O&apos;rtacha progress</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.courseCompletion.map((c) => (
                  <TableRow key={c.courseId}>
                    <TableCell className="font-medium">{c.courseTitle}</TableCell>
                    <TableCell>{c.studentsCount}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={c.averageProgress} className="h-1.5" />
                        <span className="text-xs text-muted-foreground">{c.averageProgress}%</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </>
      )}
    </AppShell>
  );
}

function Tile({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <Card className={highlight ? 'border-warning/40 bg-warning/5' : ''}>
      <CardContent className="flex flex-col items-center gap-1 py-5 text-center">
        <div className={highlight ? 'text-warning' : 'text-primary'}>{icon}</div>
        <p className={`text-2xl font-bold ${highlight ? 'text-warning' : 'text-primary'}`}>{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}
