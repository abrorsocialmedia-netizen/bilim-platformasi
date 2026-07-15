'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { CheckCircle2, Lock } from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { AppShell } from '@/components/AppShell';
import type { CourseDetail } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';

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

  useEffect(() => {
    Promise.all([
      api.get(`/courses/${params.id}`).then((r) => setCourse(r.data)),
      api.get(`/me/courses/${params.id}/progress`).then((r) => setProgress(r.data)),
    ]).finally(() => setLoading(false));
  }, [params.id]);

  async function enroll() {
    setEnrolling(true);
    try {
      await api.post(`/courses/${params.id}/enroll`);
      router.push('/pending-approval');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Yozilishda xatolik yuz berdi'));
    } finally {
      setEnrolling(false);
    }
  }

  if (loading) {
    return (
      <AppShell roles={['student', 'teacher']}>
        <Skeleton className="h-48 w-full rounded-xl" />
      </AppShell>
    );
  }

  if (!course) {
    return (
      <AppShell roles={['student', 'teacher']}>
        <p className="text-muted-foreground">Kurs topilmadi.</p>
      </AppShell>
    );
  }

  const hasAccess = progress.status === 'active';

  return (
    <AppShell roles={['student', 'teacher']}>
      <Card className="mb-6 overflow-hidden border-none bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg">
        <CardContent className="p-8">
          <h1 className="text-2xl font-bold">{course.title}</h1>
          <p className="mt-2 max-w-2xl text-primary-foreground/90">{course.description}</p>
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <span>{course.isFree ? 'Bepul' : `${course.price} so'm`}</span>
            <span>{course.durationDays} kunlik dostup</span>
            {course.isCertified && <span>🎓 Sertifikatli</span>}
            {course.teacher && <span>O&apos;qituvchi: {course.teacher.fullName}</span>}
          </div>

          {!progress.status && (
            <Button onClick={enroll} loading={enrolling} variant="secondary" className="mt-6">
              Kursga yozilish
            </Button>
          )}
          {progress.status === 'pending' && (
            <div className="mt-6 rounded-md bg-white/10 px-4 py-2 text-sm">Yozilishingiz tasdiqlanishi kutilmoqda.</div>
          )}
          {progress.status === 'expired' && (
            <div className="mt-6 rounded-md bg-white/10 px-4 py-2 text-sm">
              Dostup muddati tugagan. Kurs egasiga murojaat qiling.
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          <h2 className="mb-4 text-lg font-semibold tracking-tight">Kurs dasturi</h2>
          <div className="space-y-4">
            {course.modules.map((m) => (
              <Card key={m.id}>
                <div className="border-b bg-muted/50 px-4 py-2.5 font-medium">{m.title}</div>
                <div className="divide-y">
                  {m.lessons.map((l) => {
                    const done = progress.completedLessonIds.includes(l.id);
                    return hasAccess ? (
                      <Link
                        key={l.id}
                        href={`/lessons/${l.id}`}
                        className="flex items-center justify-between px-4 py-3 text-sm hover:bg-accent"
                      >
                        <span className="flex items-center gap-2">
                          {done ? (
                            <CheckCircle2 className="h-4 w-4 text-success" />
                          ) : (
                            <span className="h-4 w-4 rounded-full border" />
                          )}
                          {l.title}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {l.durationSec ? `${Math.round(l.durationSec / 60)} daq` : ''}
                        </span>
                      </Link>
                    ) : (
                      <div key={l.id} className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
                        <Lock className="h-3.5 w-3.5" />
                        {l.title}
                      </div>
                    );
                  })}
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={progress.progressPercent} className="h-2" />
              <p className="mt-2 text-sm text-muted-foreground">{progress.progressPercent}% bajarildi</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
