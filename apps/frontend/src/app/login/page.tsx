'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { toast } from 'sonner';
import { Laptop } from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { AuthCard } from '@/components/AuthCard';
import { PasswordInput } from '@/components/PasswordInput';
import { useAuthStore } from '@/store/auth';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface DeviceInfo {
  id: string;
  deviceInfo: string;
  lastActive: string;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setSession = useAuthStore((s) => s.setSession);
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [deviceLimit, setDeviceLimit] = useState<DeviceInfo[] | null>(null);

  const infoMessage = searchParams.get('verified') ? 'Email tasdiqlandi. Endi kirishingiz mumkin.' : '';

  async function doLogin(path: string, extra?: Record<string, unknown>) {
    const deviceInfo = typeof navigator !== 'undefined' ? navigator.userAgent : 'Web';
    const { data } = await api.post(path, { ...form, deviceInfo, ...extra });
    setSession(data);
    router.push(data.user.role === 'admin' ? '/admin' : '/dashboard');
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await doLogin('/auth/login');
    } catch (err) {
      const data = axios.isAxiosError(err)
        ? (err.response?.data as { code?: string; devices?: DeviceInfo[] } | undefined)
        : undefined;
      if (data?.code === 'DEVICE_LIMIT_REACHED' && data.devices) {
        setDeviceLimit(data.devices);
      } else {
        toast.error(apiErrorMessage(err, "Email yoki parol noto'g'ri"));
      }
    } finally {
      setLoading(false);
    }
  }

  async function revokeAndLogin(deviceId: string) {
    setLoading(true);
    try {
      await doLogin('/auth/login-force', { revokeDeviceId: deviceId });
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  if (deviceLimit) {
    return (
      <AuthCard title="Qurilmalar limiti">
        <p className="mb-4 text-sm text-muted-foreground">
          Bir vaqtning o&apos;zida faqat 2 ta qurilmadan foydalanish mumkin. Davom etish uchun eski qurilmalardan
          birini chiqaring.
        </p>
        <div className="space-y-2">
          {deviceLimit.map((d) => (
            <Card key={d.id} className="p-0">
              <button
                onClick={() => revokeAndLogin(d.id)}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm hover:bg-accent"
              >
                <span className="flex items-center gap-2">
                  <Laptop className="h-4 w-4 text-muted-foreground" />
                  {d.deviceInfo}
                </span>
                <span className="text-xs font-medium text-destructive">Chiqarish</span>
              </button>
            </Card>
          ))}
        </div>
        <Button variant="ghost" onClick={() => setDeviceLimit(null)} className="mt-4 w-full text-muted-foreground">
          Orqaga
        </Button>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Kirish">
      {infoMessage && (
        <div className="mb-4 rounded-md bg-success/10 p-2 text-center text-sm text-success">{infoMessage}</div>
      )}
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            required
            type="email"
            placeholder="email@misol.uz"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Parol</Label>
          <PasswordInput
            id="password"
            required
            value={form.password}
            onChange={(v) => setForm({ ...form, password: v })}
          />
        </div>
        <Button type="submit" loading={loading} className="w-full">
          Kirish
        </Button>
      </form>
      <div className="mt-4 flex justify-between text-sm">
        <Link href="/register" className="font-medium text-primary hover:underline">
          Ro&apos;yxatdan o&apos;tish
        </Link>
        <Link href="/forgot-password" className="text-muted-foreground hover:underline">
          Parolni unutdingizmi?
        </Link>
      </div>
    </AuthCard>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
