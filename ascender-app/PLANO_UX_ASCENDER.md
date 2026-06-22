# PLANO_UX_ASCENDER

Plano de evolução visual e de UX da **ASCENDER Solar Tech** — de "ERP com tabelas"
para **plataforma de inteligência operacional de energia solar**, inspirada em
Datadog, Grafana, SolarEdge Monitoring e Tesla Energy.

> **Regra-mãe deste plano:** nada que já existe é removido. Rotas, dados,
> contratos de API, autenticação, regras de negócio e componentes atuais são
> preservados. Toda mudança é **incremental, aditiva e reversível**, aplicada por
> fases. Onde um recurso depende de dado novo, isso está marcado como
> **[derivado]**, **[mock]** ou **[depende de backend]**.

---

## 1. Diagnóstico atual da aplicação

### 1.1 Stack e arquitetura

- **Framework:** Next.js 15 (App Router, React Server Components + Server Actions),
  React 18, TypeScript.
- **Dados:** Drizzle ORM + PostgreSQL. Arquitetura **sync-first**: workers
  (`db:sync-telemetria`, `db:sync-geracao`, `db:sync-faturas-dg`,
  `db:sync-rateio-dg`) populam o banco; **as telas leem do banco**, não da API ao
  vivo. Isso é uma força enorme para observabilidade (histórico já existe).
- **Estado de cliente:** TanStack Query v5 (telas "ao vivo" — SolisCloud, Geração).
- **Gráficos:** `recharts` 3 (curvas/áreas/barras) e `@nivo/bar|pie|core`
  (já instalados). Sem uso pesado de mapas ou heatmaps ainda.
- **Ícones:** `lucide-react`. **Exportação:** `jspdf` + `jspdf-autotable` + `xlsx`.
- **Sessão:** `iron-session` (cookie cifrado). **Hash:** `@node-rs/argon2`.
- **PDF:** `pdf-parse` (extração das contas de energia).

### 1.2 Estrutura de pastas (frontend)

```
src/
  app/
    (dashboard)/           # layout com sidebar + topbar + MobileNav
      page.tsx             # Início — "Operação ao vivo"
      executivo/           # Dashboard executivo (consolidado/meta/ano)
      soliscloud/          # Operação & O&M (telemetria, coletores, inversores, alarmes)
      usinas/              # Performance por usina (tabela + aderência)
      rateio/              # Rateio e compensação (Digital Grid)
      financeiro/          # Faturas + contas de energia + boletos em lote
      propostas/           # Simulador comercial
      geracao/             # Histórico de geração (curva dia/mês/ano)
      analise/             # Análise de geração (gráficos com filtro)
      integracoes/         # Mapa técnico das fontes
      cadastros/           # clientes, unidades, usinas, distribuidoras, contratos, conciliação
      configuracoes/       # integracoes (tokens), usuarios, senha
    api/                   # route handlers (soliscloud, financeiro/conta, cadastros/anexo)
    providers.tsx          # QueryClient + Theme + Confirm + Toast
    globals.css            # design system inteiro (tokens + classes)
  components/              # SummaryStrip, PowerRing, StationCard, GenerationChart, DataTable, BarList, ...
  components/cadastros/    # CrudSection, ClienteFicha, OrigemBanner, Importar*...
  hooks/useSolis.ts        # hooks de dados ao vivo
  lib/                     # cadastros, digitalgrid, soliscloud, financeiro, db, auth, theme, dashboard-data
```

### 1.3 Inventário de componentes reutilizáveis (já existem)

| Componente | Papel |
|---|---|
| `SummaryStrip` | Faixa de KPIs (label/valor/hint/tone) |
| `PowerRing` | Anel radial (potência agora / aderência à meta) |
| `StationCard` | Card de uma usina ao vivo (potência, estado, hoje) |
| `GenerationChart` | Curva/área (dia) e barras (mês/ano) — recharts |
| `BarList` | Ranking horizontal (barras + legenda) |
| `AdherenceRow` | Linha de aderência realizado × meta |
| `DataTable` | Tabela com ordenação + exportação Excel/PDF |
| `AlarmsByStation` | Alarmes agrupados por usina |
| `FrescorTelemetria` | Selo "atualizado há X" |
| `CrudSection` | CRUD genérico (form + tabela + extras) |
| `ConfirmProvider` / `ToastProvider` | Diálogos e toasts padronizados (recém-criados) |
| `MobileNav` | Navegação inferior + sheet "Mais" |
| `RateioDgTable` / `UsinasTable` / `FaturasDgTable` | Tabelas de domínio |

### 1.4 Design system atual (tokens em `globals.css`)

- **Tema:** claro + escuro (via `:root[data-theme="dark"]`), alternável.
- **Marca:** `--brand-yellow: #f5b700` (amarelo solar), `--brand-blue: #0b3c5d`
  (azul petróleo), `--brand-gold: #c9a227`.
- **Superfícies:** `--surface`, `--surface-soft`, `--surface-strong`, `--sidebar-bg`.
- **Texto:** `--ink` (corpo), `--heading` (títulos), `--muted` (secundário).
- **Semânticas:** `--danger`, `--success`, `--warning` (com variações por tema).
- **Status (badges):** `.status-online`, `.status-offline`, `.status-alarm`,
  `.status-atencao`, `.status-pago`, `.status-vencido`, `.status-aguardando`,
  `.status-critico`, `.status-alto/medio`, `.status-mock`, etc.
- **Layout:** `.panel`, `.cockpit`, `.summary-list`, `.dashboard-grid`,
  `.split-grid`, `.registry-tabs` (tabs), `.module-grid`.

---

## 2. Pontos fortes (o que NÃO mexer)

1. **Arquitetura sync-first** — o histórico já está no banco. Heatmaps,
   comparativos, timeline e tendências são **derivados** do que já existe, sem
   novos endpoints. É a maior alavanca para virar "observabilidade".
2. **Design tokens consistentes** — cores, superfícies e semânticas já
   centralizadas; dá para refinar sem reescrever telas.
3. **Papéis de tela já afiados** — Início (ao vivo), Executivo (consolidado),
   SolisCloud (O&M), Usinas (performance) têm fronteiras claras (trabalho recente).
4. **Componentes de base sólidos** — `DataTable` (ordena/exporta), `PowerRing`,
   `SummaryStrip`, `GenerationChart`, `ConfirmProvider`/`ToastProvider`.
5. **Identidade visual presente** — amarelo solar + azul petróleo + tema escuro
   já comunicam o setor.
6. **Telemetria rica** — estações, inversores, coletores, alarmes, uptime,
   aderência, faturas: matéria-prima para um NOC/SOC solar.

---

## 3. Problemas de UX/UI encontrados

### 3.1 Hierarquia e densidade
- **KPIs "achatados":** `SummaryStrip` trata todos os números com o mesmo peso.
  Falta diferenciar **métrica-herói** (ex.: potência agora, health score) de
  métricas de apoio. Sem tamanho, sem tendência, sem micro-gráfico.
- **Excesso de cards/painéis equivalentes:** várias telas empilham `.panel` de
  mesmo peso visual; o olho não sabe onde começar (falta de "F-pattern").
- **Informação crítica × secundária sem contraste:** uma usina **offline** e uma
  **economia gerada** competem com o mesmo realce. Falta um eixo de severidade.

### 3.2 Operação / alertas
- **Alertas pouco acionáveis:** alarmes e coletores offline aparecem como
  listas/tabelas, sem "o que fazer", sem priorização, sem agrupar incidentes.
- **Sem visão unificada de saúde:** não há um **Health Score** nem um **Centro de
  Atenção** — o operador precisa varrer várias telas para saber "está tudo bem?".
- **Estados visuais incompletos:** loading/empty/error existem em partes
  (`states.tsx`), mas não há padrão único; skeletons são escassos.

### 3.3 Leitura de dados
- **Tabelas densas, mas "planas":** boa funcionalidade (ordenar/exportar), porém
  sem zebra, sem sticky header consistente, sem destaque de linhas críticas, sem
  micro-visualização (barra/sparkline na célula).
- **Gráficos sem comparativo:** curvas mostram "hoje", mas não "hoje vs ontem",
  nem "realizado vs esperado" sobreposto. Falta storytelling.
- **Pouca conversão de dado em insight:** números crus, sem "↑ 12% vs ontem",
  "abaixo da meta", "3 usinas puxando a queda".

### 3.4 Sistema visual
- **Tipografia sem escala formal:** tamanhos definidos ad-hoc (rem soltos,
  inline styles). Falta escala tipográfica e de espaçamento (tokens).
- **Inconsistências de componente:** botões (`btn-primary`, `btn-secondary`,
  `btn-link`, `secondary`), tabs (`registry-tabs`), badges e filtros aparecem com
  variações; precisam de padronização.
- **Inline styles espalhados:** muitos `style={{...}}` em telas (ex.: páginas de
  cadastros, integrações) dificultam consistência e tema.

### 3.5 Responsividade
- **Mobile coberto, mas "encolhido":** `MobileNav` é bom, mas cards/tabelas
  apenas reduzem; falta densidade adaptativa (ex.: tabela → lista de cards no
  mobile) e priorização do que aparece primeiro.

---

## 4. Inspirações aplicáveis

### 4.1 Datadog (observabilidade, saúde, incidentes)
- **Health Score** e **status banner** no topo ("Operação saudável" / "2
  incidentes ativos").
- **Centro de Atenção / Incidentes** com severidade (P1/P2/P3), agrupamento e
  ação. → aplicar como **Centro de Atenção** derivado de alarmes + offline +
  inadimplência.
- **Cores semânticas fortes** e consistentes para severidade.

### 4.2 Grafana (densidade, painéis modulares, leitura rápida)
- **Painéis modulares** com "big number + sparkline + delta".
- **Heatmaps** e séries densas. → **Heatmap de geração** (hora × dia).
- **Thresholds visuais** (verde/âmbar/vermelho) embutidos nos painéis.

### 4.3 SolarEdge Monitoring (contexto solar)
- **Curva de geração do dia** com faixa esperada e comparativo.
- **Visão por usina/inversor/string** com status e produção.
- **Mapa/listagem de sites** com estado de comunicação.

### 4.4 Tesla Energy (premium, executivo, limpo)
- **Estética minimalista**, números grandes, muito respiro, gradientes sutis.
- **Mapa** de ativos, **tendências** suaves, foco em "status + energia + futuro".
- **Hero executivo** com 1 métrica dominante e contexto ao redor.

---

## 5. Melhorias propostas por tela

> Cada item indica a fonte de dado: **[derivado]** (já no banco),
> **[mock]** (placeholder até backend), **[depende de backend]** (dado novo).

### 5.1 Início — "Operação ao vivo" (`/`)
- **Faixa de status no topo** ("Operação saudável" / "Atenção: 2 usinas offline")
  com **Health Score** [derivado de online/alarme/offline + uptime coletores].
- **Métrica-herói** mantém o `PowerRing` (potência agora), mas ganha **delta vs
  ontem no mesmo horário** [derivado da telemetria histórica].
- **Frota ao vivo:** `StationCard` ganha **mini-sparkline do dia** [derivado] e
  realce de borda por severidade (offline = vermelho).
- **Mini "Centro de Atenção"** com os 3 itens mais críticos + link para a tela
  cheia [derivado].

### 5.2 Executivo — "Consolidado & meta" (`/executivo`)
- **Hero executivo premium:** Health Score + 3 cards executivos com **tendência**
  (geração mês vs meta, receita, inadimplência) — "big number + delta + sparkline".
- **Comparativos:** "mês atual vs meta", "ano vs ano anterior" [derivado/parcial:
  ano anterior depende de histórico acumulado].
- **Ranking de aderência** vira **lista priorizada** (pior no topo, com barra e
  semáforo) — reaproveita `AdherenceRow`/`BarList`.
- **Heatmap de geração** (usina × mês ou hora × dia) [derivado].

### 5.3 SolisCloud — "Operação & O&M" (`/soliscloud`)
- **Modo NOC/SOC:** topo com contadores grandes (online / alarme / offline /
  coletores mudos) como **tiles clicáveis** que filtram a lista abaixo.
- **Telemetria por estação:** cards com severidade, sparkline e "última
  comunicação" em destaque quando atrasada [derivado de `FrescorTelemetria`].
- **Alarmes acionáveis:** `AlarmsByStation` ganha severidade, "há quanto tempo" e
  agrupamento por usina; ação "ver histórico".
- **Timeline operacional** (aba O&M): eventos (alarme aberto/resolvido, coletor
  caiu/voltou, sync) em linha do tempo [derivado de `alarmes` + `sync_runs` +
  uptime].

### 5.4 Usinas — "Performance" (`/usinas`)
- **Tabela densa premium:** zebra, sticky header, célula de aderência com
  **barra inline** e semáforo; linha crítica destacada.
- **Filtro por estado** (na meta / atenção / offline) reaproveitando os tiles.

### 5.5 Geração / Análise (`/geracao`, `/analise`)
- **Curva com faixa esperada** sobreposta (realizado vs esperado) [derivado da
  meta] e **hoje vs ontem** [derivado].
- **Heatmap** hora × dia por usina [derivado].

### 5.6 Financeiro (`/financeiro`)
- **KPIs com tendência** (recebido, em aberto, inadimplência %) + barra de
  composição.
- **Linha crítica:** faturas vencidas em vermelho; selo de "conta anexada".
  (Mantém tudo que já existe: lote, anexar, excluir.)

### 5.7 Cadastros / Integrações / Propostas / Rateio
- **Padronização** (tabelas, badges, botões, filtros, tabs) — ganho automático ao
  consolidar o design system. **Integrações** já migrou para toasts; aplicar
  skeletons e estados.
- **Rateio:** célula de percentual com barra inline; agrupar por usina.

---

## 6. Melhorias no design system

> Tudo aditivo em `globals.css` (novos tokens/classes), sem renomear o existente.

1. **Escala tipográfica** (tokens): `--fs-display, --fs-h1, --fs-h2, --fs-body,
   --fs-sm, --fs-xs` + pesos. Eliminar tamanhos soltos gradualmente.
2. **Escala de espaçamento**: `--sp-1..--sp-8` (4/8/12/16/24/32/48) para padronizar
   gaps/paddings.
3. **Tokens de severidade**: `--sev-critical, --sev-warning, --sev-ok,
   --sev-info, --sev-neutral` (mapeando para danger/warning/success), usados por
   badges, bordas e tiles.
4. **Elevação**: `--elev-1/2/3` (sombras) para hierarquia de cards.
5. **Raios**: `--radius-sm/md/lg` padronizados.
6. **Estados padronizados** (em `states.tsx`): `Skeleton`, `EmptyState`,
   `ErrorState`, `LoadingBlock` reutilizáveis com a mesma assinatura.
7. **Variantes de badge** unificadas: `Badge` (sucesso/atenção/crítico/neutro/info).
8. **Variantes de botão** unificadas: `primary/secondary/ghost/danger` (consolidar
   `secondary`, `btn-link`, `btn-secondary.danger`).
9. **Padrão de card**: `MetricCard` (label + valor + delta + sparkline + tone).
10. **Refino de marca (sutil):** manter amarelo solar + azul petróleo; introduzir
    gradiente sutil no hero executivo e no anel; aumentar contraste do texto
    secundário no escuro (`--muted` levemente mais claro) para acessibilidade
    (alvo WCAG AA).

---

## 7. Componentes novos sugeridos

> Construídos com o que já temos (recharts/nivo/lucide) e dados **derivados**.

| Componente | Função | Dado |
|---|---|---|
| `HealthScore` | Anel/medidor de saúde geral (0–100) + rótulo | [derivado] |
| `StatusBanner` | Faixa de status global no topo | [derivado] |
| `AttentionCenter` | Centro de Atenção: incidentes priorizados + ação | [derivado] |
| `IncidentItem` | Item de incidente (severidade, idade, alvo, ação) | [derivado] |
| `MetricCard` | Big number + delta (↑/↓) + sparkline | [derivado] |
| `Sparkline` | Mini-série para cards/células | [derivado] |
| `TrendBadge` | "↑ 12% vs ontem" / "abaixo da meta" | [derivado] |
| `OperationalTimeline` | Linha do tempo de eventos O&M | [derivado] |
| `GenerationHeatmap` | Heatmap hora×dia ou usina×mês (@nivo) | [derivado] |
| `StatTile` | Tile clicável (contador) que filtra listas | [derivado] |
| `SiteMap` | Mapa geográfico das usinas | **[depende de backend: coordenadas]** |
| `Badge` / `Button` / `Tabs` / `Toolbar` | Primitivos padronizados | — |
| `DataTable` (evolução) | Densidade, zebra, sticky, célula com barra/sparkline | — |
| `ComparisonChart` | Sobreposição realizado×esperado / hoje×ontem | [derivado] |

---

## 8. Plano de implementação por fases

### Fase 1 — Ajustes visuais seguros (sem novos dados, baixo risco)
Objetivo: elevar a percepção de qualidade reaproveitando tudo.
1. **Tokens novos** (tipografia, espaçamento, severidade, elevação, raios) em
   `globals.css` — aditivos.
2. **Padronizar primitivos**: `Badge`, `Button`, `Tabs`, estados
   (`Skeleton/Empty/Error`) — consolidar classes/variantes existentes.
3. **`MetricCard` + `Sparkline`** e adoção no Executivo e Início (sem alterar os
   KPIs atuais — apenas enriquecer apresentação).
4. **Hierarquia**: métrica-herói maior, secundárias menores; respiro/contraste;
   linha crítica em tabelas (zebra + sticky + destaque de severidade).
5. **Refino de marca**: gradiente sutil no hero/anel; ajuste de contraste do
   `--muted` no escuro.

### Fase 2 — Componentes de inteligência operacional (derivados do banco)
Objetivo: virar "observabilidade" sem novos endpoints.
1. **`HealthScore` + `StatusBanner`** [derivado: online/alarme/offline + uptime +
   inadimplência] — no topo de Início e Executivo.
2. **`AttentionCenter` + `IncidentItem`** [derivado de `alarmes` + offline +
   coletores mudos + faturas vencidas] — priorização e ação.
3. **`OperationalTimeline`** [derivado de `alarmes`/`sync_runs`/uptime].
4. **`GenerationHeatmap`** e **`ComparisonChart`** (realizado×esperado, hoje×ontem)
   [derivado].
5. **`StatTile`** clicável (NOC/SOC) na SolisCloud, filtrando listas existentes.

> Observação: itens derivados podem exigir **novas queries de leitura** (em
> `lib/soliscloud/telemetria-db.ts`, `lib/digitalgrid/queries.ts`), **sem novos
> endpoints externos nem mudança de contrato** — apontado antes de implementar.

### Fase 3 — Experiência premium e executiva
Objetivo: estética Tesla/SolarEdge e visão de plataforma.
1. **Hero executivo premium** (Health Score dominante + cards com tendência +
   heatmap).
2. **`SiteMap`** geográfico das usinas — **[depende de backend]**: requer
   `latitude`/`longitude` por usina. Opções: (a) colunas novas preenchidas
   manualmente; (b) geocodificação a partir do CEP/endereço já cadastrados
   (worker), persistida. Até lá, **[mock]** com pins fictícios e aviso visível.
3. **Modo NOC/SOC** completo na SolisCloud (tiles + timeline + alarmes acionáveis).
4. **Densidade adaptativa mobile** (tabela → cards) e polimento final.

---

## 9. Riscos técnicos

| Risco | Mitigação |
|---|---|
| Regressão visual ao mexer em `globals.css` | Tokens **aditivos**; não renomear classes existentes; revisar tela a tela. |
| Heatmap/timeline pesarem no cliente | Agregar no banco (SQL), paginar/limitar janelas; `@nivo` já instalado. |
| Health Score "enganoso" (fórmula ruim) | Definir fórmula transparente e versionada; mostrar o "porquê" (drill-down). |
| Mapa sem coordenadas | Fase 3, marcado **[depende de backend]**; mock claramente sinalizado. |
| Comparativos "hoje×ontem" com dia parcial | Comparar **mesmo horário** (já fazemos no eixo do dia); rotular como parcial. |
| Inline styles dificultando tema | Migração gradual para classes/tokens, sem big-bang. |
| Custo de re-render (TanStack) | Manter chaves de query atuais; memoizar séries derivadas. |
| Acessibilidade/contraste | Validar AA nos novos tokens; foco visível; `aria` nos novos componentes. |

**Não serão alterados sem aviso explícito:** endpoints/contratos de API,
autenticação (`iron-session`), permissões, regras de negócio (aderência,
conciliação, rateio, faturas) e o schema — exceto a adição opcional de
`latitude/longitude` na Fase 3 (sinalizada).

---

## 10. Checklist de implementação

**Fase 1**
- [ ] Tokens: tipografia, espaçamento, severidade, elevação, raios (`globals.css`).
- [ ] Primitivos: `Badge`, `Button`, `Tabs`, `Skeleton/Empty/Error`.
- [ ] `Sparkline` + `MetricCard`.
- [ ] Adoção de `MetricCard` em Executivo e Início (apresentação, não dados).
- [ ] Tabelas: zebra + sticky + destaque de severidade (evolução do `DataTable`).
- [ ] Refino de contraste (`--muted` escuro) e gradiente sutil do hero/anel.
- [ ] Revisão visual tela a tela + checagem de tema claro/escuro.

**Fase 2**
- [ ] Queries derivadas: health, incidentes, timeline, heatmap, comparativos.
- [ ] `HealthScore` + `StatusBanner` (Início/Executivo).
- [ ] `AttentionCenter` + `IncidentItem`.
- [ ] `OperationalTimeline`.
- [ ] `GenerationHeatmap` + `ComparisonChart`.
- [ ] `StatTile` (NOC/SOC) na SolisCloud.

**Fase 3**
- [ ] Hero executivo premium.
- [ ] `SiteMap` (definir origem de coordenadas; mock se necessário).
- [ ] NOC/SOC completo (tiles + timeline + alarmes acionáveis).
- [ ] Densidade adaptativa mobile (tabela → cards).
- [ ] Polimento, acessibilidade AA, QA final.

---

## 11. Sugestões de nomes para componentes

- **Saúde/atenção:** `HealthScore`, `HealthRing`, `StatusBanner`,
  `AttentionCenter`, `IncidentItem`, `SeverityBadge`, `IncidentList`.
- **Métrica/insight:** `MetricCard`, `Sparkline`, `TrendBadge`, `DeltaIndicator`,
  `ComparisonChart`, `ThresholdBar`.
- **Operação:** `OperationalTimeline`, `TimelineEvent`, `StatTile`, `NocGrid`,
  `LiveFleetGrid`, `CommHealthCard`.
- **Solar/energia:** `GenerationHeatmap`, `SiteMap`, `SitePin`, `EnergyTrend`,
  `ExpectedBandChart`.
- **Primitivos:** `Badge`, `Button`, `Tabs`, `Toolbar`, `Card`, `Stat`, `Filter`.

> Convenção: manter o padrão atual (PascalCase, um componente por arquivo em
> `src/components/`, subpasta por domínio quando fizer sentido — ex.:
> `src/components/operacao/`, `src/components/insights/`).

---

## 12. Arquivos prováveis a alterar/criar

> **Alterar** = enriquecer sem quebrar. **Criar** = aditivo.

**Design system**
- `src/app/globals.css` *(alterar: novos tokens/classes, aditivos)*.
- `src/components/states.tsx` *(alterar: padronizar Skeleton/Empty/Error)*.
- `src/components/Badge.tsx`, `Button.tsx`, `Tabs.tsx` *(criar primitivos)*.

**Insights / métricas**
- `src/components/MetricCard.tsx`, `Sparkline.tsx`, `TrendBadge.tsx`,
  `ComparisonChart.tsx` *(criar)*.
- `src/lib/dashboard-data.ts` *(alterar: helpers de delta/tendência)*.

**Saúde / atenção / operação**
- `src/components/operacao/HealthScore.tsx`, `StatusBanner.tsx`,
  `AttentionCenter.tsx`, `IncidentItem.tsx`, `OperationalTimeline.tsx`,
  `StatTile.tsx` *(criar)*.
- `src/lib/soliscloud/telemetria-db.ts` *(alterar: queries de health, incidentes,
  timeline, heatmap, comparativos — leitura no banco, sem novo endpoint)*.
- `src/lib/digitalgrid/queries.ts` *(alterar: inadimplência p/ health/atenção)*.

**Telas (apresentação; sem mudar dados/contratos)**
- `src/app/(dashboard)/page.tsx` *(Início: StatusBanner + MetricCard + mini-atenção)*.
- `src/app/(dashboard)/executivo/page.tsx` *(hero premium + tendências + heatmap)*.
- `src/app/(dashboard)/soliscloud/page.tsx` *(tiles NOC/SOC + timeline + alarmes acionáveis)*.
- `src/app/(dashboard)/usinas/page.tsx`, `geracao/page.tsx`, `analise/page.tsx`,
  `financeiro/page.tsx`, `rateio/page.tsx` *(adoção de primitivos/insights)*.
- `src/components/StationCard.tsx`, `AlarmsByStation.tsx`, `UsinasTable.tsx`,
  `FaturasDgTable.tsx`, `RateioDgTable.tsx` *(enriquecer apresentação)*.

**Mapa (Fase 3 — depende de backend)**
- `src/components/operacao/SiteMap.tsx` *(criar)*.
- `src/lib/db/schema.ts` *(**somente se aprovado**: `latitude`/`longitude` em
  `usinas`)* + worker de geocodificação por CEP/endereço *(opcional)*.

---

### Resumo executivo do plano

A ASCENDER já tem a **fundação certa** (sync-first, tokens, papéis de tela). O
salto para "inteligência operacional" se faz em **3 fases incrementais**:
(1) refinar o sistema visual e a hierarquia; (2) adicionar **Health Score, Centro
de Atenção, Timeline, Heatmap e comparativos** — todos **derivados do banco**, sem
novos endpoints; (3) **experiência premium** (hero executivo, NOC/SOC, mapa). Nada
é removido; quase tudo é derivado de dados existentes; o único item que exige
backend (coordenadas para o mapa) está isolado na Fase 3 e claramente sinalizado.
