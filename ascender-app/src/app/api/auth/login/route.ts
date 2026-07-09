import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getTenantStatus,
  mensagemStatus,
  STATUS_COM_ACESSO,
  type TenantStatus,
} from "@/lib/auth/platform";
import { getSession } from "@/lib/auth/session";
import { getDefaultMembership, verifyLogin } from "@/lib/auth/users";

export const runtime = "nodejs";

const bodySchema = z.object({
  email: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const { email, password } = parsed.data;
  const user = await verifyLogin(email, password);
  if (!user) {
    return NextResponse.json(
      { error: "Credenciais inválidas." },
      { status: 401 },
    );
  }

  const session = await getSession();

  // OPERADOR da plataforma: não pertence a nenhuma empresa — começa no painel,
  // sem contexto de empresa (acessa uma empresa depois, via "Acessar", auditado).
  if (user.isPlatformAdmin) {
    session.authenticated = true;
    session.userId = user.id;
    session.email = user.email;
    session.loginAt = Date.now();
    session.isPlatformAdmin = true;
    session.impersonando = false;
    session.tenantId = undefined;
    session.role = undefined;
    await session.save();
    return NextResponse.json({ ok: true, redirect: "/plataforma" });
  }

  // Usuário de EMPRESA: escopa ao tenant do membership e checa o acesso pelo status.
  const membership = await getDefaultMembership(user.id);
  if (!membership) {
    return NextResponse.json(
      { error: "Sua conta não está vinculada a nenhuma empresa." },
      { status: 403 },
    );
  }
  const status = await getTenantStatus(membership.tenantId);
  if (status && !STATUS_COM_ACESSO.includes(status as TenantStatus)) {
    return NextResponse.json({ error: mensagemStatus(status) }, { status: 403 });
  }

  session.authenticated = true;
  session.userId = user.id;
  session.email = user.email;
  session.loginAt = Date.now();
  session.isPlatformAdmin = false;
  session.impersonando = false;
  session.tenantId = membership.tenantId;
  session.role = membership.role;
  await session.save();

  return NextResponse.json({ ok: true });
}
