// src/app/(marketing)/layout.tsx
import Link from 'next/link'

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? 'Appti'

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', background: '#F5F3FB', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Nav */}
      <nav style={{ background: '#2D1B69', borderBottom: '0.5px solid rgba(255,255,255,0.08)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <img src="/logo.png" alt="Appti" style={{ height: 32, width: 'auto' }} />
            <span style={{ fontWeight: 700, fontSize: 17, color: 'white' }}>{APP_NAME}</span>
          </Link>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Link href="/help" style={{ padding: '7px 14px', borderRadius: 8, fontSize: 13, color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>Help</Link>
            <Link href="/login" style={{ padding: '7px 14px', borderRadius: 8, fontSize: 13, color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>Sign in</Link>
            <Link href="/register" style={{ padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: '#E8845A', color: 'white', textDecoration: 'none' }}>Get started</Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main style={{ flex: 1 }}>
        {children}
      </main>

      {/* Footer */}
      <footer style={{ background: '#1A1035', padding: '32px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <span style={{ fontWeight: 700, color: 'white', fontSize: 14 }}>{APP_NAME}</span>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {[
              { label: 'Privacy Policy', href: '/privacy' },
              { label: 'Terms of Service', href: '/terms' },
              { label: 'Help', href: '/help' },
              { label: 'Contact', href: '/contact' },
            ].map(l => (
              <Link key={l.href} href={l.href} style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', textDecoration: 'none' }}>{l.label}</Link>
            ))}
          </div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', margin: 0 }}>© 2026 {APP_NAME}</p>
        </div>
      </footer>
    </div>
  )
}
