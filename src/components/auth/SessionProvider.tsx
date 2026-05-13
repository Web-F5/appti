'use client'
// src/components/auth/SessionProvider.tsx
// Wraps the app with NextAuth's SessionProvider so client components
// can access the session via useSession().

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react'

export default function SessionProvider({ children }: { children: React.ReactNode }) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>
}
