'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { api, apiErrorMessage } from '@/lib/api';
import { AppShell } from '@/components/AppShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';

interface ConfigDto {
  brandName: string;
  logoUrl: string | null;
  primaryColor: string;
  domain: string | null;
  telegramBotToken: string | null;
  ownerChatId: string | null;
  featureFlags: Record<string, boolean>;
}

const FEATURE_LABELS: Record<string, string> = {
  aiQa: 'AI savol-javob',
  forum: 'Forum',
  onlinePayments: "Onlayn to'lov",
  gamification: 'Geymifikatsiya',
  certificates: 'Sertifikatlar',
};

export default function AdminSettingsPage() {
  const [config, setConfig] = useState<ConfigDto | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/admin/config').then(({ data }) => setConfig(data));
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!config) return;
    setSaving(true);
    try {
      await api.put('/admin/config', config);
      toast.success('Sozlamalar saqlandi');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (!config) {
    return (
      <AppShell roles={['admin']}>
        <Skeleton className="h-96 max-w-xl rounded-xl" />
      </AppShell>
    );
  }

  return (
    <AppShell roles={['admin']}>
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Sozlamalar</h1>
      <form onSubmit={save} className="max-w-xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Brend</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label>Platforma nomi</Label>
              <Input value={config.brandName} onChange={(e) => setConfig({ ...config, brandName: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Logo URL</Label>
              <Input value={config.logoUrl ?? ''} onChange={(e) => setConfig({ ...config, logoUrl: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Asosiy rang</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={config.primaryColor}
                  onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                  className="h-9 w-14 cursor-pointer rounded-md border"
                />
                <span className="text-sm text-muted-foreground">{config.primaryColor}</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Domen</Label>
              <Input value={config.domain ?? ''} onChange={(e) => setConfig({ ...config, domain: e.target.value })} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Telegram bot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label>Bot token</Label>
              <Input
                value={config.telegramBotToken ?? ''}
                onChange={(e) => setConfig({ ...config, telegramBotToken: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Egasi chat ID</Label>
              <Input
                value={config.ownerChatId ?? ''}
                onChange={(e) => setConfig({ ...config, ownerChatId: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Modullar (feature flags)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(FEATURE_LABELS).map(([key, label]) => (
              <label key={key} className="flex items-center justify-between text-sm">
                {label}
                <Checkbox
                  checked={Boolean(config.featureFlags[key])}
                  onCheckedChange={(v) =>
                    setConfig({ ...config, featureFlags: { ...config.featureFlags, [key]: Boolean(v) } })
                  }
                />
              </label>
            ))}
          </CardContent>
        </Card>

        <Button type="submit" loading={saving}>
          Saqlash
        </Button>
      </form>
    </AppShell>
  );
}
