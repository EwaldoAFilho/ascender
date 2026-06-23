# REVISÃO — Fase 3C · SolisCloud em modo NOC/SOC

Branch: `ux/fase-3c-soliscloud-noc-soc`

> **Método:** revisão por **código** + **simulação determinística** da lógica de
> incidentes/filtro. **Sem navegador/captura** → tema/pixel exigem **olho humano**
> (👁). **Um ajuste pequeno aplicado** (rótulo do filtro em PT, ver §9).

Legenda: ✔ verificado/executado · 👁 requer olho humano · ⚠ observação

---

## 1. Arquitetura client/server (tarefa 2)

| Item | Veredito |
|---|---|
| `soliscloud/page.tsx` client-safe | ✔ inicia com `"use client"`. |
| Nenhum módulo com DB importado no client | ✔ **0** imports de `@/lib/db`/`drizzle`/`operational-overview`/`telemetria-db` **em runtime**. |
| `getHealthScore`/`getIncidents`/`getTimeline` ausentes | ✔ **0** ocorrências na SolisCloud. |
| `telemetria-db` (linha 22) | ✔ **`import type`** → apagado no bundle (só tipos `AlarmeHistorico`/`UptimeColetor`). |
| `OperationalIncident` (linha 14) | ✔ **`import type`** → apagado no bundle. |
| `StatusBanner`/`AttentionCenter`/`IncidentItem` só apresentação | ✔ os três importam health/incidents **apenas como `import type`** (client-safe). |
| **Prova final** | ✔ **`npm run build` OK** (12/12) → nada de servidor vazou ao bundle client. |

## 2. Tiles NOC (tarefa 3)

| Item | Veredito |
|---|---|
| Online / Em alarme / Offline / Coletores mudos / Alarmes ativos | ✔ 5 tiles renderizados; valores dos hooks; "—" enquanto carrega. |
| Clique nos tiles de **estado** filtra as estações | ✔ `toggleFiltro` → `filtroEstado` → `stationsFiltradas` alimenta o grid. |
| Toggle (clicar de novo limpa) | ✔ `prev === e ? null : e`. |
| Limpar filtro | ✔ botão `.btn-link` "filtro: X · limpar" → `setFiltroEstado(null)`. |
| Estado vazio do filtro | ✔ `stationsFiltradas.length === 0` → "Nenhuma usina no filtro …". |
| Tiles informativos (Coletores/Alarmes) | ✔ sem `onClick` → renderizam como `div` (não clicáveis), tom só quando `>0`. |

## 3. Centro de Atenção (tarefa 4) — simulação executada

| Cenário | Esperado | Resultado |
|---|---|---|
| Usina offline **na janela solar** | crítico | ✔ `critical:Usina offline` (1º) |
| Usina offline **fora da janela** | info agregado | ✔ `info:Sem geração (fora da janela solar)` (no fim) |
| Usina em alarme | atenção | ✔ `warning:Usina em alarme` |
| Coletor mudo | atenção | ✔ `warning:Coletor sem comunicação` |
| Ordenação | crítico → atenção → info | ✔ confirmado nas duas simulações |
| Sem incidentes | estado positivo | ✔ 0 incidentes → "Tudo operando dentro do esperado." |
| Cap | ≤ 6 + "+N adicional(is)" | ✔ `AttentionCenter max=6` (default). |

## 4. Reorganização do topo (tarefa 5)

`StatusBanner` → `StatTiles` → `AttentionCenter` → strip enxuto (Potência/Energia,
`kpis.slice(0,2)`) → **Telemetria por estação (filtrada)** → Coletores → BarList →
Alertas → Inversores. ✔ **Tabelas/blocos preservados**; aba **"Histórico & O&M"
intacta** (nenhuma edição naquele ramo). ✔

## 5. Revisão visual (👁 + código)

| Item | Status | Observação |
|---|---|---|
| Tema escuro / claro | 👁 | tiles via tokens (`--surface`, `--line`, `--sev-*`, `--brand-yellow`). |
| Desktop / mobile | ✔ código | `.stat-tile-row` é grid `auto-fit minmax(150px,1fr)` → quebra sozinho. |
| Cara NOC/SOC | 👁 (provável **sim**) | contadores grandes + agrupamento + atenção no topo. |
| Não poluída | ✔ | tiles substituem parte do strip; Centro de Atenção com cap 6. |
| Tiles claros e clicáveis | ✔ código / 👁 | `cursor:pointer`, hover, `is-active` com borda âmbar + ring. |
| Tabelas acessíveis | ✔ | todas mantidas abaixo. |

## 6. `StatTile.tsx` (tarefa 7)

| Item | Veredito |
|---|---|
| Apresentação pura | ✔ só recebe props e renderiza. |
| Sem I/O | ✔ único import é `type ReactNode` (sem rede/estado/efeito). |
| Acessível quando clicável | ✔ vira `<button type="button">` com `aria-pressed={active}`. |
| Consistente com tokens | ✔ classes `.stat-tile`/`tone-*` usam variáveis do design system. |
| Estado ativo claro | ✔ `.is-active` → borda `--brand-yellow` + ring interno. |

## 7. Verificação (tarefa 8)

- `npx tsc --noEmit` → **OK** (`TSC_EXIT=0`).
- `npm run build` → **OK** (`BUILD_EXIT=0`; "Compiled successfully" + 12/12).

## 8. Limitações (honestas)

- Sem navegador aqui → temas/mobile e a "cara" NOC precisam de **olho humano**.
- Lógica de incidentes é **local na página** (não importa `buildIncidents`, que
  carrega DB) — pequena duplicação consciente; regra solar replicada (06–18 SP).
- `HealthScore`/`Timeline` na SolisCloud continuam **fora** (3C-B), por exigirem
  endpoint ou extração de cores.

## 9. Ajuste aplicado nesta revisão

- **Rótulo do filtro em PT:** o chip/mensagem mostravam o valor cru `alarm`
  (inglês). Adicionado `filtroLabel` (`alarm → "alarme"`) no chip e na mensagem de
  filtro vazio. Corrigido também um *narrowing* (`filtroEstado` possivelmente
  `null` na mensagem) com guarda. **tsc/build re-rodados → OK.**

## 10. Conclusão

**Aprovado para merge** (técnico). Fronteira client/server limpa (build confirma),
tiles/filtro e Centro de Atenção corretos (simulação), topo reorganizado sem
remover nada, `StatTile` puro/acessível. **Pendente o carimbo visual humano**
(temas/mobile + cara NOC). Nenhuma nova fase iniciada.

> **Sem merge.** Sem endpoint/query/migration/schema/auth; Início e regra de
> negócio intactas; tabelas preservadas; nada de servidor no bundle client.
