import "dotenv/config";
import { hash } from "@node-rs/argon2";
import { sql } from "drizzle-orm";
import { getDb } from "./index";
import { usuarios } from "./schema";

// Seed idempotente do usuário administrador inicial.
// Cria o admin a partir de LOGIN_EMAIL/LOGIN_PASSWORD apenas se ainda NÃO houver
// nenhum usuário cadastrado (não sobrescreve usuários/senhas geridos na app).
async function main() {
  const db = getDb();
  const email = (
    process.env.LOGIN_EMAIL?.trim() || "admin@ascender.com.br"
  ).toLowerCase();
  const password = process.env.LOGIN_PASSWORD;

  const [{ n }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(usuarios);

  if (n > 0) {
    console.log(`[seed] Já existem ${n} usuário(s) — seed do admin pulado.`);
    return;
  }

  if (!password) {
    console.warn(
      "[seed] LOGIN_PASSWORD não definido — admin não criado. Defina e rode novamente.",
    );
    return;
  }

  const senhaHash = await hash(password);
  await db.insert(usuarios).values({
    nome: "Administrador",
    email,
    senhaHash,
    ativo: true,
  });
  console.log(`[seed] Usuário administrador criado: ${email}.`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("[seed] Falhou:", error);
    process.exit(1);
  });
