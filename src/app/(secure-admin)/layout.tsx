// src/app/(secure-admin)/layout.tsx
// Completely separate layout for the admin panel.
// No shared auth with the main app — uses its own env-var credentials.
// URL is not linked anywhere in the app — security by obscurity + credentials.

export default function SecureAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="robots" content="noindex, nofollow" />
        <title>Admin</title>
      </head>
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#0F0A1E' }}>
        {children}
      </body>
    </html>
  )
}
