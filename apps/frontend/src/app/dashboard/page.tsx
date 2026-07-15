'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen } from 'lucide-react';
import { api } from '@/lib/api';
import { AppShell } from '@/components/AppShell';
import { useAuthStore } from '@/store/auth';
import type { MyCourse } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';

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
      <h1 className="mb-1 text-2xl font-bold tracking-tight">Salom, {user?.fullName}!</h1>
      <p className="mb-6 text-muted-foreground">O&apos;rganishni davom ettiring.</p>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-6 w-40" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
          </div>
        </div>
      ) : (
        <>
          {inProgress && (
            <Card className="mb-8 overflow-hidden border-none bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg">
              <CardContent className="p-6">
                <p className="text-sm text-primary-foreground/80">Davom etilayotgan kurs</p>
                <h2 className="mt-1 text-xl font-bold">{inProgress.course.title}</h2>
                <Progress value={inProgress.progressPercent} className="mt-4 bg-primary-foreground/20 [&>div]:bg-white" />
                <p className="mt-2 text-sm text-primary-foreground/90">{inProgress.progressPercent}% bajarildi</p>
                <Button asChild variant="secondary" size="sm" className="mt-4">
                  <Link href={`/courses/${inProgress.course.id}`}>
                    Davom ettirish <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          <h2 className="mb-4 text-lg font-semibold tracking-tight">Mening kurslarim</h2>
          {myCourses.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
                <BookOpen className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Hali hech qanday kursga yozilmagansiz.</p>
                <Button asChild size="sm">
                  <Link href="/courses">Katalogni ko&apos;rish</Link>
                </Button>
              </CardContent>
            </Card>
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {myCourses.map((mc) => (
              <Link key={mc.enrollmentId} href={mc.status === 'active' ? `/courses/${mc.course.id}` : '/pending-approval'}>
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base">{mc.course.title}</CardTitle>
                      <StatusBadge status={mc.status} />
                    </div>
                  </CardHeader>
                  {mc.status === 'active' && (
                    <CardContent className="pt-0">
                      <Progress value={mc.progressPercent} className="h-1.5" />
                      <p className="mt-2 text-xs text-muted-foreground">
                        {mc.progressPercent}% &middot; {mc.daysLeft} kun qoldi
                      </p>
                    </CardContent>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        </>
      )}
    </AppShell>
  );
}

function StatusBadge({ status }: { status: MyCourse['status'] }) {
  const map: Record<MyCourse['status'], { text: string; variant: 'success' | 'warning' | 'destructive' }> = {
    pending: { text: 'Tasdiq kutilmoqda', variant: 'warning' },
    active: { text: 'Faol', variant: 'success' },
    expired: { text: 'Muddati tugagan', variant: 'destructive' },
    blocked: { text: 'Bloklangan', variant: 'destructive' },
    rejected: { text: 'Rad etilgan', variant: 'destructive' },
  };
  const info = map[status];
  return (
    <Badge variant={info.variant} className="shrink-0">
      {info.text}
    </Badge>
  );
}
