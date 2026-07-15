'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Laptop } from 'lucide-react';
import { api } from '@/lib/api';
import { AppShell } from '@/components/AppShell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface DeviceDto {
  id: string;
  deviceInfo: string;
  ip: string | null;
  lastActive: string;
}

export default function DevicesPage() {
  const [devices, setDevices] = useState<DeviceDto[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    api
      .get('/auth/sessions')
      .then(({ data }) => setDevices(data))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function revoke(id: string) {
    await api.delete(`/auth/sessions/${id}`);
    toast.success('Qurilma chiqarildi');
    load();
  }

  return (
    <AppShell roles={['student', 'teacher']}>
      <h1 className="mb-2 text-2xl font-bold tracking-tight">Qurilmalar</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Bir vaqtning o&apos;zida maksimal 2 ta qurilmadan foydalanishingiz mumkin.
      </p>
      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
        </div>
      ) : (
        <div className="space-y-2">
          {devices.map((d) => (
            <Card key={d.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                    <Laptop className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{d.deviceInfo}</p>
                    <p className="text-xs text-muted-foreground">
                      Faol: {new Date(d.lastActive).toLocaleString('uz-UZ')}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => revoke(d.id)}>
                  Chiqarish
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}
