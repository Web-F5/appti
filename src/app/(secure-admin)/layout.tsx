// src/app/(secure-admin)/layout.tsx
// Route group layout for the secure admin panel.
// Keeps admin routes isolated from the main dashboard layout.

export const metadata = {
  robots: { index: false, follow: false },
}

export default function SecureAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#0F0A1E', minHeight: '100vh' }}>
      {children}
    </div>
  )
}