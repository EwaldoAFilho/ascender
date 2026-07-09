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

  // Escopa a sessão ao tenant do usuário (membership padrão) e checa o ACESSO
  // pelo status da empresa. O operador da plataforma (staff Ascender) nunca é
  // bloqueado por status (precisa entrar para administrar a plataforma).
  const membership = await getDefaultMembership(user.id);
  if (membership && !user.isPlatformAdmin) {
    const status = await getTenantStatus(membership.tenantId);
    if (status && !STATUS_COM_ACESSO.includes(status as TenantStatus)) {
      return NextResponse.json({ error: mensagemStatus(status) }, { status: 403 });
    }
  }

  const session = await getSession();
  session.authenticated = true;
  session.userId = user.id;
  session.email = user.email;
  session.loginAt = Date.now();
  session.isPlatformAdmin = user.isPlatformAdmin;
  if (membership) {
    session.tenantId = membership.tenantId;
    session.role = membership.role;
  }
  await session.save();

  return NextResponse.json({ ok: true });
}
