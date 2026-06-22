# RELATÓRIO — Fase 1 UX (ASCENDER Solar Tech)

Implementação da **Fase 1** do `PLANO_UX_ASCENDER.md`: ajustes visuais seguros,
incrementais e reversíveis. **Nenhuma funcionalidade, rota, contrato de API,
autenticação ou regra de negócio foi alterada.** Tudo foi feito em **7 commits
pequenos**.

---

## 1. Componentes criados (todos novos, opt-in)

| Arquivo | Papel |
|---|---|
| `src/components/Badge.tsx` | Badge por severidade (success/warning/critical/info/neutral). Convive com `.status-*` legado. |
| `src/components/Button.tsx` | Botão padronizado; reaproveita `btn-primary/secondary/danger` + nova variante `ghost`. |
| `src/components/Tabs.tsx` | Abas padronizadas; encapsula o estilo `registry-tabs` existente. |
| `src/components/Sparkline.tsx` | Mini-gráfico SVG sem dependências. |
| `src/components/MetricCard.tsx` | Card "big number" com delta e sparkline opcionais. Irmão do `SummaryStrip`. |
| `src/components/StatusBanner.tsx` | Faixa de status da operação (saudável/atenção/falhas). |

> Os primitivos são **opt-in**: nada que já existia foi forçado a usá-los. Eles
> existem para padronizar conteúdo novo e migrações futuras.

## 2. Arquivos alterados

| Arquivo | O que mudou |
|---|---|
| `src/app/globals.css` | **Aditivo:** tokens (tipografia, espaçamento, raios, elevação, severidade); contraste do `--muted` no escuro; CSS de Badge, `btn-ghost`, MetricCard, melhorias de DataTable e StatusBanner. Nenhuma classe existente foi renomeada/removida. |
| `src/components/DataTable.tsx` | Nova prop **opcional** `rowTone` (realce de linha por severidade). Sem mudança de dados, ordenação, exportação ou comportamento. |
| `src/components/UsinasTable.tsx` | Passa `rowTone` (offline = crítico, alarme = atenção). |
| `src/components/FaturasDgTable.tsx` | Passa `rowTone` (faturas vencidas = crítico). |
| `src/app/(dashboard)/executivo/page.tsx` | A `signal-row` foi **reapresentada** como `MetricCard` (mesmos dados + sparkline da série mensal já existente `hist.porMes`). |
| `src/app/(dashboard)/page.tsx` (Início) | `StatusBanner` no topo + faixa de `MetricCard` complementar. Cockpit **intacto**. |

## 3. O que mudou visualmente

- **Tabelas mais legíveis:** cabeçalho fixo ao rolar (desktop), zebra sutil,
  hover de linha, mais respiro e **linhas críticas destacadas** (vermelho para
  offline/vencido, âmbar para alarme).
- **Executivo mais "premium":** os 3 indicadores do ano viraram cards com número
  grande, faixa de severidade e **sparkline** de tendência.
- **Início com leitura de saúde:** faixa de status no topo ("Operação saudável /
  em atenção / com falhas") + cards de capacidade, aproveitamento e usinas online.
- **Base visual padronizada:** badges, botões e abas agora têm primitivos
  consistentes; tokens de severidade unificam cores de status.
- **Contraste:** texto secundário levemente mais claro no tema escuro (alvo AA).

## 4. O que foi preservado (garantias)

- **Dados, rotas, APIs, autenticação e regras de negócio:** inalterados.
- **Tema escuro + identidade ASCENDER** (amarelo solar `#f5b700`, azul petróleo
  `#0b3c5d`): preservados; apenas tokens **aditivos**.
- **Componentes existentes** (`SummaryStrip`, `PowerRing`, `GenerationChart`,
  `DataTable` etc.): mantidos; `DataTable` ganhou só uma prop opcional.
- **`SummaryStrip` não foi substituído** — `MetricCard` é um componente **irmão**.

## 5. Inconsistências encontradas e como foram tratadas

1. **Nome "MetricCard" × classes existentes:** o `SummaryStrip` já usa
   `.metric-row/.metric`. Para não colidir, o novo card usa **`.metric-card`** e
   **`.metric-card-grid`** (namespace próprio). Documentado, sem renomear nada.
2. **`.signal` / `.signal-row` ficaram órfãos** após o Executivo migrar para
   `MetricCard`. As classes **foram mantidas** em `globals.css` (inofensivas e
   reversíveis); podem ser removidas numa limpeza futura se confirmado o desuso.
3. **Sticky header** depende do scroll da página (o `.table-wrap` só rola na
   horizontal). Implementado via `position: sticky; top: 0` no `th` — funciona com
   o scroll da página; sem alterar a altura/scroll do container.

## 6. Riscos (e mitigação)

| Risco | Mitigação |
|---|---|
| Regressão visual por tokens novos | Tokens **aditivos**; nada renomeado; `build` + `tsc` ok; revisão clara/escuro recomendada no deploy. |
| Sticky header sobrepor conteúdo ao rolar | Comportamento previsto (padrão observabilidade); `th` tem fundo próprio; escopo só desktop. |
| Zebra/realce conflitar no mobile (cards) | Zebra escopada a `min-width: 761px`; realce de linha testado nos dois layouts. |
| `rowTone` afetar tabelas não desejadas | É **opcional**; só aplicado em UsinasTable e FaturasDgTable. |
| Duplicação leve de métricas na Início | Aceita: banner (status) × cards (números) têm enquadramentos diferentes; reversível. |

## 7. Verificação

- `npx tsc --noEmit` → **OK** em todos os blocos.
- `npm run build` (produção) → **Compiled successfully**.
- Sem migração de banco. Sem alteração de endpoints.

## 8. Próximos passos — Fase 2 (inteligência operacional)

Tudo **derivado do banco** (sem novos endpoints externos); exige novas *queries de
leitura* a serem apontadas antes de implementar.

1. **`HealthScore`** (0–100) consolidando online/alarme/offline + uptime de
   coletores + inadimplência — evolução natural do `StatusBanner`.
2. **`AttentionCenter` + `IncidentItem`** — incidentes priorizados e acionáveis
   (de `alarmes` + offline + coletores mudos + faturas vencidas).
3. **`OperationalTimeline`** — linha do tempo (de `alarmes` + `sync_runs` + uptime).
4. **`GenerationHeatmap`** e **`ComparisonChart`** (realizado×esperado, hoje×ontem)
   com `@nivo`/SVG, dados já no banco.
5. **`StatTile`** clicável (modo NOC/SOC) na SolisCloud, filtrando as listas que
   já existem.

> Antes de Fase 2: validar visualmente a Fase 1 no ambiente real (claro/escuro,
> desktop/mobile) e ajustar espaçamentos finos se necessário.

---

**Resumo:** a Fase 1 elevou a percepção visual (hierarquia, severidade, tabelas,
cards com tendência, status da operação) **sem remover nada e sem tocar em dados
ou contratos** — pronta para receber a inteligência operacional da Fase 2.
