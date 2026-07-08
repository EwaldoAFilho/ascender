import "dotenv/config";
import { hash } from "@node-rs/argon2";
import { sql } from "drizzle-orm";
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

  // 3) Vincula todos os usuários ao tenant 0 (idempotente). O admin (LOGIN_EMAIL)
  //    vira `owner`; os demais, `operador`. onConflictDoNothing preserva papéis já
  //    ajustados na app.
  const users = await db.select({ id: usuarios.id, email: usuarios.email }).from(usuarios);
  for (const u of users) {
    await db
      .insert(tenantMemberships)
      .values({
        tenantId: TENANT0_ID,
        userId: u.id,
        role: u.email === email ? "owner" : "operador",
      })
      .onConflictDoNothing();
  }
  console.log(`[seed] Tenant 0 + ${users.length} membership(s) garantidos.`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("[seed] Falhou:", error);
    process.exit(1);
  });
