'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { AppShell } from '@/components/AppShell';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface EnrollmentDto {
  id: string;
  status: string;
  progressPercent: number;
  expiresAt: string | null;
  user: { id: string; fullName: string; email: string; phone: string | null };
  course: { id: string; title: string };
}

const STATUS_LABELS: Record<string, { label: string; variant: 'success' | 'warning' | 'destructive' | 'secondary' }> = {
  pending: { label: 'Kutilmoqda', variant: 'warning' },
  active: { label: 'Faol', variant: 'success' },
  expired: { label: 'Muddati tugagan', variant: 'destructive' },
  blocked: { label: 'Bloklangan', variant: 'destructive' },
  rejected: { label: 'Rad etilgan', variant: 'secondary' },
};

export default function AdminStudentsPage() {
  const [items, setItems] = useState<EnrollmentDto[]>([]);
  const [filter, setFilter] = useState<string>('all');

  function load() {
    api.get('/admin/students').then(({ data }) => setItems(data));
  }

  useEffect(() => {
    load();
  }, []);

  async function approve(id: string) {
    await api.post(`/admin/students/${id}/approve`);
    toast.success('Tasdiqlandi');
    load();
  }
  async function reject(id: string) {
    await api.post(`/admin/students/${id}/reject`);
    toast.success('Rad etildi');
    load();
  }
  async function block(id: string) {
    await api.post(`/admin/students/${id}/block`);
    toast.success('Bloklandi');
    load();
  }
  async function extend(id: string) {
    await api.post(`/admin/students/${id}/extend`, { days: 30 });
    toast.success('30 kunga uzaytirildi');
    load();
  }

  const filtered = filter === 'all' ? items : items.filter((i) => i.status === filter);

  return (
    <AppShell roles={['admin']}>
      <h1 className="mb-6 text-2xl font-bold tracking-tight">O&apos;quvchilar</h1>

      <div className="mb-4 flex flex-wrap gap-2">
        {['all', 'pending', 'active', 'expired', 'blocked', 'rejected'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={cn(
              'rounded-full px-3 py-1 text-sm font-medium transition-colors',
              filter === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent',
            )}
          >
            {s === 'all' ? 'Barchasi' : STATUS_LABELS[s]?.label ?? s}
          </button>
        ))}
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>O&apos;quvchi</TableHead>
              <TableHead>Kurs</TableHead>
              <TableHead>Holat</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead className="text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((e) => (
              <TableRow key={e.id}>
                <TableCell>
                  <p className="font-medium">{e.user.fullName}</p>
                  <p className="text-xs text-muted-foreground">
                    {e.user.email} {e.user.phone ? `· ${e.user.phone}` : ''}
                  </p>
                </TableCell>
                <TableCell>{e.course.title}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_LABELS[e.status]?.variant ?? 'secondary'}>
                    {STATUS_LABELS[e.status]?.label ?? e.status}
                  </Badge>
                </TableCell>
                <TableCell>{e.progressPercent}%</TableCell>
                <TableCell className="space-x-1 text-right">
                  {e.status === 'pending' && (
                    <>
                      <Button size="sm" variant="outline" className="text-success" onClick={() => approve(e.id)}>
                        Tasdiqlash
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => reject(e.id)}>
                        Rad etish
                      </Button>
                    </>
                  )}
                  {e.status === 'active' && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => extend(e.id)}>
                        Uzaytirish
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => block(e.id)}>
                        Bloklash
                      </Button>
                    </>
                  )}
                  {e.status === 'expired' && (
                    <Button size="sm" variant="outline" onClick={() => extend(e.id)}>
                      Uzaytirish
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </AppShell>
  );
}
