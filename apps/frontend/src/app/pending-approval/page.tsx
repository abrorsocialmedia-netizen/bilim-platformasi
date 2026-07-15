'use client';

import Link from 'next/link';
import { Clock } from 'lucide-react';
import { AuthCard } from '@/components/AuthCard';
import { Button } from '@/components/ui/button';

export default function PendingApprovalPage() {
  return (
    <AuthCard title="Tasdiq kutilmoqda">
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-warning/10">
          <Clock className="h-6 w-6 text-warning" />
        </div>
        <p className="text-sm text-muted-foreground">
          Kursga yozilishingiz qabul qilindi. Kurs egasi tasdiqlagach, darslarga dostupingiz avtomatik ochiladi.
        </p>
        <p className="text-xs text-muted-foreground">
          Bu odatda tez orada amalga oshadi. Bildirishnomalar bo&apos;limidan holatni kuzatishingiz mumkin.
        </p>
        <Button asChild variant="outline" className="w-full">
          <Link href="/dashboard">Bosh sahifaga qaytish</Link>
        </Button>
      </div>
    </AuthCard>
  );
}
