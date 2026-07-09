import "dotenv/config";
import { hash } from "@node-rs/argon2";
import { eq, sql } from "drizzle-orm";
import { getDb } from "./index";
import {
  TENANT0_ID,
  planos,
  tenantMemberships,
  tenants,
  usuarios,
} from "./schema";

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

  // 6) Planos de assinatura (idempotente). Faixas do doc de precificação; preços em
  //    centavos. `interno` = ilimitado (Ascender). A Ascender (tenant 0) fica no interno.
  const PLANOS = [
    { slug: "interno", nome: "Interno (Ascender)", maxUsinas: null, maxUsuarios: null, precoMensalCentavos: 0, ordem: 0 },
    { slug: "starter", nome: "Starter", maxUsinas: 15, maxUsuarios: 5, precoMensalCentavos: 49700, ordem: 1 },
    { slug: "pro", nome: "Pro", maxUsinas: 50, maxUsuarios: 15, precoMensalCentavos: 129700, ordem: 2 },
    { slug: "enterprise", nome: "Enterprise", maxUsinas: 150, maxUsuarios: null, precoMensalCentavos: 299700, ordem: 3 },
  ];
  for (const p of PLANOS) {
    await db
      .insert(planos)
      .values(p)
      .onConflictDoUpdate({
        target: planos.slug,
        set: {
          nome: p.nome,
          maxUsinas: p.maxUsinas,
          maxUsuarios: p.maxUsuarios,
          precoMensalCentavos: p.precoMensalCentavos,
          ordem: p.ordem,
          updatedAt: new Date(),
        },
      });
  }
  await db
    .update(tenants)
    .set({ plano: "interno", updatedAt: new Date() })
    .where(eq(tenants.id, TENANT0_ID));
  console.log(`[seed] ${PLANOS.length} plano(s) garantidos; tenant 0 no plano interno.`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("[seed] Falhou:", error);
    process.exit(1);
  });
