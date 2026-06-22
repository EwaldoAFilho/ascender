# RELATÓRIO — Fase 3A-1 · Data Readiness do Mapa

**Objetivo:** medir os dados reais para decidir, com evidência, entre **mapa por
UF** (caminho A) e **mapa por pinos com lat/long** (caminho B). **Nenhum código
alterado.** Sem mapa, componente, rota, endpoint, geocodificação, migration ou
schema.

---

## 0. Limite de ambiente (honestidade)

- **Não tenho acesso à produção (VPS `srv1769779`)** a partir deste ambiente.
- O **banco local está na migration 0010** (journal = 11 entradas, 0000–0010);
  **as migrations 0011 e 0014 não foram aplicadas localmente** → a coluna
  `estado` (e `cep/endereco/bairro`, da 0014) **não existe no banco local**.
  Tentativa local retornou: `ERROR: column "estado" does not exist`.
- **Portanto, a medição precisa ser executada na PRODUÇÃO** (onde o deploy aplicou
  as migrations). Abaixo está o **kit pronto** + a **matriz de decisão**. Os
  números reais ficam **[A PREENCHER COM A PRODUÇÃO]** — **não foram inventados.**

> Antes de medir, confirme na produção que a 0014 foi aplicada:
> ```sql
> SELECT column_name FROM information_schema.columns
> WHERE table_name='usinas' AND column_name IN ('estado','cep','endereco','bairro');
> ```
> (Devem aparecer as 4. Se não, rode o deploy/`db:migrate` antes.)

---

## 1. Query principal (cobertura) — rodar na produção

```sql
SELECT count(*) total,
       count(*) FILTER (WHERE coalesce(estado,'')<>'')   com_uf,
       count(*) FILTER (WHERE coalesce(cep,'')<>'')      com_cep,
       count(*) FILTER (WHERE coalesce(endereco,'')<>'') com_endereco,
       count(*) FILTER (WHERE coalesce(bairro,'')<>'')   com_bairro
FROM usinas;
```

**Resultado (preencher):**

| total | com_uf | com_cep | com_endereco | com_bairro |
|---|---|---|---|---|
| `__` | `__` | `__` | `__` | `__` |
| 100% | `__%` | `__%` | `__%` | `__%` |

---

## 2. Qualidade dos dados — queries de validação (produção)

**2.1 UF fora do padrão** (não é uma das 27 UFs):
```sql
SELECT upper(trim(estado)) AS uf, count(*)
FROM usinas
WHERE coalesce(estado,'')<>''
  AND upper(trim(estado)) NOT IN
  ('AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB',
   'PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO')
GROUP BY 1 ORDER BY 2 DESC;
```
→ linhas aqui = **UF inconsistente** (ex.: "Goiás" em vez de "GO", typo, vazio com espaço).

**2.2 CEP válido (8 dígitos) × incompleto:**
```sql
SELECT
  count(*) FILTER (WHERE regexp_replace(coalesce(cep,''),'\D','','g') ~ '^[0-9]{8}$') AS cep_8d_ok,
  count(*) FILTER (WHERE coalesce(cep,'')<>''
        AND NOT (regexp_replace(cep,'\D','','g') ~ '^[0-9]{8}$'))             AS cep_invalido
FROM usinas;
```

**2.3 Endereço muito genérico/curto** (< 10 caracteres úteis):
```sql
SELECT count(*) AS endereco_curto
FROM usinas
WHERE coalesce(endereco,'')<>'' AND length(trim(endereco)) < 10;
```

**Resultado (preencher):** UF inválidas: `__` · CEP 8d ok: `__` · CEP inválido:
`__` · Endereço curto: `__`.

---

## 3. Exemplos mascarados (produção) — sem expor dado sensível

> Use mascaramento; **não cole CEP/endereço completos** no relatório.

```sql
-- UF (não sensível): distribuição
SELECT upper(trim(estado)) uf, count(*) FROM usinas
WHERE coalesce(estado,'')<>'' GROUP BY 1 ORDER BY 2 DESC;

-- CEP mascarado (5 primeiros dígitos + xxx)
SELECT nome, left(regexp_replace(cep,'\D','','g'),5) || '-xxx' AS cep_masc
FROM usinas WHERE coalesce(cep,'')<>'' LIMIT 10;

-- Endereço truncado (primeiros ~14 chars)
SELECT nome, left(trim(endereco),14) || '…' AS endereco_trunc
FROM usinas WHERE coalesce(endereco,'')<>'' LIMIT 10;

-- Usinas SEM nenhum dado geográfico (só o nome da usina)
SELECT nome FROM usinas
WHERE coalesce(estado,'')='' AND coalesce(cep,'')=''
  AND coalesce(endereco,'')='' AND coalesce(bairro,'')='' LIMIT 20;
```

**Colar aqui (mascarado):** UF: `__` · CEP_masc: `__` · End_trunc: `__` ·
Sem-geo: `__`.

---

## 4. Matriz de decisão (interpretar os números acima)

| Evidência (produção) | Leitura | Caminho |
|---|---|---|
| `com_uf` ≥ **80%** e UF majoritariamente válida | dá para distribuir por estado | **A (UF) viável como MVP** |
| `cep_8d_ok` ≥ **70%** **ou** `com_endereco` (não-curto) ≥ **70%** | dá para geocodificar com qualidade | **B (pinos) viável** após geocodificação batch |
| Tudo < **50%** | cadastro insuficiente | **Primeiro melhorar o cadastro** (preencher UF/CEP) antes de qualquer mapa |
| Meta = experiência **premium** + dados ok | pino no ponto exato | **B (pinos com lat/long persistido)** |

> Limiares são guias; ajuste ao volume real (com poucas usinas, % é volátil).

---

## 5. Caminhos — risco e custo/benefício

### Caminho A — Mapa por UF (sem schema)
- **Dado:** `estado` (UF). **[derivado]** para o mapa.
- **Esforço:** baixo — `@nivo/geo`/SVG + GeoJSON do Brasil; sem migration, sem
  geocodificação, sem endpoint (se em server component).
- **Risco:** baixa fidelidade (não mostra o ponto exato, só o estado); inútil se
  `estado` estiver vazio/inconsistente.
- **Benefício:** entrega rápida de "distribuição por estado".

### Caminho B — Mapa por pinos (com migration `latitude`/`longitude`)
- **Dado:** lat/long **persistidos** (geocodificados a partir de endereço/CEP, ou
  inseridos manualmente). **[depende de backend]**.
- **Esforço:** maior — **migration aditiva** (`latitude`,`longitude`), **script de
  geocodificação batch** (com cache/fallback manual), e **edição manual** no
  cadastro de usina.
- **Risco:** geocodificação (rate-limit/ToS/privacidade/imprecisão — ver discovery
  3A §7); depende de endereços bem preenchidos.
- **Benefício:** experiência **premium** (pino no local exato, status por site —
  conceito NOC/SOC).

---

## 6. Recomendação final (condicional aos números)

> Como os números reais são **[A PREENCHER]**, a recomendação é **condicional** —
> escolha o ramo conforme a §1/§2:

- **Se `com_uf` ≥ 80% e UF válida, e CEP/endereço fracos:** começar pelo
  **Caminho A (UF)** — MVP rápido, e evoluir para B depois.
- **Se CEP (8d) ou endereço bons (≥ 70%):** ir direto ao **Caminho B (pinos)** —
  vale a **migration `latitude`/`longitude`** + geocodificação batch.
- **Se tudo fraco (< 50%):** **não** fazer mapa ainda — **priorizar o
  preenchimento do cadastro** (UF/CEP) das usinas; reavaliar depois.
- **Independência de tela:** seja A ou B, preferir **SolisCloud** ou **rota
  dedicada `/mapa`** (não Início/Executivo) — ver discovery 3A §8.

### Respostas objetivas (preencher após a execução)
- **Há dados suficientes para mapa por UF?** → depende de `com_uf` (≥ 80%?): **[A
  PREENCHER]**.
- **Há dados suficientes para geocodificação?** → depende de `cep_8d_ok`/
  `com_endereco` (≥ 70%?): **[A PREENCHER]**.
- **Recomenda migration (`lat/long`)?** → **sim, se** o ramo B for escolhido (CEP/
  endereço bons ou meta premium): **[A PREENCHER]**.
- **Pinos ou UF?** → **[A PREENCHER]** conforme a matriz §4.

---

## 7. Verificação

- `npx tsc --noEmit` → **OK** (sem alteração de código).
- `npm run build` → **OK** (sem alteração de código).

> **Próximo passo:** você roda a §1–§3 na produção, cola os números (mascarados),
> e eu fecho a recomendação **definitiva** (A vs B) e, se autorizado, planejo a
> Fase 3B. Nada foi implementado.
