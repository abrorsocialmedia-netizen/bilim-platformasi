'use client';

import { useEffect, useState } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { api } from '@/lib/api';
import { AppShell } from '@/components/AppShell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface NotificationDto {
  id: string;
  type: string;
  text: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationDto[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    api
      .get('/me/notifications')
      .then(({ data }) => setItems(data))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function markAllRead() {
    await api.patch('/me/notifications/read-all');
    load();
  }

  return (
    <AppShell roles={['student', 'teacher']}>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Bildirishnomalar</h1>
        <Button variant="ghost" size="sm" onClick={markAllRead}>
          Barchasini o&apos;qilgan deb belgilash
        </Button>
      </div>
      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
        </div>
      ) : items.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <BellOff className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Bildirishnomalar yo&apos;q.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map((n) => (
            <Card key={n.id} className={cn(!n.isRead && 'border-primary/30 bg-accent')}>
              <CardContent className="flex gap-3 p-4">
                <Bell className={cn('mt-0.5 h-4 w-4 shrink-0', n.isRead ? 'text-muted-foreground' : 'text-primary')} />
                <div>
                  <p className="text-sm">{n.text}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{new Date(n.createdAt).toLocaleString('uz-UZ')}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}
