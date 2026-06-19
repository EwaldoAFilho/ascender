import { NextResponse } from "next/server";
import { z } from "zod";
import { setPassword, verifyPassword } from "@/lib/auth/password";
import { getSession } from "@/lib/auth/session";

export const runtime = "nodejs";

const bodySchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

export async function PUT(request: Request) {
  const session = await getSession();
  if (!session.authenticated) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "A nova senha deve ter ao menos 8 caracteres." },
      { status: 400 },
    );
  }

  const currentOk = await verifyPassword(parsed.data.currentPassword);
  if (!currentOk) {
    return NextResponse.json(
      { error: "Senha atual incorreta." },
      { status: 400 },
    );
  }

  await setPassword(parsed.data.newPassword);
  return NextResponse.json({ ok: true });
}
