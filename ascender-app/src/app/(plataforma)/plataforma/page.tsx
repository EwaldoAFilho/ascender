import { PlataformaClient } from "@/components/plataforma/PlataformaClient";
import { listarTenantsAdmin, requirePlatformAdminPage } from "@/lib/auth/platform";

export const dynamic = "force-dynamic";

// Painel do OPERADOR: administra todas as empresas (cross-tenant, FORA de
// withSessionTenant). O layout do grupo (plataforma) já exige operador; a checagem
// aqui é defesa em profundidade.
export default async function PlataformaPage() {
  await requirePlatformAdminPage();
  const empresas = await listarTenantsAdmin();
  return <PlataformaClient empresas={empresas} />;
}
