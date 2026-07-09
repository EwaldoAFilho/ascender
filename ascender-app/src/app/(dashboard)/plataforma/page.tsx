import { PlataformaClient } from "@/components/plataforma/PlataformaClient";
import { listarTenantsAdmin, requirePlatformAdminPage } from "@/lib/auth/platform";

export const dynamic = "force-dynamic";

// Painel do OPERADOR da plataforma (staff Ascender): administra todas as empresas
// (tenants). NÃO roda em withSessionTenant — precisa enxergar todos os tenants
// (cross-tenant). requirePlatformAdminPage redireciona quem não for operador.
export default async function PlataformaPage() {
  await requirePlatformAdminPage();
  const empresas = await listarTenantsAdmin();
  return <PlataformaClient empresas={empresas} />;
}
