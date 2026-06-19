import type { DeviceState } from "@/types/soliscloud";
import { numberFormatter } from "@/lib/dashboard-data";

const stateLabel: Record<DeviceState, string> = {
  online: "online",
  offline: "offline",
  alarm: "alarme",
};

// Card de uma usina ao vivo: potência agora + utilização da capacidade + hoje.
export function StationCard({
  nome,
  state,
  currentPowerKw,
  potenciaKwp,
  dayEnergyKwh,
}: {
  nome: string;
  state: DeviceState;
  currentPowerKw: number;
  potenciaKwp: number;
  dayEnergyKwh: number;
}) {
  const pct = potenciaKwp > 0 ? Math.min((currentPowerKw / potenciaKwp) * 100, 100) : 0;
  return (
    <article className="station-card">
      <div className="station-card-head">
        <strong>{nome}</strong>
        <span className={`status status-${state}`}>{stateLabel[state]}</span>
      </div>
      <span className="now">{numberFormatter.format(currentPowerKw)} kW</span>
      <div className="bar-track">
        <span style={{ width: `${Math.max(pct, 2)}%` }} />
      </div>
      <small>
        {numberFormatter.format(dayEnergyKwh)} kWh hoje
        {potenciaKwp > 0 ? ` · ${numberFormatter.format(potenciaKwp)} kWp` : ""}
      </small>
    </article>
  );
}
