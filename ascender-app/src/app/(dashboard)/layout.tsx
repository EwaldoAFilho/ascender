import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { getSession } from "@/lib/auth/session";

// Layout do APP SOLAR (empresa). Guarda server-side: um operador da plataforma só
// entra aqui quando está "acessando" uma empresa (impersonando); sem empresa
// ativa, vai para o painel. Usuários de empresa têm sempre `tenantId`.
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (session.isPlatformAdmin && !session.tenantId) {
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
