'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { AppShell } from '@/components/AppShell';
import type { CourseSummary } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', durationDays: 120, isFree: true, price: 0, isCertified: false });
  const [saving, setSaving] = useState(false);

  function load() {
    api.get('/admin/courses').then(({ data }) => setCourses(data));
  }

  useEffect(() => {
    load();
  }, []);

  async function createCourse(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/admin/courses', form);
      toast.success('Kurs yaratildi');
      setOpen(false);
      setForm({ title: '', description: '', durationDays: 120, isFree: true, price: 0, isCertified: false });
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell roles={['admin']}>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Kurslar</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" /> Yangi kurs
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yangi kurs yaratish</DialogTitle>
            </DialogHeader>
            <form onSubmit={createCourse} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="title">Kurs nomi</Label>
                <Input id="title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="description">Tavsif</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="durationDays">Muddat (kun)</Label>
                <Input
                  id="durationDays"
                  type="number"
                  value={form.durationDays}
                  onChange={(e) => setForm({ ...form, durationDays: Number(e.target.value) })}
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={form.isFree} onCheckedChange={(v) => setForm({ ...form, isFree: Boolean(v) })} />
                Bepul
              </label>
              {!form.isFree && (
                <div className="space-y-1.5">
                  <Label htmlFor="price">Narx</Label>
                  <Input
                    id="price"
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                  />
                </div>
              )}
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={form.isCertified} onCheckedChange={(v) => setForm({ ...form, isCertified: Boolean(v) })} />
                Sertifikatli
              </label>
              <DialogFooter>
                <Button type="submit" loading={saving} className="w-full">
                  Yaratish
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nomi</TableHead>
              <TableHead>Holat</TableHead>
              <TableHead>Darslar</TableHead>
              <TableHead>Narx</TableHead>
              <TableHead className="text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {courses.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.title}</TableCell>
                <TableCell>
                  <Badge variant={c.status === 'published' ? 'success' : 'secondary'}>
                    {c.status === 'published' ? 'Nashr etilgan' : 'Qoralama'}
                  </Badge>
                </TableCell>
                <TableCell>{c.lessonsCount}</TableCell>
                <TableCell>{c.isFree ? 'Bepul' : `${c.price}`}</TableCell>
                <TableCell className="text-right">
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/admin/courses/${c.id}`}>Tahrirlash</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </AppShell>
  );
}
