'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { AppShell } from '@/components/AppShell';

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
      <h1 className="mb-6 text-2xl font-bold">Sertifikatlarim</h1>
      {loading ? (
        <p className="text-gray-400">Yuklanmoqda...</p>
      ) : certificates.length === 0 ? (
        <p className="text-gray-500">Hali sertifikatlaringiz yo&apos;q. Sertifikatli kursni 100% tugating.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {certificates.map((c) => (
            <div key={c.id} className="rounded-lg border bg-white p-5">
              <p className="text-lg font-semibold">🎓 {c.course.title}</p>
              <p className="mt-1 text-sm text-gray-500">№ {c.certNumber}</p>
              <p className="text-sm text-gray-400">{new Date(c.issuedAt).toLocaleDateString('uz-UZ')}</p>
              {c.pdfUrl && (
                <span className="mt-3 inline-block text-sm text-indigo-600">PDF tayyor</span>
              )}
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
