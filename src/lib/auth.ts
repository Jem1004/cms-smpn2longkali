import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { authConfig } from "./auth.config"
import type { JWT } from "next-auth/jwt"
import type { Session } from "next-auth"

interface ExtendedToken extends JWT {
  role?: string
  isActive?: boolean
}

interface ExtendedSession extends Session {
  user: {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
    role?: string
    isActive?: boolean
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const email = credentials.email as string
        const password = credentials.password as string

        const user = await prisma.user.findUnique({
          where: { email },
        })

        if (!user || !user.isActive) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(password, user.password)
        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        const extToken = token as ExtendedToken
        extToken.role = (user as { role?: string }).role
        extToken.isActive = (user as { isActive?: boolean }).isActive
      }
      return token
    },
    async session({ session, token }) {
      const extToken = token as ExtendedToken
      if (extToken && session.user) {
        const extSession = session as ExtendedSession
        extSession.user.id = extToken.id as string
        extSession.user.role = extToken.role
        extSession.user.isActive = extToken.isActive
      }
      return session
    },
  },
})
