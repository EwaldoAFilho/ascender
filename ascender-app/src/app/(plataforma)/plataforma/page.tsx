import { PlataformaClient } from "@/components/plataforma/PlataformaClient";
import { listarTenantsAdmin, requirePlatformAdminPage } from "@/lib/auth/platform";
import { getPlanos } from "@/lib/plans";

export const dynamic = "force-dynamic";

// Painel do OPERADOR: administra todas as empresas (cross-tenant, FORA de
// withSessionTenant). O layout do grupo (plataforma) já exige operador; a checagem
// aqui é defesa em profundidade.
export default async function PlataformaPage() {
  await requirePlatformAdminPage();
  const [empresas, planos] = await Promise.all([
    listarTenantsAdmin(),
    getPlanos(),
  ]);
  return <PlataformaClient empresas={empresas} planos={planos} />;
}
