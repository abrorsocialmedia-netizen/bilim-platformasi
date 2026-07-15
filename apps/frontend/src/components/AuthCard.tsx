export function AuthCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-xl border bg-white p-8 shadow-sm">
        <h1 className="mb-6 text-center text-2xl font-bold text-indigo-600">O&apos;quv Platformasi</h1>
        <h2 className="mb-6 text-center text-lg font-semibold text-gray-800">{title}</h2>
        {children}
      </div>
    </div>
  );
}
