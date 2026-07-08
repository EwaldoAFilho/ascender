// Acesso às variáveis de ambiente com checagem preguiçosa (lazy), para não
// quebrar o build do Next (onde alguns segredos podem não estar presentes).
// As validações disparam apenas em runtime, quando a variável é de fato usada.

function required(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(
      `Variável de ambiente obrigatória ausente: ${name}. Verifique o .env.`,
    );
  }
  return value;
}

export const env = {
  // Runtime da app usa APP_DATABASE_URL (role restrita, sem BYPASSRLS → a RLS
  // por tenant vale); migrations/DDL usam DATABASE_URL (dono/superuser) via
  // drizzle.config.ts. Sem APP_DATABASE_URL, cai em DATABASE_URL.
  databaseUrl: () =>
    process.env.APP_DATABASE_URL?.trim() || required("DATABASE_URL"),
  encryptionKey: () => required("APP_ENCRYPTION_KEY"),
  sessionSecret: () => {
    const secret = required("SESSION_SECRET");
    if (secret.length < 32) {
      throw new Error("SESSION_SECRET deve ter ao menos 32 caracteres.");
    }
    return secret;
  },
  loginEmail: () => process.env.LOGIN_EMAIL?.trim() || "admin@ascender.com.br",
  loginPassword: () => process.env.LOGIN_PASSWORD ?? "",
  appBaseUrl: () => process.env.APP_BASE_URL?.trim() || "http://localhost:3000",
  isProd: () => process.env.NODE_ENV === "production",
  // Cookie `secure` apenas quando servindo via HTTPS (evita quebrar acesso por
  // HTTP em rede interna). Defina APP_BASE_URL=https://… em produção com TLS.
  cookieSecure: () =>
    (process.env.APP_BASE_URL?.trim() ?? "").startsWith("https://"),
};
