'use client';

import { useEffect, useState } from 'react';
import { Award } from 'lucide-react';
import { api } from '@/lib/api';
import { AppShell } from '@/components/AppShell';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface CertificateDto {
  id: string;
  certNumber: string;
  issuedAt: string;
  pdfUrl: string | null;
  course: { title: string };
}

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<CertificateDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/me/certificates')
      .then(({ data }) => setCertificates(data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell roles={['student', 'teacher']}>
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Sertifikatlarim</h1>
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
      ) : certificates.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <Award className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Hali sertifikatlaringiz yo&apos;q. Sertifikatli kursni 100% tugating.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {certificates.map((c) => (
            <Card key={c.id}>
              <CardContent className="flex items-start gap-4 p-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Award className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold leading-tight">{c.course.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">№ {c.certNumber}</p>
                  <p className="text-xs text-muted-foreground">{new Date(c.issuedAt).toLocaleDateString('uz-UZ')}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}
