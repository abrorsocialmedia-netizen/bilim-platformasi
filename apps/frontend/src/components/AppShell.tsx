'use client';

import { AuthGuard } from './AuthGuard';
import { Navbar } from './Navbar';

export function AppShell({
  children,
  roles,
}: {
  children: React.ReactNode;
  roles?: Array<'student' | 'teacher' | 'admin'>;
}) {
  return (
    <AuthGuard roles={roles}>
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </AuthGuard>
  );
}
