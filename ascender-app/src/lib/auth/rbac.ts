import { NextResponse } from "next/server";
import { getDefaultMembership } from "./users";
import { getSession } from "./session";

// Papéis por tenant (hierarquia). owner > admin > operador > leitura.
export type Role = "owner" | "admin" | "operador" | "leitura";
export const ROLES: Role[] = ["owner", "admin", "operador", "leitura"];
const RANK: Record<Role, number> = { owner: 3, admin: 2, operador: 1, leitura: 0 };

function isRole(v: unknown): v is Role {
  return typeof v === "string" && v in RANK;
}

/**
 * Papel do usuário no tenant ativo. Usa `session.role` (populado no login) e, se
 * ausente (cookies antigos), deriva do membership no banco. Sem membership →
 * "leitura" (acesso mínimo).
 */
export async function getSessionRole(): Promise<Role> {
  const session = await getSession();
  if (isRole(session.role)) return session.role;
  if (session.userId) {
    const m = await getDefaultMembership(session.userId);
    if (m && isRole(m.role)) return m.role;
  }
  return "leitura";
}

export function roleAtLeast(role: Role, min: Role): boolean {
  return RANK[role] >= RANK[min];
}

/**
 * Gate de papel para SERVER ACTIONS. Retorna `null` se o usuário tem papel >= min;
 * senão um ActionResult de erro (para `if (deny) return deny;`).
 */
export async function requireRole(
  min: Role,
): Promise<{ ok: false; error: string } | null> {
  const role = await getSessionRole();
  if (!roleAtLeast(role, min)) {
    return { ok: false, error: "Você não tem permissão para esta ação." };
  }
  return null;
}

/** Gate de papel para ROUTE HANDLERS. Retorna 403 se o papel < min, senão null. */
export async function requireRoleResponse(min: Role): Promise<NextResponse | null> {
  const role = await getSessionRole();
  if (!roleAtLeast(role, min)) {
    return NextResponse.json({ error: "Sem permissão para esta ação." }, { status: 403 });
  }
  return null;
}
