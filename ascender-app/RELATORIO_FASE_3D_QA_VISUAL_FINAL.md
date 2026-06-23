# RELATÓRIO — Fase 3D · QA visual final / polimento premium / responsividade

Branch: `ux/fase-3d-qa-visual-final`

QA visual de toda a aplicação (11 telas + design system), **diagnóstico-primeiro**.
Auditoria por **código** (4 varreduras paralelas) + **verificação manual** dos
achados antes de qualquer mudança. Aplicados **apenas** ajustes pequenos, visuais
e reversíveis; o restante está **reportado** para sua decisão.

> **Honestidade:** sem navegador aqui → tema/pixel/mobile real exigem olho humano
> (👁). Achados de "contraste" são a nível de token (estimados), não medidos em
> tela. Distingo abaixo **[verificado]** (li o código) de **[sugerido]** (achado
> de varredura ainda não confirmado linha a linha).

---

## 1. Falsos-positivos descartados (verificados)

- **`globals.css:2243 overflow-x: visible` — NÃO é bug.** Está dentro de
  `@media (max-width:760px)`, onde a tabela vira **cards** (`thead` oculto,
  `min-width:0`, células com `data-label`). Scroll horizontal não se aplica. ✔
- **`--muted` "duplicado" no tema escuro — cosmético.** Há 2 blocos
  `:root[data-theme="dark"]` (linhas 32 e 97); o 2º (#b4c2cb) vence. A linha 35 é
  código morto, **sem bug visível**. ✔

## 2. Aplicado nesta fase (2 commits pequenos)

| Commit | Mudança | Risco |
|---|---|---|
| `fe1e985` | **Acentuação** de `viewTitles`/`viewSubtitles` (cabeçalho de **toda** tela) e `modules[]` (sidebar) + títulos de fallback do layout. Texto de exibição apenas. | nulo (sem chave/ID/lógica) |
| `5cd2a46` | **Consistência** do panel-header "Tendência do ano" (Executivo): `<div>`+`<p>` descritivo (era a única seção com `<h2>` solto). | mínimo (aditivo) |

Exemplos corrigidos: Operacao→**Operação**, Potencia→**Potência**, geracao→
**geração**, conciliacao automatica→**conciliação automática**, inadimplencia→
**inadimplência**, Integracoes→**Integrações**, Configuracoes→**Configurações**,
"Analise de geracao"→**"Análise de geração"**, "Historico de geracao"→**"Histórico
de geração"**.

## 3. Diagnóstico por categoria

### 3.1 CRÍTICO
- **Nenhum bug crítico real.** Os 2 itens marcados "crítico" pelas varreduras eram
  falso-positivo / cosmético (§1). Os **typos de acento** (alta visibilidade) já
  foram **corrigidos** (§2).

### 3.2 PEQUENO-SEGURO — recomendado (NÃO aplicado; aguarda seu ok)
- **[verificado] Estados vazios inconsistentes:** Início (`page.tsx:134`), Usinas
  (`usinas/page.tsx:95,105,129`), Financeiro (`financeiro/page.tsx:100`), Rateio
  (`rateio/page.tsx:78`) e o filtro vazio da SolisCloud usam `<p style={{color:
  muted}}>` em vez do componente `<EmptyState>`. Unificar deixaria os vazios
  premium — mas **muda a aparência** dos vazios, então prefiro sua aprovação.
- **[sugerido] Cor inline `var(--success)` no JSX** (`page.tsx:135`,
  `executivo:151`, `usinas:134`) em vez de `tone` do `SummaryItem`/classe.
- **[sugerido] `SummaryStrip` fora de `.panel`** na Análise (`analise/page.tsx:164`)
  — quebra o enquadramento em painel das demais telas.
- **[sugerido] Grids de filtro 2-col sem breakpoint mobile** em `FaturasDgTable`
  (~169) e `RateioDgTable` (~90) — em telas muito estreitas pode apertar.
- **[sugerido] `stat-tile-row` `minmax(150px)`** pode ficar apertado em 641–760px;
  `minmax(170–180px)` respiraria melhor.

### 3.3 DEPOIS (reportar; fora de "pequeno")
- **Alturas de gráfico fixas** (`GenerationChart` 320px; Análise Nivo 360px) sem
  media query mobile → ocupam muita altura no celular.
- **Centralizar navegação** sidebar (`layout.tsx`) × `MobileNav` (rotas
  hardcoded) — hoje funciona, mas não é DRY. **Refatoração → não nesta fase.**
- **Tokenizar espaçamentos hardcoded** (`gap/padding` em px) e `font-size` px →
  tokens `--sp-*`/`--fs-*` (varredura achou dezenas; manutenção, não urgente).
- **Contraste de `th` (cabeçalho de tabela) em tema claro** (`--brand-yellow`
  sobre `--surface-soft`) — revisar com medidor real (👁).
- **Skeleton de loading no `/mapa`** (server component sem fallback explícito).
- **Limpar `--muted` morto** (linha 35) — cosmético.

### 3.4 RISCOS — não tocar
- Transformação **tabela→card no mobile** (`globals.css:2236+`): cascata frágil.
- **Navegação global** (sidebar/MobileNav/`resolveHeader`): usada em todas as rotas.
- **Regra de negócio** (meta/rateio/faturas/telemetria/geração): proibido.
- **Tokens de marca** (`--brand-*`, `--page-bg`): identidade visual.
- **`DataTable`**: reusado em todos os cadastros — mudanças propagam.

## 4. Resumo por tela (auditado)

| Tela | Veredito |
|---|---|
| Início | OK; vazio "Frota ao vivo" usa `<p>` inline (3.2). |
| Executivo | **corrigido** cabeçalho (§2); possível duplicidade de métrica (PowerRing × MetricCard) — design, manter. |
| SolisCloud | OK (NOC/SOC da 3C); filtro vazio usa `<p>` (3.2). |
| Usinas | vazios inline (3.2); densidade vertical no mobile (design). |
| Geração | OK; altura de gráfico (3.3). |
| Análise | `SummaryStrip` fora de painel + altura de gráficos (3.2/3.3). |
| Financeiro | vazio inline (3.2); grid de filtro mobile (3.2). |
| Rateio | vazio inline (3.2); grid de filtro mobile (3.2). |
| Cadastros | OK; densidade de formulário no mobile (3.3). |
| Mapa | OK (3B-C); sem skeleton (3.3). |
| Configurações | **título corrigido** (§2). |

## 5. Verificação

- `npx tsc --noEmit` → **OK** (exit 0) após cada commit.
- `npm run build` → **OK** (exit 0; 12/12 páginas) após cada commit.

## 6. Conclusão

Aplicados **2 ajustes pequenos e seguros** (acentuação + 1 cabeçalho). **Nenhum
bug crítico real**; os "críticos" das varreduras eram falso-positivo/cosmético.
Os demais achados estão **classificados e reportados** (PEQUENO-SEGURO a aprovar /
DEPOIS / RISCO) — **não** apliquei os que mudam aparência ou exigem refatoração,
respeitando "diagnóstico-primeiro".

**Sugestão de próximo passo (se aprovar):** um commit de unificação dos estados
vazios (`EmptyState`) — o de maior ganho premium entre os PEQUENO-SEGURO.

> **Sem merge.** Branch `ux/fase-3d-qa-visual-final`. Sem features/migration/
> endpoint/schema/auth/regra de negócio; nada removido.
