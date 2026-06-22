# RELATÓRIO — Script `db:map-readiness`

Utilitário **somente leitura** para medir a prontidão dos dados geográficos das
usinas (decisão: mapa por **UF** × mapa por **pinos** com lat/long).

---

## 1. Arquivos criados/alterados

| Arquivo | Mudança |
|---|---|
| `src/lib/db/map-readiness.ts` | **criado** — script de medição (apenas `SELECT`). |
| `package.json` | **alterado** — adicionado `"db:map-readiness": "tsx src/lib/db/map-readiness.ts"`. |
| `RELATORIO_SCRIPT_MAP_READINESS.md` | **criado** — este relatório. |

> Sem componente, rota, endpoint, migration, schema ou alteração de dados.

## 2. O que o script imprime

- **Pré-check** das colunas `estado/cep/endereco/bairro` (se faltarem, avisa para
  rodar a migration e **sai** sem erro).
- **Cobertura (%):** total, com UF, com CEP, CEP 8 dígitos ok, CEP inválido, com
  endereço, endereço curto, endereço ok, com bairro, **sem dado geo**.
- **Distribuição por UF** (marca UFs **inválidas** fora das 27).
- **Exemplos mascarados:** CEP (só 5 primeiros dígitos + `-xxx`), endereço
  truncado (14 chars + `…`), e usinas **sem geo** (só o nome da usina).
- **Recomendação automática preliminar:**
  - UF ≥ 80% e válida → "Mapa por UF viável";
  - CEP 8d **ou** endereço ok ≥ 70% → "Mapa por pinos viável após lat/long";
  - tudo < 50% → "Melhorar cadastro antes do mapa";
  - sempre lembra o caminho **B (premium)** com lat/long persistido.

## 3. Garantia: somente leitura

- O script contém **apenas `SELECT`** (verificado: nenhum
  `INSERT/UPDATE/DELETE/ALTER/CREATE/DROP/TRUNCATE`).
- CEP e endereço são **mascarados/truncados**; usinas sem geo mostram **só o
  nome**. Não expõe dado sensível completo.

## 4. Comando para rodar na VPS

O script é executado **dentro do container** (que tem `DATABASE_URL` e `tsx`).
Como o código é "baked" na imagem, **rebuild o `app`** após o `git pull` para
incluir o novo script, e então execute:

```bash
cd ~/ascender && git pull && cd ascender-app
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build app
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec app npm run db:map-readiness
```

> O rebuild do `app` é o deploy da `main` atual (já validada). Alternativamente,
> use o serviço `sync` no lugar de `app` (ambos têm `DATABASE_URL`).

Depois, **cole aqui a saída** (já vem mascarada) e eu fecho a recomendação
definitiva **A × B** no `RELATORIO_FASE_3A_1_DATA_READINESS_MAPA.md`.

## 5. Verificação

- `npx tsc --noEmit` → **OK** (exit 0).
- `npm run build` → **OK** (exit 0).

> Fase 3B **não iniciada**.
