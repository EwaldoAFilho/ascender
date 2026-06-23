# PLANO — Fase 3D · QA visual final / polimento premium / responsividade

Revisão final de UX/UI da aplicação inteira (11 telas), **diagnóstico-primeiro**:
auditar → classificar (crítico / pequeno-seguro / depois / risco) → aplicar
**apenas ajustes pequenos, visuais, aditivos e reversíveis**. **Sem features,
sem migration/endpoint, sem mudar regra de negócio, sem refatoração grande.**

> **Fora do escopo:** novas features, migrations, endpoints, geocodificação,
> novos mapas/heatmaps, refatoração grande, mudança de regra de negócio, auth,
> schema, contratos de API.

---

## 1. Método (honesto)

- **Sem navegador neste ambiente** → auditoria por **código** (tokens, JSX, CSS,
  media queries) + **simulação**. Tema/pixel/mobile real exigem **olho humano** (👁).
- Auditoria feita por **4 varreduras paralelas** (design system + 11 telas +
  componentes compartilhados), com **verificação manual** dos achados "CRÍTICO"
  antes de qualquer mudança (descartando falsos-positivos).

## 2. Telas auditadas

Início · Executivo · SolisCloud · Usinas · Geração · Análise · Financeiro ·
Rateio · Cadastros · Mapa · Configurações (+ Integrações/Propostas, extras).

## 3. Eixos avaliados

Tema claro/escuro · desktop/mobile · contraste · excesso de altura · duplicidade
· estados vazios/loading · tabelas · botões · badges · cards · tabs ·
consistência de títulos · clareza de navegação.

## 4. Achado principal (seguro e de alto valor)

**Acentuação ausente nos títulos/subtítulos de navegação** — `viewTitles`,
`viewSubtitles` (renderizados no cabeçalho de **toda** tela) e `modules[]`
(sidebar) estão sem acentos: "Operacao", "Potencia", "geracao", "conciliacao
automatica", "Configuracoes", "Analise de geracao"… É **texto de exibição**
(zero risco de comportamento) e o ganho premium é imediato. → **1º commit.**

## 5. Estratégia de aplicação

| Classe | Ação nesta fase |
|---|---|
| **CRÍTICO** (verificado) | corrigir se pequeno/seguro; senão, reportar. |
| **PEQUENO-SEGURO** | aplicar em **commits pequenos** (acentuação, consistência de cabeçalho, CSS aditivo). |
| **DEPOIS** | só **reportar** (sem aplicar) — ex.: refatorar navegação, tokenizar espaçamentos, alturas de gráfico responsivas. |
| **RISCO** | **não tocar** (mobile table transform, navegação global, regra de negócio). |

## 6. Falsos-positivos já descartados (verificados no código)

- `globals.css:2243 overflow-x: visible` **não é bug**: está dentro de
  `@media (max-width:760px)` onde a tabela vira **cards** (thead oculto,
  `min-width:0`) — scroll horizontal não se aplica.
- `--muted` "duplicado" no tema escuro: há 2 blocos `:root[data-theme="dark"]`;
  o 2º vence (#b4c2cb). É código morto cosmético, **sem bug visível**.

## 7. Arquivos prováveis (ajustes pequenos)

| Arquivo | Mudança |
|---|---|
| `src/lib/dashboard-data.ts` | acentuação de `viewTitles`/`viewSubtitles`/`modules[]` (texto). |
| `src/app/(dashboard)/layout.tsx` | acentuação dos títulos de fallback. |
| (eventual) `src/app/globals.css` | CSS **aditivo** (ex.: media query de filtros) se for seguro. |

## 8. Riscos

- Não mexer em: transformação tabela→card no mobile; navegação global
  (sidebar/MobileNav); cálculo de meta/rateio/faturas/telemetria; tokens de marca.
- Mudanças de texto não afetam chaves/IDs (apenas valores de exibição).

> Diagnóstico completo e o que foi aplicado: ver
> `RELATORIO_FASE_3D_QA_VISUAL_FINAL.md`. Sem merge nesta fase.
