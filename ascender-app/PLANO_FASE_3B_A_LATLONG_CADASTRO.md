# PLANO — Fase 3B-A · Latitude/Longitude no Cadastro de Usinas

Preparar o terreno para o **mapa por pinos** (caminho B, decidido na 3A-1):
adicionar **latitude/longitude opcionais** às usinas e permitir **preenchimento
manual** no cadastro. **Sem mapa, sem geocodificação, sem API externa.**

> **Fora do escopo:** SiteMap, mapa visual, rota `/mapa`, componente de mapa,
> geocodificação automática/batch, tiles, NOC/SOC completo.

---

## 1. Migration necessária (aditiva)

`drizzle/0015_usina_latlong.sql`:
```sql
ALTER TABLE "usinas" ADD COLUMN "latitude"  double precision;
ALTER TABLE "usinas" ADD COLUMN "longitude" double precision;
```
- **Aditiva e segura:** apenas `ADD COLUMN`, **nullable**, sem default, sem índice,
  sem tocar dados existentes. Rollback trivial (`DROP COLUMN`).

## 2. Campos novos

| Campo | Tipo | Nullable | Faixa válida |
|---|---|---|---|
| `latitude` | `double precision` | ✅ | −90 a 90 |
| `longitude` | `double precision` | ✅ | −180 a 180 |

## 3. Validações

- **Vazio → `null`** (não bloquear salvar usina sem coordenadas).
- **Latitude** ∈ [−90, 90]; **Longitude** ∈ [−180, 180]; precisa ser **número
  finito**; fora da faixa → erro com mensagem clara (não salva).
- Validação no **server action** (zod `optCoord(min,max)`), fonte única de verdade.

## 4. Impacto no cadastro

- Form de usina (`/cadastros/usinas`) ganha **2 campos numéricos** opcionais
  (Latitude/Longitude) com placeholders de exemplo (Brasília).
- Tabela de usinas ganha **1 coluna discreta "Geo"** (📍 quando tem ambas, "—"
  caso contrário) — sem poluir.
- **Nada obrigatório:** usinas seguem salvando sem coordenadas.

## 5. Uso futuro pelo mapa (Fase 3B-B)

- O mapa por pinos lerá `latitude/longitude` (quando ambas presentes) para
  posicionar a usina; usinas sem coordenadas **não** aparecem no mapa (ou entram
  numa lista "sem localização").
- Como é **manual**, a precisão é responsabilidade do cadastro — sem dependência
  externa, sem ToS/limite de API.

## 6. Riscos (e mitigação)

| Risco | Mitigação |
|---|---|
| Coordenada trocada (lat↔long) ou fora do Brasil | faixa validada; mapa futuro pode alertar pontos fora de um bounding box do Brasil (fase 3B-B). |
| Texto não-numérico no campo | zod rejeita com mensagem; não salva. |
| Vírgula decimal (pt-BR) | orientar ponto decimal; o `<input type=number>` usa ponto. (melhoria futura: aceitar vírgula). |
| Regressão no cadastro | mudança **aditiva**; campos existentes intactos; `tsc`/`build` ao final. |

## 7. Plano de rollback

- **Código:** reverter o commit/branch (campos some do form/schema/action).
- **Banco:** `ALTER TABLE usinas DROP COLUMN latitude, DROP COLUMN longitude;`
  (as colunas são nullable e sem dependências → drop seguro).
- Nenhum dado de geração/meta/rateio/fatura/telemetria é afetado.

## 8. Arquivos prováveis

| Arquivo | Mudança |
|---|---|
| `src/lib/db/schema.ts` | + `latitude`/`longitude` em `usinas`. |
| `drizzle/0015_usina_latlong.sql` | migration aditiva. |
| `src/lib/cadastros/actions.ts` | `optCoord` + campos no `usinaSchema`. |
| `src/lib/cadastros/queries.ts` | `listUsinas` traz lat/long. |
| `src/app/(dashboard)/cadastros/usinas/page.tsx` | campos no form + coluna "Geo" + values. |
| `src/lib/db/map-readiness.ts` | medir cobertura de lat/long. |

> **Sem** mapa, rota, endpoint, geocodificação, API externa. **Não** altera regra
> de geração/meta/rateio/faturas/telemetria, auth, rotas existentes ou contratos
> externos.
