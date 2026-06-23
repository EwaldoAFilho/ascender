# RELATÓRIO — Fase 3C · SolisCloud em modo NOC/SOC

Branch: `ux/fase-3c-soliscloud-noc-soc`

Topo da SolisCloud ("Operação ao vivo") reorganizado em **NOC/SOC**: faixa de
saúde + **tiles filtráveis** + **Centro de Atenção**, **reaproveitando
componentes existentes** e **mantendo** todas as tabelas/blocos atuais. Sem
endpoint, sem query nova, sem migration/schema, sem API/tiles externos.

---

## 1. Arquivos criados

| Arquivo | Papel |
|---|---|
| `PLANO_FASE_3C_SOLISCLOUD_NOC_SOC.md` | Diagnóstico, restrição client/server, layout NOC. |
| `src/components/operacao/StatTile.tsx` | Tile NOC **apresentação pura** (clicável = filtro). |
| `RELATORIO_FASE_3C_SOLISCLOUD_NOC_SOC.md` | Este relatório. |

## 2. Arquivos alterados

| Arquivo | Mudança |
|---|---|
| `src/app/(dashboard)/soliscloud/page.tsx` | **Aditivo:** `StatusBanner` + linha de `StatTile` + `AttentionCenter` no topo; filtro por estado nas estações; strip de geração enxuto. **Tabelas/blocos preservados.** |
| `src/app/globals.css` | **Aditivo:** CSS dos `.stat-tile`. |

> **Nada removido.** Hooks, queries, rotas de API e a aba "Histórico & O&M":
> **intactos.**

## 3. Restrição client/server (e como foi resolvida)

A SolisCloud é **client component**; `getHealthScore/getIncidents/getTimeline`
são de **servidor** (importam DB) → **não** importáveis no cliente. **Solução:**
reusar os **componentes de apresentação** (`StatusBanner`, `AttentionCenter`,
`IncidentItem` — todos `import type`, client-safe) **alimentados por dados
montados no cliente** a partir dos hooks já carregados. **Sem endpoint, sem query
nova, sem refatorar os cores** (zero risco para Início/Executivo). Confirmado pelo
**build** (o bundle client não puxou código de servidor).

## 4. O que entrou (incremental)

- **`StatusBanner`** (modo contagens) — faixa de saúde (online/alarme/offline).
- **Tiles NOC** (`StatTile`): **Online · Em alarme · Offline · Coletores mudos ·
  Alarmes ativos**. Os três de **estado** são **clicáveis e filtram** a
  "Telemetria por estação" (com "limpar"); estado vazio do filtro tratado.
- **`AttentionCenter`** com incidentes **montados no cliente**: usina offline
  (crítico **de dia** / **info à noite** — mesma regra solar 06–18 SP), usina em
  alarme, coletor mudo. Ordenados crítico → atenção → info.
- **Strip de geração enxuto** (Potência agora, Energia hoje) — Comunicação/Alarmes
  migraram para os tiles (reorganização, **não** remoção).

## 5. Dados usados (já no cliente)

`useStations` (estado/potência/energia), `useCollectors` (resumo + lista),
`useAlarms` (ativos), `useSyncStatus` (última coleta) — **somente leitura**,
inalterados.

## 6. Não implementado (documentado)

- **`HealthScore`** (medidor) e **`Timeline`** na SolisCloud → exigiriam
  **endpoint** ou **extração dos cores puros** (server/client). Fica para um
  próximo incremento (3C-B), fora desta fase para manter pequeno e sem risco aos
  cores que alimentam Início/Executivo.
- Regra solar replicada com um **check local** (mesma janela 06–18 SP) para evitar
  importar a função do servidor.

## 7. Riscos (e mitigação)

| Risco | Mitigação |
|---|---|
| Duplicar lógica de incidentes | helper **local e pequeno** na página; cores intactos. |
| Vazar código de servidor no bundle | **build OK** (12/12 páginas) confirma client-safety. |
| Poluir mais a tela | tiles substituem parte do strip; tabelas seguem; Centro de Atenção compacto (cap 6). |
| Regra noturna divergir | mesma janela 06–18 SP; documentado. |

## 8. Verificação

- `npx tsc --noEmit` → **OK** (exit 0).
- `npm run build` → **OK** — "Compiled successfully" + 12/12 páginas (exit 0);
  bundle client da `/soliscloud` sem código de servidor.

## 9. Próximos passos

- **3C-B (opcional):** extrair cores puros (`computeHealthScore`/`buildIncidents`/
  `isSolarWindowAt`) para módulos sem DB → reusar `HealthScore`/incidentes **sem
  duplicação** no cliente; eventual `Timeline` via endpoint de leitura.
- **QA final** (fora desta fase).

> **Sem merge.** Branch `ux/fase-3c-soliscloud-noc-soc`. Sem endpoint/query/
> migration/schema/API/tiles externos; Início e regra de negócio intactas;
> funcionalidades existentes preservadas.
