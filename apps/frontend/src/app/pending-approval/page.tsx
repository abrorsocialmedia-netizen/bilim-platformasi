'use client';

import Link from 'next/link';
import { AuthCard } from '@/components/AuthCard';

export default function PendingApprovalPage() {
  return (
    <AuthCard title="Tasdiq kutilmoqda">
      <div className="space-y-4 text-center">
        <p className="text-gray-600">
          Kursga yozilishingiz qabul qilindi. Kurs egasi tasdiqlagach, darslarga dostupingiz avtomatik ochiladi.
        </p>
        <p className="text-sm text-gray-400">Bu odatda tez orada amalga oshadi. Bildirishnomalar bo&apos;limidan holatni kuzatishingiz mumkin.</p>
        <Link href="/dashboard" className="inline-block text-sm text-indigo-600 hover:underline">
          Bosh sahifaga qaytish
        </Link>
      </div>
    </AuthCard>
  );
}
