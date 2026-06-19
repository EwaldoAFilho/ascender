import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { setUserPassword, verifyUserPassword } from "@/lib/auth/users";

export const runtime = "nodejs";

const bodySchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

export async function PUT(request: Request) {
  const session = await getSession();
  if (!session.authenticated || !session.userId) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "A nova senha deve ter ao menos 8 caracteres." },
      { status: 400 },
    );
  }

  const currentOk = await verifyUserPassword(
    session.userId,
    parsed.data.currentPassword,
  );
  if (!currentOk) {
    return NextResponse.json(
      { error: "Senha atual incorreta." },
      { status: 400 },
    );
  }

  await setUserPassword(session.userId, parsed.data.newPassword);
  return NextResponse.json({ ok: true });
}
