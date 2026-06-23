# RELATÓRIO — Fase 3B-C · Mapa premium com contorno do Brasil

Branch: `ux/fase-3b-c-mapa-contorno-brasil`

Adicionado um **contorno do Brasil** (silhueta) ao mapa por pinos, **100% local**:
polígono SVG simplificado embutido, projetado pela **mesma** função dos pinos.
**Sem rede, sem API, sem tiles, sem geocodificação, sem dependência nova.**

---

## 1. Arquivos criados

| Arquivo | Papel |
|---|---|
| `PLANO_FASE_3B_C_MAPA_CONTORNO_BRASIL.md` | Abordagem (por que polígono local). |
| `RELATORIO_FASE_3B_C_MAPA_CONTORNO_BRASIL.md` | Este relatório. |

## 2. Arquivos alterados

| Arquivo | Mudança |
|---|---|
| `src/components/UsinasMap.tsx` | + `BRAZIL_OUTLINE` (≈45 vértices) + `BRAZIL_POLYGON`; troca **moldura/retícula** por **mar + silhueta do Brasil**. Pinos/lista sem-coords **inalterados**. |
| `src/app/globals.css` | `.map-frame`/`.map-grid*` → **`.map-sea`** + **`.map-brazil`** (tema claro/escuro). |

> Nenhum componente removido. Rota `/mapa`, KPIs, navegação: **intactos**.

## 3. Abordagem escolhida (a mais segura)

**Polígono SVG local simplificado** (em vez de `@nivo/geo`/GeoJSON externo):
- coordenadas do contorno **no código** (constante) → **sem rede/API/tiles**;
- **sem dependência nova** (continua SVG puro);
- **mesma `project()`** equiretangular dos pinos → contorno e pinos **alinhados**;
- **reversível** (remover o polígono volta à 3B-B).

## 4. Validação (executada)

- **Extremos do contorno** projetados caem **nas bordas** da área útil (sem
  clamp): norte → topo (y≈32), sul → base (y≈730), leste → direita (x≈730),
  oeste → esquerda (x≈30) — a silhueta preenche o mapa borda a borda.
- **Pinos** continuam na mesma projeção → DF/GO no centro, **sobre** a silhueta.

## 5. Tema claro/escuro

- **Mar:** `--surface-soft`. **Terra:** `color-mix(--brand-blue 14%, --surface)`
  com borda `--brand-blue 42%`. Via tokens → adapta aos dois temas (terra
  levemente azulada destacando-se do mar).

## 6. Limitações (honestas)

- Contorno **simplificado** (~45 pontos, hand-authored sem rede) → silhueta
  **reconhecível**, **não cartográfica** (litoral/fronteiras aproximados).
  Refinar com GeoJSON real (quando houver como obtê-lo **localmente**) fica como
  evolução futura.
- Projeção **equiretangular** → leve distorção (aceitável p/ visão nacional).
- Coordenada **fora do Brasil** pode cair no "mar"/borda (clamp) — já tratado na
  3B-B (lista sem-coords + clamp).

## 7. Verificação

- `npx tsc --noEmit` → **OK** (exit 0).
- `npm run build` → **OK** — `/mapa` registrada; 12/12 páginas (exit 0).
- Extremos do contorno conferidos (réplica da projeção).

## 8. Próximos passos (não agora)

- Refinar a silhueta (GeoJSON local de melhor resolução) — sem rede.
- Alerta para coordenadas fora do bounding box do Brasil.
- (Futuro) divisão por estados / hover de região.

> **Sem merge.** Branch `ux/fase-3b-c-mapa-contorno-brasil`. Sem rede/API/tiles/
> geocodificação/dependência/schema/migration; Início não tocada; Fase 3C não
> iniciada.
