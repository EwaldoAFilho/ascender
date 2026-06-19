import "dotenv/config";
import { hash } from "@node-rs/argon2";
import { eq } from "drizzle-orm";
import { getDb } from "./index";
import { appSettings } from "./schema";

// Seed idempotente do login único compartilhado.
// - login_email: sempre sincronizado com LOGIN_EMAIL.
// - login_password_hash: criado apenas se ainda não existir (não sobrescreve
//   uma senha trocada depois pela aplicação).
async function main() {
  const db = getDb();
  const email = process.env.LOGIN_EMAIL?.trim() || "admin@ascender.com.br";
  const password = process.env.LOGIN_PASSWORD;

  await db
    .insert(appSettings)
    .values({ key: "login_email", value: email })
    .onConflictDoUpdate({
      target: appSettings.key,
      set: { value: email, updatedAt: new Date() },
    });

  const existing = await db
    .select()
    .from(appSettings)
    .where(eq(appSettings.key, "login_password_hash"));

  if (existing.length > 0) {
    console.log("[seed] Hash de senha já existe — mantido.");
    return;
  }

  if (!password) {
    console.warn(
      "[seed] LOGIN_PASSWORD não definido — senha não criada. Defina e rode novamente.",
    );
    return;
  }

  const passwordHash = await hash(password);
  await db
    .insert(appSettings)
    .values({ key: "login_password_hash", value: passwordHash });
  console.log(`[seed] Login criado para ${email}.`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("[seed] Falhou:", error);
    process.exit(1);
  });
