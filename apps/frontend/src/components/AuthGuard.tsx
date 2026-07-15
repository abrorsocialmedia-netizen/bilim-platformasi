'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth';

export function AuthGuard({
  children,
  roles,
}: {
  children: React.ReactNode;
  roles?: Array<'student' | 'teacher' | 'admin'>;
}) {
  const router = useRouter();
  const { accessToken, user } = useAuthStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!accessToken) {
      router.replace('/login');
      return;
    }
    if (roles && user && !roles.includes(user.role)) {
      router.replace('/dashboard');
      return;
    }
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, user]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
