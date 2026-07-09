import "server-only";
import { redirect } from "next/navigation";
import { asc, eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  TENANT0_ID,
  tenantMemberships,
  tenants,
  usinas,
  usuarios,
} from "@/lib/db/schema";
import { getSession } from "./session";
import { criarMembro } from "./users";

// Ciclo de vida do tenant (assinatura). Controla o ACESSO no login.
export const TENANT_STATUSES = [
  "pendente",
  "trial",
  "ativo",
  "suspenso",
  "cancelado",
] as const;
export type TenantStatus = (typeof TENANT_STATUSES)[number];

// Status que PERMITEM login/acesso à aplicação.
export const STATUS_COM_ACESSO: TenantStatus[] = ["trial", "ativo"];

/** Mensagem amigável de bloqueio de acesso por status (para a tela de login). */
export function mensagemStatus(status: string): string {
  switch (status) {
    case "pendente":
      return "Seu cadastro está aguardando aprovação. Você será avisado quando for liberado.";
    case "suspenso":
      return "Acesso suspenso. Entre em contato com o suporte da Ascender.";
    case "cancelado":
      return "Esta conta foi cancelada.";
    default:
      return "Acesso indisponível no momento.";
  }
}

/** O usuário da sessão é operador da PLATAFORMA? Revalida no banco a cada request. */
export async function isPlatformAdmin(): Promise<boolean> {
  const session = await getSession();
  if (!session.userId) return false;
  const rows = await getDb()
    .select({ v: usuarios.isPlatformAdmin })
    .from(usuarios)
    .where(eq(usuarios.id, session.userId));
  return rows[0]?.v === true;
}

/** Gate para SERVER ACTIONS do operador. null se ok, senão ActionResult de erro. */
export async function requirePlatformAdmin(): Promise<
  { ok: false; error: string } | null
> {
  if (!(await isPlatformAdmin())) {
    return { ok: false, error: "Ação restrita ao operador da plataforma." };
  }
  return null;
}

/** Gate para PÁGINAS do operador: redireciona para / se não for admin de plataforma. */
export async function requirePlatformAdminPage(): Promise<void> {
  if (!(await isPlatformAdmin())) redirect("/");
}

export type TenantAdminRow = {
  id: string;
  nome: string;
  slug: string;
  status: string;
  plano: string;
  criadoEm: string;
  usuarios: number;
  usinas: number;
  ehTenant0: boolean;
};

/**
 * Lista TODOS os tenants (cross-tenant) com contagens — para o painel do operador.
 * NÃO deve rodar dentro de `withSessionTenant`: sem GUC, a policy de RLS fica
 * permissiva e as contagens de `usinas` (tabela com RLS) enxergam todos os tenants.
 */
export async function listarTenantsAdmin(): Promise<TenantAdminRow[]> {
  const db = getDb();
  const base = await db
    .select({
      id: tenants.id,
      nome: tenants.nome,
      slug: tenants.slug,
      status: tenants.status,
      plano: tenants.plano,
      criadoEm: tenants.createdAt,
    })
    .from(tenants)
    .orderBy(asc(tenants.createdAt));

  const usuariosPorTenant = new Map<string, number>();
  for (const r of await db
    .select({
      tenantId: tenantMemberships.tenantId,
      n: sql<number>`count(*)::int`,
    })
    .from(tenantMemberships)
    .groupBy(tenantMemberships.tenantId)) {
    usuariosPorTenant.set(r.tenantId, r.n);
  }

  const usinasPorTenant = new Map<string, number>();
  for (const r of await db
    .select({ tenantId: usinas.tenantId, n: sql<number>`count(*)::int` })
    .from(usinas)
    .groupBy(usinas.tenantId)) {
    usinasPorTenant.set(r.tenantId, r.n);
  }

  return base.map((t) => ({
    id: t.id,
    nome: t.nome,
    slug: t.slug,
    status: t.status,
    plano: t.plano,
    criadoEm: t.criadoEm.toISOString(),
    usuarios: usuariosPorTenant.get(t.id) ?? 0,
    usinas: usinasPorTenant.get(t.id) ?? 0,
    ehTenant0: t.id === TENANT0_ID,
  }));
}

/** Status atual de um tenant (o login usa para checar acesso). */
export async function getTenantStatus(tenantId: string): Promise<string | null> {
  const rows = await getDb()
    .select({ status: tenants.status })
    .from(tenants)
    .where(eq(tenants.id, tenantId));
  return rows[0]?.status ?? null;
}

// ===== Mutações (chamadas pelas server actions, que já aplicam o guard) =====

function slugify(s: string): string {
  const base = s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "") // remove acentos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
  return base || "empresa";
}

async function slugUnico(nome: string): Promise<string> {
  const base = slugify(nome);
  const existentes = new Set(
    (await getDb().select({ slug: tenants.slug }).from(tenants)).map((r) => r.slug),
  );
  if (!existentes.has(base)) return base;
  for (let i = 2; i < 1000; i++) {
    if (!existentes.has(`${base}-${i}`)) return `${base}-${i}`;
  }
  return `${base}-${Date.now()}`;
}

/** Cria uma empresa (tenant) + usuário dono (owner). Retorna o id do tenant. */
export async function criarEmpresaComDono(input: {
  nomeEmpresa: string;
  status: TenantStatus;
  donoNome: string;
  donoEmail: string;
  donoSenha: string;
}): Promise<string> {
  const slug = await slugUnico(input.nomeEmpresa);
  const [t] = await getDb()
    .insert(tenants)
    .values({ nome: input.nomeEmpresa.trim(), slug, status: input.status })
    .returning({ id: tenants.id });
  // Reusa criarMembro (faz o hash da senha e vincula com papel).
  await criarMembro(t.id, {
    nome: input.donoNome,
    email: input.donoEmail,
    senha: input.donoSenha,
    ativo: true,
    role: "owner",
  });
  return t.id;
}

/** Muda o status de um tenant (aprovar/ativar/suspender/cancelar). */
export async function mudarStatusTenant(
  tenantId: string,
  status: TenantStatus,
): Promise<void> {
  await getDb()
    .update(tenants)
    .set({ status, updatedAt: new Date() })
    .where(eq(tenants.id, tenantId));
}
