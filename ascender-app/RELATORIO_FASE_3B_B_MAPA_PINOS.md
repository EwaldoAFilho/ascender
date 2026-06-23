# RELATÓRIO — Fase 3B-B · Mapa por pinos das usinas

Branch: `ux/fase-3b-b-mapa-pinos`

Mapa SVG das usinas por **pinos** (lat/long persistidos na 3B-A), com **status
operacional ao vivo**, em **rota dedicada `/mapa`**. **Sem tiles, sem API
externa, sem geocodificação, sem schema/migration.**

---

## 1. Arquivos criados

| Arquivo | Papel |
|---|---|
| `PLANO_FASE_3B_B_MAPA_PINOS.md` | Plano (abordagem, tela, dados, sem-coords). |
| `src/components/UsinasMap.tsx` | Componente SVG **apresentação pura** (pinos + legenda + lista sem-coords). |
| `src/app/(dashboard)/mapa/page.tsx` | Rota **server** `/mapa` (queries + UsinasMap). |
| `RELATORIO_FASE_3B_B_MAPA_PINOS.md` | Este relatório. |

## 2. Arquivos alterados

| Arquivo | Mudança |
|---|---|
| `src/app/(dashboard)/layout.tsx` | **aditivo:** botão "Mapa" na sidebar + título no header. |
| `src/components/MobileNav.tsx` | **aditivo:** "Mapa" no menu "Mais". |
| `src/app/globals.css` | **aditivo:** CSS do mapa (moldura, retícula, pinos, legenda). |

> **Nova rota `/mapa`** (aditiva) — **não** altera rotas existentes. Sem
> componente removido.

## 3. Abordagem (sem dependências externas)

- **SVG próprio**, projeção **equiretangular** sobre o **bounding box do Brasil**
  (lat −33.8..5.4, long −74..−34.7). **Nenhuma lib de mapa, tile ou chamada
  externa.** Coordenadas **só** do banco (sem geocodificar em runtime).
- **Referência geográfica:** moldura + **retícula** (linhas a cada ~10°) com
  rótulos de lat/long. **Contorno do país não desenhado nesta v1** (limitação §7).
- **Projeção validada** (réplica) com coords reais: DF/GO **clusterizam no centro**;
  extremos N/S no topo/base; coord fora do Brasil → **clamp na borda** (não quebra).

## 4. Onde entra (decisão)

**Rota dedicada `/mapa`** (server component) — lê os dados **direto no servidor**
(sem endpoint), **não** polui Início (congelada) nem Executivo (denso). SolisCloud
foi descartada por ser client (exigiria endpoint).

## 5. Dados usados (somente leitura, já existentes)

- `getUsinasComTelemetria()` → `id, nome, potenciaKwp, statusReal` (status **ao
  vivo** quando vinculada). **[real]**
- `listUsinas()` → `id, latitude, longitude` (manuais, 3B-A). **[real]**
- **Merge por `id`**: entram no mapa só as usinas com **lat E long**.

## 6. Comportamento

- **Pinos:** cor pelo `statusReal` (online=verde · alarme=âmbar · offline=vermelho
  · sem telemetria=neutro); **tooltip** com nome · kWp · status; **link** para
  `/usinas`. **Legenda** de status.
- **Sem coordenadas:** **contador** nos KPIs + **lista discreta** ("N usina(s) sem
  coordenadas", colapsável) — **não quebra** o mapa.
- **Estado vazio:** nenhuma usina com coords → mensagem orientando o cadastro.
- **KPIs:** "No mapa X/Y", "Online", "Sem coordenadas".

## 7. Limitações

- **Sem contorno do Brasil** (só moldura + retícula) — é um "scatter geográfico"
  honesto; o desenho do país (`@nivo/geo`/GeoJSON local) fica como **próximo
  passo**.
- **Status ao vivo** só para usinas **vinculadas** à SolisCloud; demais ficam
  "sem telemetria" (neutro).
- **Sem rota de detalhe por usina** → o link vai para `/usinas` (performance).
- Coord fora do bounding box do Brasil → **clamp** (revisar o cadastro).

## 8. Riscos (e mitigação)

| Risco | Mitigação |
|---|---|
| Coordenada trocada/fora do Brasil | clamp à moldura; lista sem-coords; (futuro: alerta de bbox). |
| Poluir navegação | 1 item discreto na sidebar + "Mais" do mobile. |
| Pinos sobrepostos (mesma cidade) | raios pequenos + tooltip; aceitável p/ poucas usinas. |
| Dependência externa | **nenhuma** — SVG puro, sem tiles/API. |

## 9. Verificação

- `npx tsc --noEmit` → **OK** (exit 0).
- `npm run build` → **OK** — 13 rotas (inclui `/mapa`), 12/12 páginas estáticas.
- Projeção conferida com coordenadas reais (DF/GO no centro; clamp p/ fora).

## 10. Próximos passos

- **Contorno do Brasil** (GeoJSON local / `@nivo/geo`) para virar mapa "de verdade".
- Alerta visual para coordenadas fora do Brasil.
- (Opcional) status ao vivo com potência agora no tooltip; agrupar pinos próximos.

> **Sem merge.** Branch `ux/fase-3b-b-mapa-pinos`. Sem geocodificação, API
> externa, tiles, schema, migration; sem alterar regra de geração/meta/rateio/
> faturas/telemetria, auth ou rotas existentes; Início não tocada.
