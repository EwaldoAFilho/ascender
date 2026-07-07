"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { salvarParametrosProposta } from "@/lib/propostas/actions";
import type { ParametrosProposta } from "@/lib/propostas/types";

type KitRow = {
  kwpMax: string;
  precoMicro: string;
  precoString: string;
  trifasicoObrigatorio: boolean;
};

const s = (v: number) => String(v);

export function ParametrosForm({ inicial }: { inicial: ParametrosProposta }) {
  const [dataTabela, setDataTabela] = useState(inicial.dataTabela ?? "");
  const [maoDeObraKwp, setMaoDeObra] = useState(s(inicial.maoDeObraKwp));
  const [materialAcKwp, setMaterialAc] = useState(s(inicial.materialAcKwp));
  const [materialAcMin, setMaterialAcMin] = useState(s(inicial.materialAcMin));
  const [impostoPercent, setImposto] = useState(s(inicial.impostoPercent));
  const [margemPercent, setMargem] = useState(s(inicial.margemPercent));
  const [margemPercentRentavel, setMargemRent] = useState(s(inicial.margemPercentRentavel));
  const [ajusteString, setAjusteString] = useState(s(inicial.ajusteString));
  const [ajusteMicro, setAjusteMicro] = useState(s(inicial.ajusteMicro));
  const [soloDescontoKitKwp, setSoloDesc] = useState(s(inicial.soloDescontoKitKwp));
  const [estruturaSoloPorModulo, setEstruturaSolo] = useState(s(inicial.estruturaSoloPorModulo));
  const [kit, setKit] = useState<KitRow[]>(
    inicial.kit.map((k) => ({
      kwpMax: s(k.kwpMax),
      precoMicro: s(k.precoMicro),
      precoString: s(k.precoString),
      trifasicoObrigatorio: k.trifasicoObrigatorio,
    })),
  );

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function setKitRow(i: number, patch: Partial<KitRow>) {
    setKit((rows) => rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  }
  function addKit() {
    setKit((rows) => [
      ...rows,
      { kwpMax: "", precoMicro: "", precoString: "", trifasicoObrigatorio: false },
    ]);
  }
  function removeKit(i: number) {
    setKit((rows) => (rows.length <= 1 ? rows : rows.filter((_, j) => j !== i)));
  }

  async function salvar() {
    setMsg(null);
    setBusy(true);
    const r = await salvarParametrosProposta({
      dataTabela,
      maoDeObraKwp: Number(maoDeObraKwp) || 0,
      materialAcKwp: Number(materialAcKwp) || 0,
      materialAcMin: Number(materialAcMin) || 0,
      impostoPercent: Number(impostoPercent) || 0,
      margemPercent: Number(margemPercent) || 0,
      margemPercentRentavel: Number(margemPercentRentavel) || 0,
      ajusteString: Number(ajusteString) || 0,
      ajusteMicro: Number(ajusteMicro) || 0,
      soloDescontoKitKwp: Number(soloDescontoKitKwp) || 0,
      estruturaSoloPorModulo: Number(estruturaSoloPorModulo) || 0,
      kit: kit.map((k) => ({
        kwpMax: Number(k.kwpMax) || 0,
        precoMicro: Number(k.precoMicro) || 0,
        precoString: Number(k.precoString) || 0,
        trifasicoObrigatorio: k.trifasicoObrigatorio,
      })),
    });
    setBusy(false);
    setMsg(
      r.ok
        ? { ok: true, text: "Parâmetros salvos. As próximas propostas já usam os novos valores." }
        : { ok: false, text: r.error },
    );
  }

  const campo = (
    label: string,
    value: string,
    onChange: (v: string) => void,
    step = "any",
  ) => (
    <label className="form-field">
      <span>{label}</span>
      <input type="number" step={step} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );

  return (
    <>
      <section className="panel" style={{ border: "1px solid var(--gold, #C89B3C)" }}>
        <div className="panel-header">
          <div>
            <h2>Preços &amp; Margem do gerador</h2>
            <p>Uso interno. Estes valores alimentam o cálculo das propostas — nunca aparecem para o cliente.</p>
          </div>
        </div>
        <div className="form-grid">
          <label className="form-field">
            <span>Data / vigência da tabela</span>
            <input type="text" value={dataTabela} placeholder="ex: 07/2026"
              onChange={(e) => setDataTabela(e.target.value)} />
          </label>
          {campo("Mão de obra (R$/kWp)", maoDeObraKwp, setMaoDeObra)}
          {campo("Material AC (R$/kWp)", materialAcKwp, setMaterialAc)}
          {campo("Material AC mínimo (R$)", materialAcMin, setMaterialAcMin)}
          {campo("Imposto sobre serviços (%)", impostoPercent, setImposto)}
          {campo("Margem — Sistema Necessário (%)", margemPercent, setMargem)}
          {campo("Margem — Telhado Rentável (%)", margemPercentRentavel, setMargemRent)}
          {campo("Ajuste String (R$/kWp)", ajusteString, setAjusteString)}
          {campo("Ajuste Microinversor (R$/kWp)", ajusteMicro, setAjusteMicro)}
          {campo("Solo — desconto no kit (R$/kWp)", soloDescontoKitKwp, setSoloDesc)}
          {campo("Solo — estrutura (R$/módulo)", estruturaSoloPorModulo, setEstruturaSolo)}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Tabela de kit (R$/kWp por faixa)</h2>
            <p>A faixa usada é a primeira cujo teto de kWp cobre a potência do sistema.</p>
          </div>
          <button type="button" className="btn-secondary" onClick={addKit}>
            <Plus size={16} /> Adicionar faixa
          </button>
        </div>
        <div className="table-wrap" style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                {["Até (kWp)", "String (R$/kWp)", "Micro (R$/kWp)", "Trifásico obrig.", ""].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "8px", color: "var(--muted)", fontSize: 11 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {kit.map((row, i) => (
                <tr key={i} style={{ borderTop: "1px solid var(--line)" }}>
                  <td style={{ padding: 6 }}>
                    <input type="number" step="0.1" value={row.kwpMax} style={{ width: 90 }}
                      onChange={(e) => setKitRow(i, { kwpMax: e.target.value })} />
                  </td>
                  <td style={{ padding: 6 }}>
                    <input type="number" step="0.01" value={row.precoString} style={{ width: 120 }}
                      onChange={(e) => setKitRow(i, { precoString: e.target.value })} />
                  </td>
                  <td style={{ padding: 6 }}>
                    <input type="number" step="0.01" value={row.precoMicro} style={{ width: 120 }}
                      onChange={(e) => setKitRow(i, { precoMicro: e.target.value })} />
                  </td>
                  <td style={{ padding: 6, textAlign: "center" }}>
                    <input type="checkbox" checked={row.trifasicoObrigatorio}
                      onChange={(e) => setKitRow(i, { trifasicoObrigatorio: e.target.checked })} />
                  </td>
                  <td style={{ padding: 6 }}>
                    {kit.length > 1 ? (
                      <button type="button" className="btn-link danger" onClick={() => removeKit(i)}>
                        <Trash2 size={14} />
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {msg ? (
        <p style={{ fontWeight: 800, marginBottom: 12, color: msg.ok ? "var(--success)" : "var(--danger)" }}>
          {msg.text}
        </p>
      ) : null}
      <div className="form-actions">
        <button type="button" className="btn-primary" onClick={salvar} disabled={busy}>
          {busy ? "Salvando…" : "Salvar parâmetros"}
        </button>
      </div>
    </>
  );
}
