'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';

export default function Home() {
  const router = useRouter();
  const { accessToken, user } = useAuthStore();

  useEffect(() => {
    if (accessToken && user) {
      router.replace(user.role === 'admin' ? '/admin' : '/dashboard');
    } else {
      router.replace('/login');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div className="flex min-h-screen items-center justify-center text-gray-400">Yuklanmoqda...</div>;
}
