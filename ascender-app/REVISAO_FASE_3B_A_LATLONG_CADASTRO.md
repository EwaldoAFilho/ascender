# REVISÃO — Fase 3B-A · Latitude/Longitude no Cadastro

Branch: `ux/fase-3b-a-latlong-cadastro`

> **Método:** revisão por **código** + **execução** (réplica fiel da validação +
> reconfirmação da migration no Postgres). Itens visuais (form/tabela) → **olho
> humano** (👁). **Nenhum ajuste de código foi necessário.**

Legenda: ✔ verificado/executado · 👁 requer olho humano

---

## 1. Migration `0015` (tarefa 2)

```sql
ALTER TABLE "usinas" ADD COLUMN "latitude"  double precision;
ALTER TABLE "usinas" ADD COLUMN "longitude" double precision;
```

| Critério | Veredito |
|---|---|
| Aditiva | ✔ apenas `ADD COLUMN` |
| `latitude`/`longitude` nullable | ✔ sem `NOT NULL` |
| Sem default | ✔ |
| Sem alteração destrutiva | ✔ (não dropa/renomeia/altera tipo) |
| Rollback documentado | ✔ `DROP COLUMN latitude, longitude` (PLANO/RELATORIO) |
| Apply/revert testada | ✔ aplicada+revertida em transação no Postgres real (turno anterior) |

## 2. Schema/tipos (tarefa 3)

- ✔ `latitude`/`longitude` (`double precision`, nullable) presentes em `usinas`.
- ✔ `listUsinas` traz os dois campos; cadastro lê/escreve via `CrudSection`.
- ✔ **Usinas antigas não quebram:** colunas nullable, sem default → registros
  existentes ficam com `null`; `tsc`/`build` OK.

## 3. Validações (tarefa 4) — **executadas** (réplica fiel do `optCoord`)

| Entrada (lat) | Resultado |
|---|---|
| `""`, `"  "`, `null`, `undefined` | → **null** (permite salvar sem coords) ✔ |
| `"-15.793889"` | → -15.793889 ✔ |
| `"90"`, `"-90"` | → aceitos (limites) ✔ |
| `"-91"` | → **bloqueado**: "Latitude deve estar entre -90 e 90." ✔ |
| `"abc"` | → **bloqueado** (não-numérico) ✔ |
| `"  -15.79  "` | → -15.79 (trim) ✔ |

| Entrada (long) | Resultado |
|---|---|
| `"-47.882778"`, `"-180"` | aceitos ✔ |
| `"181"`, `"180.0001"` | **bloqueados**: "Longitude deve estar entre -180 e 180." ✔ |

- ✔ latitude/longitude **aceitam vazio/null**; faixa validada; inválidos
  **bloqueados com mensagem clara**; **salvar usina sem coordenadas continua
  permitido**. Validação no **server action** (zod) — fonte única.

## 4. Cadastro/listagem (tarefa 5)

- ✔ (código) 2 campos numéricos **opcionais** (Latitude/Longitude) com placeholders;
  não obrigatórios. 👁 confirmar que não poluem o modal.
- ✔ **Coluna "Geo" discreta:** célula **📍** (ambas coords) / **—**; **ordenável**
  por `sortValues` (`1`/`0`) → não quebra a ordenação.
- ✔ Coordenadas **não** aparecem como números crus na tabela (só o indicador 📍/—)
  → não polui.

## 5. `db:map-readiness` (tarefa 6)

- ✔ Mede **com latitude**, **com longitude**, **com ambas (prontas para pino)** +
  percentuais.
- ✔ Continua **mascarando** (CEP 5 dígitos, endereço truncado, sem-geo só nome).
- ✔ **Somente leitura** — verificado: todos os 6 `db.execute` são `SELECT`; os
  "matches" de palavras de escrita são **falsos positivos em comentários**
  ("não **altera**"/"alterado"), não SQL.
- ✔ Pré-check passou a exigir também `latitude`/`longitude` → avisa se a `0015`
  ainda não foi aplicada.

## 6. Verificação (tarefa 7)

- `npx tsc --noEmit` → **OK** (exit 0).
- `npm run build` → **OK** — "Compiled successfully" (exit 0).
- Migration `0015` → apply/revert OK no Postgres real.

## 7. Conclusão

**Aprovado para merge.** Migration aditiva/segura/reversível; lat/long nullable;
validações corretas (executadas) com mensagens claras; cadastro continua salvando
sem coordenadas; coluna "Geo" discreta e ordenável; `db:map-readiness` mede
coordenadas, mascara e é só-leitura. **Nenhum ajuste de código foi necessário.**

> **Sem merge.** Fase 3B-B (mapa por pinos) **não iniciada**.
