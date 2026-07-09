import "dotenv/config";
import { hash } from "@node-rs/argon2";
import { eq, sql } from "drizzle-orm";
import { getDb } from "./index";
import { TENANT0_ID, tenantMemberships, tenants, usuarios } from "./schema";

// Seed idempotente: garante o "tenant 0" (instância atual — Ascender), o usuário
// administrador inicial e os vínculos usuário↔tenant. Roda em todo boot.
async function main() {
  const db = getDb();
  const email = (
    process.env.LOGIN_EMAIL?.trim() || "admin@ascender.com.br"
  ).toLowerCase();
  const password = process.env.LOGIN_PASSWORD;

  // 1) Tenant 0 (a Ascender). Idempotente.
  await db
    .insert(tenants)
    .values({ id: TENANT0_ID, nome: "Ascender", slug: "ascender", status: "ativo" })
    .onConflictDoNothing();

  // 2) Admin inicial — só se ainda NÃO houver nenhum usuário.
  const [{ n }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(usuarios);
  if (n === 0) {
    if (!password) {
      console.warn(
        "[seed] LOGIN_PASSWORD não definido — admin não criado. Defina e rode novamente.",
      );
    } else {
      const senhaHash = await hash(password);
      await db.insert(usuarios).values({ nome: "Administrador", email, senhaHash, ativo: true });
      console.log(`[seed] Usuário administrador criado: ${email}.`);
    }
  } else {
    console.log(`[seed] Já existem ${n} usuário(s) — seed do admin pulado.`);
  }

  // 3) O admin (LOGIN_EMAIL) é OPERADOR da PLATAFORMA (staff Ascender) — administra
  //    todas as empresas no painel /plataforma. Idempotente.
  await db
    .update(usuarios)
    .set({ isPlatformAdmin: true, updatedAt: new Date() })
    .where(eq(usuarios.email, email));

  // 4) Operador NÃO pertence a nenhuma empresa: remove eventuais memberships (ele
  //    acessa uma empresa via "Acessar", com auditoria). Assim o login do operador
  //    cai no painel, não no app de uma empresa.
  const operadores = await db
    .select({ id: usuarios.id })
    .from(usuarios)
    .where(eq(usuarios.isPlatformAdmin, true));
  for (const op of operadores) {
    await db.delete(tenantMemberships).where(eq(tenantMemberships.userId, op.id));
  }

  // 5) Usuários de EMPRESA (não-operadores) ficam vinculados ao tenant 0 (Ascender),
  //    idempotente. onConflictDoNothing preserva papéis já ajustados na app.
  const membros = await db
    .select({ id: usuarios.id })
    .from(usuarios)
    .where(eq(usuarios.isPlatformAdmin, false));
  for (const u of membros) {
    await db
      .insert(tenantMemberships)
      .values({ tenantId: TENANT0_ID, userId: u.id, role: "operador" })
      .onConflictDoNothing();
  }
  console.log(
    `[seed] Operador(es): ${operadores.length}; membro(s) do tenant 0: ${membros.length}.`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("[seed] Falhou:", error);
    process.exit(1);
  });
