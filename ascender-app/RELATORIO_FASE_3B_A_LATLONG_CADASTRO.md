# RELATÓRIO — Fase 3B-A · Latitude/Longitude no Cadastro de Usinas

Branch: `ux/fase-3b-a-latlong-cadastro`

Adicionados **latitude/longitude opcionais** às usinas, com **edição manual** no
cadastro e **validação de faixa**. **Sem mapa, sem geocodificação, sem API
externa.** Migration aditiva e reversível.

---

## 1. Arquivos criados

| Arquivo | Papel |
|---|---|
| `PLANO_FASE_3B_A_LATLONG_CADASTRO.md` | Plano (migration, validações, rollback). |
| `drizzle/0015_usina_latlong.sql` | Migration aditiva (2 colunas nullable). |
| `RELATORIO_FASE_3B_A_LATLONG_CADASTRO.md` | Este relatório. |

## 2. Arquivos alterados

| Arquivo | Mudança |
|---|---|
| `src/lib/db/schema.ts` | `usinas` ganha `latitude`/`longitude` (`double precision`, **nullable**). |
| `src/lib/cadastros/actions.ts` | helper `optCoord(min,max)` + campos `latitude`/`longitude` no `usinaSchema` (validação de faixa). |
| `src/lib/cadastros/queries.ts` | `listUsinas` passa a trazer `latitude`/`longitude`. |
| `src/app/(dashboard)/cadastros/usinas/page.tsx` | 2 campos no form + coluna discreta **"Geo"** (📍/—) + `values`. |
| `src/lib/db/map-readiness.ts` | mede cobertura de `latitude`/`longitude` e "prontas para pino". |
| `RELATORIO_FASE_3A_1_DATA_READINESS_MAPA.md` | números reais da produção + decisão (caminho B). |

> **Nenhum componente removido.** Sem mapa, rota, endpoint, geocodificação ou API
> externa.

## 3. Migration criada

`drizzle/0015_usina_latlong.sql`:
```sql
ALTER TABLE "usinas" ADD COLUMN "latitude"  double precision;
ALTER TABLE "usinas" ADD COLUMN "longitude" double precision;
```
- **Aditiva, nullable, sem default/índice.** Validada no Postgres real (aplicada e
  revertida em transação). Rollback: `DROP COLUMN latitude, longitude`.

## 4. Validações implementadas

- **Latitude** ∈ [−90, 90]; **Longitude** ∈ [−180, 180]; **número finito**.
- **Vazio → `null`** (não bloqueia salvar usina sem coordenadas).
- Fora da faixa / não-numérico → **erro com mensagem** ("Latitude deve estar entre
  −90 e 90."), não salva.
- Validação no **server action** (zod), fonte única de verdade.

## 5. Impacto no cadastro

- Form de usina: **2 campos numéricos opcionais** (Latitude/Longitude) com
  placeholders de exemplo.
- Tabela: **coluna "Geo"** discreta — **📍** quando há ambas as coordenadas, **—**
  caso contrário (ordenável; não polui).
- Usinas continuam salvando **sem** coordenadas (nada obrigatório).

## 6. Como rodar a migration

No deploy normal, o `docker-entrypoint.sh` roda `npm run db:migrate` no boot — a
`0015` é aplicada automaticamente:
```bash
cd ~/ascender && git pull && cd ascender-app
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```
(É **aditiva e segura**; dados existentes intactos, novas colunas vazias.)

Depois, opcional, medir a prontidão para pino:
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec app npm run db:map-readiness
```

## 7. Verificação

- `npx tsc --noEmit` → **OK** (exit 0).
- `npm run build` → **OK** — "Compiled successfully" + 12/12 páginas (exit 0).
- Migration `0015` validada no Postgres real (rollback).

## 8. Próximos passos — Fase 3B-B (mapa por pinos)

- Preencher manualmente lat/long das usinas (cadastro) e medir com
  `db:map-readiness`.
- **3B-B:** componente de mapa por **pinos** (lib `@nivo/geo`/SVG, **sem tiles
  externos**), lendo `latitude/longitude`; usinas sem coordenadas numa lista "sem
  localização"; tela **SolisCloud** ou rota dedicada **`/mapa`** (a decidir).
- Opcional: alerta para coordenadas fora de um bounding box do Brasil.

> **Não iniciado:** mapa, rota `/mapa`, componente de mapa, geocodificação.
> Branch `ux/fase-3b-a-latlong-cadastro`, **sem merge**.
