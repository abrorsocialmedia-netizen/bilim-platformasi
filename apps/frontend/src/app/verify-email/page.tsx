'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { api, apiErrorMessage } from '@/lib/api';
import { AuthCard } from '@/components/AuthCard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') ?? '');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/verify-email', { email, code });
      toast.success('Email muvaffaqiyatli tasdiqlandi');
      router.push('/login?verified=1');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Kodni tasdiqlashda xatolik'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard title="Emailni tasdiqlash">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            required
            type="email"
            placeholder="email@misol.uz"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Tasdiqlash kodi</Label>
          <InputOTP maxLength={6} value={code} onChange={setCode}>
            <InputOTPGroup className="w-full justify-between">
              {Array.from({ length: 6 }).map((_, i) => (
                <InputOTPSlot key={i} index={i} className="h-11 flex-1 text-base" />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </div>
        <Button type="submit" loading={loading} className="w-full">
          Tasdiqlash
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        Kod emailingizga yuborildi, 15 daqiqa amal qiladi.
      </p>
    </AuthCard>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailForm />
    </Suspense>
  );
}
