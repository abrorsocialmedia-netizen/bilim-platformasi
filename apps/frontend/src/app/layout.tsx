import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: "O'quv Platformasi",
  description: "O'quv markazi uchun onlayn ta'lim platformasi",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="uz">
      <body className="antialiased bg-gray-50 text-gray-900">{children}</body>
    </html>
  );
}
