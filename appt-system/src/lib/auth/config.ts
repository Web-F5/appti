// src/lib/auth/config.ts
// NextAuth v4 configuration.
// Uses credentials provider (email + password) with bcrypt verification.

import { type NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma/client'

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  pages: {
    signIn:  '/login',
    error:   '/login',
  },

  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email:    { label: 'Email',    type: 'email'    },
        password: { label: 'Password', type: 'password' },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
          include: {
            business: {
              select: { id: true, slug: true, name: true, timezone: true },
            },
          },
        })

        if (!user) return null

        const passwordValid = await bcrypt.compare(
          credentials.password,
          user.hashedPassword
        )

        if (!passwordValid) return null

        return {
          id:           user.id,
          email:        user.email,
          name:         user.name,
          businessId:   user.business?.id   ?? null,
          businessSlug: user.business?.slug ?? null,
          businessName: user.business?.name ?? null,
          timezone:     user.business?.timezone ?? 'Australia/Melbourne',
          role:         user.role,
        }
      },
    }),
  ],

  callbacks: {
    // Persist business info into the JWT token
    async jwt({ token, user }) {
      if (user) {
        token.id           = user.id
        token.businessId   = (user as any).businessId
        token.businessSlug = (user as any).businessSlug
        token.businessName = (user as any).businessName
        token.timezone     = (user as any).timezone
        token.role         = (user as any).role
      }
      return token
    },

    // Expose token fields on the session object
    async session({ session, token }) {
      if (token) {
        session.user.id           = token.id as string
        session.user.businessId   = token.businessId as string
        session.user.businessSlug = token.businessSlug as string
        session.user.businessName = token.businessName as string
        session.user.timezone     = token.timezone as string
        session.user.role         = token.role as string
      }
      return session
    },
  },
}
