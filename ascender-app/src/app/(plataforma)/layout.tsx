import { requirePlatformAdminPage } from "@/lib/auth/platform";
import { PlataformaShell } from "@/components/plataforma/PlataformaShell";

// Grupo de rotas do OPERADOR da plataforma — separado do app solar. Guarda
// server-side: só operador entra (senão redireciona para "/").
export default async function PlataformaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePlatformAdminPage();
  return <PlataformaShell>{children}</PlataformaShell>;
}
