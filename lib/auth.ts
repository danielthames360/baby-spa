import { NextAuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  providers: [
    // Provider para Staff (Admin, Reception, Therapist)
    CredentialsProvider({
      id: "staff-credentials",
      name: "Staff Login",
      credentials: {
        username: { label: "Usuario", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error("Usuario y contraseña son requeridos");
        }

        const user = await prisma.user.findUnique({
          where: { username: credentials.username },
        });

        if (!user) {
          throw new Error("Credenciales inválidas");
        }

        if (!user.isActive) {
          throw new Error("Usuario desactivado");
        }

        const isValidPassword = await compare(
          credentials.password,
          user.passwordHash
        );

        if (!isValidPassword) {
          throw new Error("Credenciales inválidas");
        }

        // Actualizar último login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          email: user.email || "",
          name: user.name,
          role: user.role,
          mustChangePassword: user.mustChangePassword,
        };
      },
    }),

    // Provider para Portal Padres (código de acceso BSB-XXXXX)
    CredentialsProvider({
      id: "parent-credentials",
      name: "Portal Padres",
      credentials: {
        accessCode: { label: "Código de acceso", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.accessCode) {
          throw new Error("Código de acceso requerido");
        }

        const accessCode = credentials.accessCode.toUpperCase().trim();

        // Validar formato BSB-XXXXX
        if (!/^BSB-[A-Z0-9]{5}$/.test(accessCode)) {
          throw new Error("Formato de código inválido");
        }

        const parent = await prisma.parent.findUnique({
          where: { accessCode },
        });

        if (!parent) {
          throw new Error("Código de acceso inválido");
        }

        return {
          id: parent.id,
          email: parent.email || "",
          name: parent.name,
          role: "PARENT" as const,
          parentId: parent.id,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
        token.mustChangePassword = user.mustChangePassword;
        if (user.parentId) {
          token.parentId = user.parentId;
        }
      }

      // Cuando se actualiza la sesión, re-verificar mustChangePassword desde la BD
      if (trigger === "update" && token.id && token.role !== "PARENT") {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { mustChangePassword: true },
        });
        if (dbUser) {
          token.mustChangePassword = dbUser.mustChangePassword;
        }
      }

      return token;
    },

    async session({ session, token }) {
      session.user = {
        id: token.id as string,
        email: token.email as string,
        name: token.name as string,
        role: token.role as "OWNER" | "ADMIN" | "RECEPTION" | "THERAPIST" | "PARENT",
        parentId: token.parentId as string | undefined,
        mustChangePassword: token.mustChangePassword as boolean | undefined,
      };
      return session;
    },

    async redirect({ url, baseUrl }) {
      // Permitir URLs relativas
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Permitir URLs del mismo origen
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 horas
  },

  // Unique cookie names to prevent conflicts with other NextAuth projects on localhost
  cookies: {
    sessionToken: {
      name: "babyspa.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    callbackUrl: {
      name: "babyspa.callback-url",
      options: {
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    csrfToken: {
      name: "babyspa.csrf-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};

// Helper para obtener sesión en server components/actions
export async function getSession() {
  return await getServerSession(authOptions);
}

export async function requireAuth() {
  const session = await getSession();
  if (!session?.user) {
    throw new Error("No autorizado");
  }
  return session;
}

export async function requireRole(allowedRoles: string[]) {
  const session = await requireAuth();
  if (!allowedRoles.includes(session.user.role)) {
    throw new Error("Acceso denegado");
  }
  return session;
}

export async function requireStaff() {
  return requireRole(["OWNER", "ADMIN", "RECEPTION", "THERAPIST"]);
}

export async function requireAdmin() {
  return requireRole(["OWNER", "ADMIN"]);
}

export async function requireOwner() {
  return requireRole(["OWNER"]);
}

export async function requireParent() {
  return requireRole(["PARENT"]);
}
