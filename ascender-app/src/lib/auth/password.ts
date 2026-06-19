import { hash, verify } from "@node-rs/argon2";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { appSettings } from "@/lib/db/schema";

async function getSetting(key: string): Promise<string | null> {
  const rows = await getDb()
    .select()
    .from(appSettings)
    .where(eq(appSettings.key, key));
  return rows[0]?.value ?? null;
}

export async function getLoginEmail(): Promise<string | null> {
  return getSetting("login_email");
}

export async function getPasswordHash(): Promise<string | null> {
  return getSetting("login_password_hash");
}

export async function verifyPassword(password: string): Promise<boolean> {
  const stored = await getPasswordHash();
  if (!stored) return false;
  try {
    return await verify(stored, password);
  } catch {
    return false;
  }
}

export async function setPassword(password: string): Promise<void> {
  const passwordHash = await hash(password);
  await getDb()
    .insert(appSettings)
    .values({ key: "login_password_hash", value: passwordHash })
    .onConflictDoUpdate({
      target: appSettings.key,
      set: { value: passwordHash, updatedAt: new Date() },
    });
}
