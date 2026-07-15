'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { api, apiErrorMessage } from '@/lib/api';
import { AuthCard } from '@/components/AuthCard';
import { PasswordInput } from '@/components/PasswordInput';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '' });
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/register', form);
      toast.success('Tasdiqlash kodi emailingizga yuborildi');
      router.push(`/verify-email?email=${encodeURIComponent(form.email)}`);
    } catch (err) {
      toast.error(apiErrorMessage(err, "Ro'yxatdan o'tishda xatolik"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard title="Ro'yxatdan o'tish">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="fullName">To&apos;liq ism</Label>
          <Input
            id="fullName"
            required
            placeholder="Ism Familiya"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          />
        </div>
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
          <Label htmlFor="phone">Telefon</Label>
          <Input
            id="phone"
            placeholder="+998 90 123 45 67"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Parol</Label>
          <PasswordInput
            id="password"
            required
            minLength={6}
            value={form.password}
            onChange={(v) => setForm({ ...form, password: v })}
          />
        </div>
        <Button type="submit" loading={loading} className="w-full">
          Ro&apos;yxatdan o&apos;tish
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        Akkountingiz bormi?{' '}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Kirish
        </Link>
      </p>
    </AuthCard>
  );
}
