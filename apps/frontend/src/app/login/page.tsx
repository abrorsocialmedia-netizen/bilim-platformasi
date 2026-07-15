'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { api, apiErrorMessage } from '@/lib/api';
import { AuthCard } from '@/components/AuthCard';
import { useAuthStore } from '@/store/auth';

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
  const [error, setError] = useState('');
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
    setError('');
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
        setError(apiErrorMessage(err, "Email yoki parol noto'g'ri"));
      }
    } finally {
      setLoading(false);
    }
  }

  async function revokeAndLogin(deviceId: string) {
    setError('');
    setLoading(true);
    try {
      await doLogin('/auth/login-force', { revokeDeviceId: deviceId });
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  if (deviceLimit) {
    return (
      <AuthCard title="Qurilmalar limiti">
        <p className="mb-4 text-sm text-gray-600">
          Bir vaqtning o&apos;zida faqat 2 ta qurilmadan foydalanish mumkin. Davom etish uchun eski qurilmalardan
          birini chiqaring.
        </p>
        <div className="space-y-2">
          {deviceLimit.map((d) => (
            <button
              key={d.id}
              onClick={() => revokeAndLogin(d.id)}
              className="flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm hover:bg-gray-50"
            >
              <span>{d.deviceInfo}</span>
              <span className="text-xs text-red-600">Chiqarish</span>
            </button>
          ))}
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <button onClick={() => setDeviceLimit(null)} className="mt-4 text-sm text-gray-500 hover:underline">
          Orqaga
        </button>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Kirish">
      {infoMessage && <p className="mb-4 rounded-md bg-green-50 p-2 text-center text-sm text-green-700">{infoMessage}</p>}
      <form onSubmit={onSubmit} className="space-y-4">
        <input
          required
          type="email"
          placeholder="Email"
          className="w-full rounded-md border px-3 py-2 text-sm"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          required
          type="password"
          placeholder="Parol"
          className="w-full rounded-md border px-3 py-2 text-sm"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          disabled={loading}
          className="w-full rounded-md bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? 'Kirilmoqda...' : 'Kirish'}
        </button>
      </form>
      <div className="mt-4 flex justify-between text-sm">
        <Link href="/register" className="text-indigo-600 hover:underline">
          Ro&apos;yxatdan o&apos;tish
        </Link>
        <Link href="/forgot-password" className="text-gray-500 hover:underline">
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
