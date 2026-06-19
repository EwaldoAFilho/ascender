import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth/guard";
import { testDigitalGridConnection } from "@/lib/digitalgrid/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z
  .object({ token: z.string().optional(), baseUrl: z.string().optional() })
  .nullable();

export async function POST(request: Request) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  const provided = parsed.success ? parsed.data : null;
  const result = await testDigitalGridConnection(
    provided?.token
      ? { token: provided.token, baseUrl: provided.baseUrl }
      : undefined,
  );
  return NextResponse.json(result);
}
