'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Send } from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { AppShell } from '@/components/AppShell';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

interface MeDto {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: string;
  telegramLinked: boolean;
}

export default function ProfilePage() {
  const [me, setMe] = useState<MeDto | null>(null);
  const [form, setForm] = useState({ fullName: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [telegramLink, setTelegramLink] = useState<string | null>(null);

  useEffect(() => {
    api.get('/me').then(({ data }) => {
      setMe(data);
      setForm({ fullName: data.fullName, phone: data.phone ?? '' });
    });
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch('/me', form);
      toast.success('Profil yangilandi');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function connectTelegram() {
    const { data } = await api.post('/telegram/link');
    setTelegramLink(data.deepLink ?? `Kod: ${data.code}`);
  }

  return (
    <AppShell roles={['student', 'teacher']}>
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Profil</h1>
      <Card className="max-w-lg">
        <CardContent className="pt-6">
          <form onSubmit={save} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input disabled value={me?.email ?? ''} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fullName">To&apos;liq ism</Label>
              <Input id="fullName" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Telefon</Label>
              <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <Button type="submit" loading={saving}>
              Saqlash
            </Button>
          </form>

          <Separator className="my-6" />

          <div>
            <h2 className="mb-2 text-sm font-semibold">Telegram</h2>
            {me?.telegramLinked ? (
              <Badge variant="success">✓ Telegram ulangan</Badge>
            ) : telegramLink ? (
              <a href={telegramLink} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline">
                {telegramLink}
              </a>
            ) : (
              <Button onClick={connectTelegram} variant="outline" size="sm">
                <Send className="h-4 w-4" />
                Telegramni ulash
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}
