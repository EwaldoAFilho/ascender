# PLANO — Fase 3B-B · Mapa por pinos das usinas

Mapa visual das usinas usando **latitude/longitude já persistidos** (3B-A), com
**pinos** e **status operacional** quando houver. **Sem geocodificação, sem API
externa, sem tiles externos, sem schema/migration.**

> **Fora do escopo:** geocodificação, API de mapas, tiles, NOC/SOC completo,
> deep-link avançado, alteração da Início, schema/migration.

---

## 1. Abordagem técnica (sem dependências externas)

- **SVG próprio** projetando lat/long (equiretangular) sobre o **bounding box do
  Brasil** — **nenhuma lib de mapa, nenhum tile, nenhuma chamada externa**.
- **Sem geocodificar em runtime:** usa só coordenadas já no banco.
- **Contorno do país:** **não** desenhado nesta v1 (evita autorar GeoJSON/SVG do
  Brasil sem fonte confiável). Em vez disso: **moldura + retícula (graticule) +
  rótulos de lat/long** como referência geográfica. Contorno do Brasil
  (`@nivo/geo`/GeoJSON local) fica como **próximo passo** (limitação documentada).

## 2. Onde entra (decisão)

**Rota dedicada `/mapa`** (novo, **server component**):
- Lê as usinas (coords + status) **direto no servidor** → **sem endpoint novo**.
- **Não** polui Início (congelada) nem Executivo (denso).
- SolisCloud foi descartada para a v1 por ser **client component** (exigiria
  endpoint para os dados do mapa).
- **Navegação:** link discreto na **sidebar** e no menu **"Mais"** do mobile
  (aditivo; não altera rotas existentes).

## 3. Dados usados (somente leitura, já existentes)

- `getUsinasComTelemetria()` → `id, nome, potenciaKwp, statusReal` (status
  operacional ao vivo quando vinculada). **[real]**
- `listUsinas()` → `id, latitude, longitude`. **[real]** (preenchidos manualmente
  na 3B-A).
- **Merge por `id`**: só entram no mapa as usinas com **latitude E longitude**.

## 4. Usinas sem coordenadas

- **Não quebram o mapa.** Aparecem como **contador** + **lista discreta** "sem
  coordenadas" abaixo do mapa (com o nome), orientando preencher no cadastro.

## 5. Pinos indicam

- **Nome** da usina (tooltip + ao focar).
- **Potência kWp** (se disponível).
- **Status** operacional (`statusReal`: online/alarm/offline) → **cor do pino**;
  se ausente, pino **neutro**.
- **Link** para a tela existente **`/usinas`** (não há rota de detalhe por usina;
  usa a de performance).

## 6. Estados/erros

- **Sem nenhuma usina com coordenadas** → estado vazio ("Cadastre latitude/
  longitude das usinas…").
- Coordenada válida porém **fora do bounding box do Brasil** → **clamp** à
  moldura (não quebra), documentado (revisar cadastro).

## 7. Componente

`src/components/UsinasMap.tsx` — **apresentação pura** (recebe pins + lista
sem-coords). SVG responsivo, tema claro/escuro via tokens, legenda de status.

## 8. Arquivos prováveis

| Arquivo | Mudança |
|---|---|
| `src/app/(dashboard)/mapa/page.tsx` | **criar** rota server (queries + UsinasMap). |
| `src/components/UsinasMap.tsx` | **criar** componente SVG. |
| `src/app/(dashboard)/layout.tsx` | **aditivo:** botão "Mapa" na sidebar + header. |
| `src/components/MobileNav.tsx` | **aditivo:** "Mapa" no menu "Mais". |
| `src/app/globals.css` | **aditivo:** CSS do mapa. |

> Sem geocodificação, API externa, tiles, schema, migration. Não altera regra de
> geração/meta/rateio/faturas/telemetria, auth ou rotas existentes.
