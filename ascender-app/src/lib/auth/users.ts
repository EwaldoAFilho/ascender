import { hash, verify } from "@node-rs/argon2";
import { and, asc, eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { tenantMemberships, usuarios, type Usuario } from "@/lib/db/schema";

const norm = (email: string) => email.trim().toLowerCase();

export type UsuarioPublico = {
  id: string;
  nome: string;
  email: string;
  ativo: boolean;
};

function publico(u: Usuario): UsuarioPublico {
  return { id: u.id, nome: u.nome, email: u.email, ativo: u.ativo };
}

/** Valida e-mail + senha contra a tabela de usuários (somente ativos). */
export async function verifyLogin(
  email: string,
  password: string,
): Promise<UsuarioPublico | null> {
  const rows = await getDb()
    .select()
    .from(usuarios)
    .where(eq(usuarios.email, norm(email)));
  const u = rows[0];
  if (!u || !u.ativo) return null;
  try {
    if (await verify(u.senhaHash, password)) return publico(u);
  } catch {
    /* hash inválido */
  }
  return null;
}

/** Membership padrão (1º tenant) do usuário — usado no login para escopar a sessão. */
export async function getDefaultMembership(
  userId: string,
): Promise<{ tenantId: string; role: string } | null> {
  const rows = await getDb()
    .select({ tenantId: tenantMemberships.tenantId, role: tenantMemberships.role })
    .from(tenantMemberships)
    .where(eq(tenantMemberships.userId, userId))
    .orderBy(asc(tenantMemberships.createdAt))
    .limit(1);
  return rows[0] ?? null;
}

export async function getUsuario(id: string): Promise<Usuario | null> {
  const rows = await getDb().select().from(usuarios).where(eq(usuarios.id, id));
  return rows[0] ?? null;
}

export async function verifyUserPassword(
  id: string,
  password: string,
): Promise<boolean> {
  const u = await getUsuario(id);
  if (!u) return false;
  try {
    return await verify(u.senhaHash, password);
  } catch {
    return false;
  }
}

export async function setUserPassword(id: string, password: string): Promise<void> {
  const senhaHash = await hash(password);
  await getDb()
    .update(usuarios)
    .set({ senhaHash, updatedAt: new Date() })
    .where(eq(usuarios.id, id));
}

export async function listUsuarios(): Promise<UsuarioPublico[]> {
  const rows = await getDb().select().from(usuarios).orderBy(asc(usuarios.nome));
  return rows.map(publico);
}

export async function emailEmUso(email: string, ignoreId?: string): Promise<boolean> {
  const rows = await getDb()
    .select({ id: usuarios.id })
    .from(usuarios)
    .where(eq(usuarios.email, norm(email)));
  return rows.some((r) => r.id !== ignoreId);
}

export async function countAtivos(): Promise<number> {
  const rows = await getDb()
    .select({ n: sql<number>`count(*)::int` })
    .from(usuarios)
    .where(eq(usuarios.ativo, true));
  return rows[0]?.n ?? 0;
}

export async function createUsuario(input: {
  nome: string;
  email: string;
  senha: string;
  ativo: boolean;
}): Promise<void> {
  const senhaHash = await hash(input.senha);
  await getDb().insert(usuarios).values({
    nome: input.nome.trim(),
    email: norm(input.email),
    senhaHash,
    ativo: input.ativo,
  });
}

export async function updateUsuario(
  id: string,
  input: { nome: string; email: string; ativo: boolean; senha?: string },
): Promise<void> {
  const set: Partial<Usuario> = {
    nome: input.nome.trim(),
    email: norm(input.email),
    ativo: input.ativo,
    updatedAt: new Date(),
  };
  if (input.senha && input.senha.trim()) {
    set.senhaHash = await hash(input.senha.trim());
  }
  await getDb().update(usuarios).set(set).where(eq(usuarios.id, id));
}

export async function deleteUsuario(id: string): Promise<void> {
  await getDb().delete(usuarios).where(eq(usuarios.id, id));
}

// ===== Membros do tenant (RBAC / multi-tenant) =====

export type Membro = UsuarioPublico & { role: string };

/** Usuários que são membros do tenant, com seu papel. */
export async function listMembros(tenantId: string): Promise<Membro[]> {
  return getDb()
    .select({
      id: usuarios.id,
      nome: usuarios.nome,
      email: usuarios.email,
      ativo: usuarios.ativo,
      role: tenantMemberships.role,
    })
    .from(tenantMemberships)
    .innerJoin(usuarios, eq(usuarios.id, tenantMemberships.userId))
    .where(eq(tenantMemberships.tenantId, tenantId))
    .orderBy(asc(usuarios.nome));
}

/** Papel do usuário nesse tenant (null se não for membro). */
export async function papelNoTenant(
  tenantId: string,
  userId: string,
): Promise<string | null> {
  const rows = await getDb()
    .select({ role: tenantMemberships.role })
    .from(tenantMemberships)
    .where(
      and(eq(tenantMemberships.tenantId, tenantId), eq(tenantMemberships.userId, userId)),
    );
  return rows[0]?.role ?? null;
}

export async function countMembrosAtivos(tenantId: string): Promise<number> {
  const rows = await getDb()
    .select({ n: sql<number>`count(*)::int` })
    .from(tenantMemberships)
    .innerJoin(usuarios, eq(usuarios.id, tenantMemberships.userId))
    .where(
      and(eq(tenantMemberships.tenantId, tenantId), eq(usuarios.ativo, true)),
    );
  return rows[0]?.n ?? 0;
}

/** Cria um usuário (identidade global) e o vincula ao tenant com um papel. */
export async function criarMembro(
  tenantId: string,
  input: { nome: string; email: string; senha: string; ativo: boolean; role: string },
): Promise<void> {
  const senhaHash = await hash(input.senha);
  const [u] = await getDb()
    .insert(usuarios)
    .values({ nome: input.nome.trim(), email: norm(input.email), senhaHash, ativo: input.ativo })
    .returning({ id: usuarios.id });
  await getDb()
    .insert(tenantMemberships)
    .values({ tenantId, userId: u.id, role: input.role })
    .onConflictDoNothing();
}

export async function atualizarMembro(
  tenantId: string,
  userId: string,
  input: { nome: string; email: string; ativo: boolean; senha?: string; role: string },
): Promise<void> {
  await updateUsuario(userId, {
    nome: input.nome,
    email: input.email,
    ativo: input.ativo,
    senha: input.senha,
  });
  await getDb()
    .update(tenantMemberships)
    .set({ role: input.role })
    .where(
      and(eq(tenantMemberships.tenantId, tenantId), eq(tenantMemberships.userId, userId)),
    );
}

/** Remove o vínculo com o tenant; se o usuário não pertence a mais nenhum, apaga-o. */
export async function removerMembro(tenantId: string, userId: string): Promise<void> {
  await getDb()
    .delete(tenantMemberships)
    .where(
      and(eq(tenantMemberships.tenantId, tenantId), eq(tenantMemberships.userId, userId)),
    );
  const [{ n }] = await getDb()
    .select({ n: sql<number>`count(*)::int` })
    .from(tenantMemberships)
    .where(eq(tenantMemberships.userId, userId));
  if (n === 0) await getDb().delete(usuarios).where(eq(usuarios.id, userId));
}
