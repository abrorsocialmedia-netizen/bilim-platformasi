'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { GraduationCap, PlayCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { AppShell } from '@/components/AppShell';
import type { CourseSummary } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

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
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Kurslar katalogi</h1>
      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <Link key={c.id} href={`/courses/${c.id}`}>
              <Card className="h-full overflow-hidden transition-shadow hover:shadow-md">
                <div className="flex h-32 items-center justify-center bg-gradient-to-br from-primary to-primary/70">
                  <GraduationCap className="h-10 w-10 text-primary-foreground/90" />
                </div>
                <CardContent className="p-4">
                  <h2 className="font-semibold leading-tight">{c.title}</h2>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{c.description}</p>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <Badge variant={c.isFree ? 'success' : 'default'}>{c.isFree ? 'Bepul' : `${c.price} so'm`}</Badge>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <PlayCircle className="h-3.5 w-3.5" />
                      {c.lessonsCount} ta dars
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
          {courses.length === 0 && <p className="text-muted-foreground">Hozircha kurslar mavjud emas.</p>}
        </div>
      )}
    </AppShell>
  );
}
