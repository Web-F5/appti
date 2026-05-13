// src/types/next-auth.d.ts
// Extends NextAuth's built-in types to include our custom session fields.

import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id:           string
      businessId:   string
      businessSlug: string
      businessName: string
      timezone:     string
      role:         string
    } & DefaultSession['user']
  }
}
