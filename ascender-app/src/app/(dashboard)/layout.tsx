import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { getSession } from "@/lib/auth/session";

// Layout do APP SOLAR (empresa). Guarda server-side: um operador da plataforma só
// entra aqui quando está IMPERSONANDO uma empresa (via "Acessar"). Checa
// `impersonando` (não só `tenantId`): uma sessão antiga do operador pode ter um
// `tenantId` legado sem `impersonando` — nesse meio-termo ele viraria "leitura"
// (sem membership) e não conseguiria mutar; mandamos ao painel para re-acessar.
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (session.isPlatformAdmin && !session.impersonando) {
    redirect("/plataforma");
  }
  return (
    <AppShell
      impersonando={Boolean(session.impersonando)}
      empresaNome={session.empresaNome}
    >
      {children}
    </AppShell>
  );
}
