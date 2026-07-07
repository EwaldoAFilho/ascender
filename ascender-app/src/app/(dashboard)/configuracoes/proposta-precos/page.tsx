import { carregarParametros } from "@/lib/propostas/parametros";
import { ParametrosForm } from "./ParametrosForm";

export const dynamic = "force-dynamic";

export default async function PropostaPrecosPage() {
  const parametros = await carregarParametros();
  return <ParametrosForm inicial={parametros} />;
}
