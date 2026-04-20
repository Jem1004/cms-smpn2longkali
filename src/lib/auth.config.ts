import type { NextAuthConfig } from "next-auth"
import type { JWT } from "next-auth/jwt"
import type { Session, User } from "next-auth"
import Credentials from "next-auth/providers/credentials"

interface ExtendedUser extends User {
  role?: string
  isActive?: boolean
}

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

export const authConfig = {
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth: authState }) {
      return !!authState?.user
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as ExtendedUser).role
        token.isActive = (user as ExtendedUser).isActive
      }
      return token as ExtendedToken
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
} satisfies NextAuthConfig
