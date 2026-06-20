import { AlertTriangle, RefreshCw } from "lucide-react";
import { tempoRelativo } from "@/lib/dashboard-data";

/**
 * Selo de frescor: "atualizado há X". Verde quando recente, âmbar passando de
 * ~25 min e vermelho passando de 1h (o worker coleta a cada ~10 min). Puro de
 * apresentação — serve a Server Components (Início) e Client (SolisCloud).
 */
export function FrescorTelemetria({ iso }: { iso: string | null | undefined }) {
  if (!iso) {
    return (
      <span className="frescor is-bad">
        <AlertTriangle size={13} /> sem coleta
      </span>
    );
  }
  const min = (Date.now() - new Date(iso).getTime()) / 60000;
  const tone = min > 60 ? "is-bad" : min > 25 ? "is-warn" : "is-ok";
  return (
    <span className={`frescor ${tone}`}>
      <RefreshCw size={13} /> atualizado {tempoRelativo(iso)}
    </span>
  );
}
