import "server-only";
import { eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { planos, tenantMemberships, tenants, usinas } from "@/lib/db/schema";

export type Plano = {
  slug: string;
  nome: string;
  maxUsinas: number | null;
  maxUsuarios: number | null;
  precoMensalCentavos: number;
  ordem: number;
};

const colunas = {
  slug: planos.slug,
  nome: planos.nome,
  maxUsinas: planos.maxUsinas,
  maxUsuarios: planos.maxUsuarios,
  precoMensalCentavos: planos.precoMensalCentavos,
  ordem: planos.ordem,
};

/** Planos ativos, ordenados (para o seletor do operador). */
export async function getPlanos(): Promise<Plano[]> {
  return getDb()
    .select(colunas)
    .from(planos)
    .where(eq(planos.ativo, true))
    .orderBy(planos.ordem);
}

export async function getPlano(slug: string): Promise<Plano | null> {
  const rows = await getDb()
    .select(colunas)
    .from(planos)
    .where(eq(planos.slug, slug));
  return rows[0] ?? null;
}

export type QuotaUsinas = {
  planoSlug: string;
  planoNome: string | null;
  limite: number | null; // null = ilimitado (ou plano desconhecido = fail-open)
  usadas: number;
  excedente: number; // max(0, usadas - limite)
  temEspaco: boolean; // pode adicionar ao menos +1 usina?
};

/**
 * Quota de usinas de um tenant. Usa `tenantId` EXPLÍCITO (independe de contexto).
 * Plano desconhecido / sem `max_usinas` → sem limite (fail-open: não bloqueia).
 */
export async function quotaUsinas(tenantId: string): Promise<QuotaUsinas> {
  const [tRow] = await getDb()
    .select({ planoSlug: tenants.plano })
    .from(tenants)
    .where(eq(tenants.id, tenantId));
  const planoSlug = tRow?.planoSlug ?? "";
  const plano = planoSlug ? await getPlano(planoSlug) : null;
  const limite = plano?.maxUsinas ?? null;

  const [uRow] = await getDb()
    .select({ usadas: sql<number>`count(*)::int` })
    .from(usinas)
    .where(eq(usinas.tenantId, tenantId));
  const usadas = uRow?.usadas ?? 0;

  const excedente = limite == null ? 0 : Math.max(0, usadas - limite);
  return {
    planoSlug,
    planoNome: plano?.nome ?? null,
    limite,
    usadas,
    excedente,
    temEspaco: limite == null || usadas < limite,
  };
}

export type QuotaUsuarios = {
  planoNome: string | null;
  limite: number | null;
  usadas: number;
  temEspaco: boolean;
};

/** Quota de usuários (memberships) de um tenant. `tenantId` explícito. */
export async function quotaUsuarios(tenantId: string): Promise<QuotaUsuarios> {
  const [tRow] = await getDb()
    .select({ planoSlug: tenants.plano })
    .from(tenants)
    .where(eq(tenants.id, tenantId));
  const planoSlug = tRow?.planoSlug ?? "";
  const plano = planoSlug ? await getPlano(planoSlug) : null;
  const limite = plano?.maxUsuarios ?? null;

  const [uRow] = await getDb()
    .select({ usadas: sql<number>`count(*)::int` })
    .from(tenantMemberships)
    .where(eq(tenantMemberships.tenantId, tenantId));
  const usadas = uRow?.usadas ?? 0;

  return {
    planoNome: plano?.nome ?? null,
    limite,
    usadas,
    temEspaco: limite == null || usadas < limite,
  };
}
