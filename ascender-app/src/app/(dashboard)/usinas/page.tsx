import { BarList } from "@/components/BarList";
import { getUsinasComTelemetria } from "@/lib/cadastros/queries";
import { numberFormatter } from "@/lib/dashboard-data";

export const dynamic = "force-dynamic";

export default async function UsinasPage() {
  const { configurada, linhas } = await getUsinasComTelemetria();
  const vinculadas = linhas.filter((l) => l.vinculada);

  const geracaoRows = vinculadas
    .map((l) => ({
      label: l.nome,
      value: l.realizadoMesKwh ?? 0,
      caption: l.estacaoNome ?? "",
    }))
    .filter((r) => r.value > 0)
    .sort((a, b) => b.value - a.value);

  const aderenciaRows = vinculadas
    .filter((l) => l.aderenciaPct != null)
    .map((l) => ({
      label: l.nome,
      value: l.aderenciaPct as number,
      caption: `${numberFormatter.format(l.realizadoMesKwh ?? 0)} de ${numberFormatter.format(l.esperadoMesKwh ?? 0)} kWh`,
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <>
      {!configurada ? (
        <section className="panel">
          <div className="panel-header">
            <h2>SolisCloud não configurada</h2>
          </div>
          <p style={{ color: "var(--muted)", margin: 0 }}>
            Configure as credenciais em Configurações › Integrações para ver a
            geração real das usinas.
          </p>
        </section>
      ) : vinculadas.length === 0 ? (
        <section className="panel">
          <div className="panel-header">
            <h2>Nenhuma usina vinculada à SolisCloud</h2>
          </div>
          <p style={{ color: "var(--muted)", margin: 0 }}>
            Vincule cada usina ao Station ID em Cadastros › Usinas — ou use
            “Importar da SolisCloud” — para cruzar geração real × esperada.
          </p>
        </section>
      ) : null}

      <section className="dashboard-grid">
        <BarList
          title="Geração do mês por usina (real)"
          rows={geracaoRows}
          formatter={(v) => `${numberFormatter.format(v)} kWh`}
        />
        <BarList
          title="Aderência realizado × esperado"
          rows={aderenciaRows}
          formatter={(v) => `${numberFormatter.format(v)}%`}
        />
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Usinas monitoradas</h2>
            <p>Cadastro cruzado com a telemetria real da SolisCloud.</p>
          </div>
          <span>
            {vinculadas.length}/{linhas.length} vinculadas
          </span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Usina</th>
                <th>Distribuidora</th>
                <th>SolisCloud</th>
                <th>Potência</th>
                <th>Agora</th>
                <th>Mês real</th>
                <th>Esperado</th>
                <th>Aderência</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {linhas.map((l) => (
                <tr key={l.id}>
                  <td>{l.nome}</td>
                  <td>{l.distribuidoraNome ?? "-"}</td>
                  <td>
                    {l.vinculada ? (
                      (l.estacaoNome ?? "vinculada")
                    ) : (
                      <span style={{ color: "var(--muted)" }}>
                        não vinculada
                      </span>
                    )}
                  </td>
                  <td>{l.potenciaKwp} kWp</td>
                  <td>
                    {l.potenciaAgoraKw != null
                      ? `${numberFormatter.format(l.potenciaAgoraKw)} kW`
                      : "-"}
                  </td>
                  <td>
                    {l.realizadoMesKwh != null
                      ? `${numberFormatter.format(l.realizadoMesKwh)} kWh`
                      : "-"}
                  </td>
                  <td>
                    {l.esperadoMesKwh
                      ? `${numberFormatter.format(l.esperadoMesKwh)} kWh`
                      : "-"}
                  </td>
                  <td>
                    {l.aderenciaPct != null
                      ? `${numberFormatter.format(l.aderenciaPct)}%`
                      : "-"}
                  </td>
                  <td>
                    <span className={`status status-${l.statusReal ?? l.status}`}>
                      {l.statusReal ?? l.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
