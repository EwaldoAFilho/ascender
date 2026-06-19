import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

// Payload já modelado para evoluir a multiusuário/RBAC sem trocar o mecanismo.
export type SessionData = {
  authenticated: boolean;
  email?: string;
  loginAt?: number;
  userId?: string;
  roles?: string[];
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
