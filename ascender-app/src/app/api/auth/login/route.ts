import { NextResponse } from "next/server";
import { z } from "zod";
import { getLoginEmail, verifyPassword } from "@/lib/auth/password";
import { getSession } from "@/lib/auth/session";

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
  const expectedEmail = await getLoginEmail();
  const emailOk = expectedEmail
    ? email.trim().toLowerCase() === expectedEmail.toLowerCase()
    : true;
  const passwordOk = await verifyPassword(password);

  if (!emailOk || !passwordOk) {
    return NextResponse.json(
      { error: "Credenciais inválidas." },
      { status: 401 },
    );
  }

  const session = await getSession();
  session.authenticated = true;
  session.email = expectedEmail ?? email;
  session.loginAt = Date.now();
  await session.save();

  return NextResponse.json({ ok: true });
}
