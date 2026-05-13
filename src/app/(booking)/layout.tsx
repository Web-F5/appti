// src/app/(booking)/layout.tsx
export default function BookingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: 'var(--surface)' }}>
      <main className="max-w-2xl mx-auto px-4 py-10">
        {children}
      </main>
    </div>
  )
}
