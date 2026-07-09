import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

// Payload já modelado para evoluir a multiusuário/RBAC sem trocar o mecanismo.
export type SessionData = {
  authenticated: boolean;
  email?: string;
  loginAt?: number;
  userId?: string;
  // Multi-tenancy: tenant ativo da sessão + papel do usuário nesse tenant.
  // Populados no login a partir de `tenant_memberships`. A autorização real é
  // sempre revalidada no servidor (a sessão não é fonte de verdade).
  tenantId?: string;
  role?: string;
  // Operador da plataforma (staff Ascender). Conveniência para a UI; o guard
  // (requirePlatformAdmin) sempre revalida no banco.
  isPlatformAdmin?: boolean;
  roles?: string[]; // legado — não usado
};

export const SESSION_COOKIE = "ascender_session";

function sessionOptions(): SessionOptions {
  return {
    password: env.sessionSecret(),
    cookieName: SESSION_COOKIE,
    cookieOptions: {
      httpOnly: true,
      secure: env.cookieSecure(),
      sameSite: "lax",
      maxAge: 60 * 60 * 8, // 8 horas
      path: "/",
    },
  };
}

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions());
}
