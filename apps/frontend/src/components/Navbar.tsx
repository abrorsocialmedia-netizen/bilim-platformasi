'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';

const studentLinks = [
  { href: '/dashboard', label: 'Bosh sahifa' },
  { href: '/courses', label: 'Kurslar' },
  { href: '/certificates', label: 'Sertifikatlar' },
  { href: '/leaderboard', label: 'Reyting' },
  { href: '/notifications', label: 'Bildirishnomalar' },
  { href: '/devices', label: 'Qurilmalar' },
  { href: '/profile', label: 'Profil' },
];

const adminLinks = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/courses', label: 'Kurslar' },
  { href: '/admin/students', label: "O'quvchilar" },
  { href: '/admin/settings', label: 'Sozlamalar' },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  if (!user) return null;

  const links = user.role === 'admin' ? adminLinks : studentLinks;

  return (
    <nav className="border-b bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <span className="text-lg font-bold text-indigo-600">O&apos;quv Platformasi</span>
          <div className="hidden gap-4 md:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm ${
                  pathname === link.href ? 'font-semibold text-indigo-600' : 'text-gray-600 hover:text-indigo-600'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{user.fullName}</span>
          <button
            onClick={() => {
              logout();
              router.replace('/login');
            }}
            className="rounded-md bg-gray-100 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200"
          >
            Chiqish
          </button>
        </div>
      </div>
    </nav>
  );
}
