# REVISÃO — Fase 3B-C · Mapa premium com contorno do Brasil

Branch: `ux/fase-3b-c-mapa-contorno-brasil`

> **Método:** revisão por **código** + **simulação determinística** da projeção.
> **Sem navegador/captura** → tema/pixel e a "cara" da silhueta exigem **olho
> humano** (👁). **Nenhum ajuste de código foi necessário.**

Legenda: ✔ verificado/executado · 👁 requer olho humano · ⚠ observação

---

## 1. Componente `UsinasMap.tsx` (tarefa 2)

| Item | Veredito |
|---|---|
| Contorno **local** | ✔ `BRAZIL_OUTLINE`/`BRAZIL_POLYGON` são **constantes no arquivo** (≈45 vértices). |
| **Sem** fetch/rede/API/dep | ✔ verificado: **0** ocorrências de `fetch/http/getDb/@nivo/leaflet/maplibre/axios`. |
| Mesma projeção (pinos × contorno) | ✔ ambos usam **`project()`** (contorno na linha do `BRAZIL_POLYGON`; pinos no `.map`). |
| Pinos **alinhados** | ✔ mesma `project()` + mesmo `BBOX` → consistência garantida. |
| Tooltip / legenda / lista sem-coords / estado vazio | ✔ preservados (`<title>`, `.usinas-map-legend`, `.usinas-map-sem`, `.usinas-map-empty`). |
| KPIs | ✔ na página `/mapa` (inalterada). |
| Coord fora do Brasil não quebra | ✔ `clamp` na projeção (ver §2). |

## 2. Simulação (executada)

- **DF/GO ~ centro:** Brasília (496,409) e Goiânia (471,425) num canvas de centro
  (380,380) → **região central**, levemente a leste (geograficamente correto p/ o
  DF). ✔
- **Extremos do contorno preenchem o mapa** (turno anterior): norte→topo (y≈32),
  sul→base (y≈730), leste→direita (x≈730), oeste→esquerda (x≈30) — silhueta borda
  a borda, **sem clamp**. ✔
- **Pino fora do bbox não quebra:** Lisboa → **clamp** no canto (758,2); Buenos
  Aires → cai no "mar" abaixo do Brasil (307,746) — **não quebra**. ✔
- **Estado vazio** quando nenhuma usina tem coords; **lista discreta** das
  sem-coords: lógica intacta (na página, separa `pins` × `semCoords`). ✔

## 3. Revisão visual (👁 + código)

| Item | Status | Observação |
|---|---|---|
| Tema escuro / claro | 👁 | "mar" `--surface-soft`, "terra" `color-mix(--brand-blue 14%, --surface)` + borda → adapta via tokens. |
| Desktop / mobile | ✔ código | SVG `width:100%`, `max-width:640px`, `viewBox` → responsivo. |
| Silhueta reconhecível | 👁 | os ~45 vértices traçam os pontos-chave do Brasil (bulge de Roraima, ponta NE em −34.8/−7.3, sul −33.7, oeste −73.9); **simplificada, não cartográfica**. |
| Ausência de fronteiras estaduais | ✔ aceitável p/ v1 | documentado como evolução futura. |
| Mais premium que moldura/retícula? | 👁 (provável **sim**) | silhueta do país lê melhor que retângulo + linhas. |
| `/mapa` leve / não poluída | ✔ | rota 809 B; **sem dependência nova**; um painel + legenda + lista colapsável. |

## 4. Observações / limitações (honestas)

- Silhueta **hand-authored simplificada** (sem rede para um GeoJSON real) →
  **reconhecível, não cartográfica**. Possível leve irregularidade no litoral/
  fronteira; **não compromete** o uso (pinos centrais bem posicionados).
  Refino futuro: GeoJSON local de melhor resolução (sem rede).
- **Equiretangular** → leve distorção (aceitável p/ visão nacional).
- Coord válida mas **fora do Brasil** cai no "mar"/borda (já tratado na 3B-B com
  lista sem-coords + clamp).

## 5. Verificação

- `npx tsc --noEmit` → **OK** (`TSC_EXIT=0`).
- `npm run build` → **OK** (`BUILD_EXIT=0`; `/mapa` registrada).

## 6. Conclusão

**Aprovado para merge** (técnico). Contorno **local**, **sem rede/API/dep**, mesma
projeção dos pinos (alinhados), recursos preservados (tooltip/legenda/KPIs/
sem-coords), out-of-bbox não quebra. **Nenhum ajuste de código necessário.**
Pendente o **carimbo visual humano** (temas/mobile + "cara" da silhueta).

Recomendação registrada (não aplicada): refinar a silhueta com GeoJSON local de
melhor resolução numa evolução futura; alertar coords fora do Brasil.

> **Sem merge.** Nenhuma nova fase iniciada.
