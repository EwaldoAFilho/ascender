import { withSessionTenant } from "@/lib/auth/tenant";
import { carregarParametros } from "@/lib/propostas/parametros";
import { ParametrosForm } from "./ParametrosForm";

export const dynamic = "force-dynamic";

export default async function PropostaPrecosPage() {
  // Premissas (kit/custos/margem) são POR TENANT e confidenciais — escopa a leitura
  // ao tenant da sessão (carregarParametros filtra por getCurrentTenantId).
  const parametros = await withSessionTenant(() => carregarParametros());
  return <ParametrosForm inicial={parametros} />;
}
