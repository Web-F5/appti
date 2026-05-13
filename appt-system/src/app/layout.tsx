// src/app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'
import SessionProvider from '@/components/auth/SessionProvider'

export const metadata: Metadata = {
  title: {
    default: process.env.NEXT_PUBLIC_APP_NAME ?? 'Appti',
    template: `%s | ${process.env.NEXT_PUBLIC_APP_NAME ?? 'Appti'}`,
  },
  description: 'Online appointment booking with SMS and email reminders.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}
