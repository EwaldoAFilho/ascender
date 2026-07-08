# Runbook: investigar sync (SolisCloud / Digital Grid)

Contexto: [`../fluxos/sincronizacao-dados.md`](../fluxos/sincronizacao-dados.md).
Workers são serviços Docker separados que gravam no banco.

## Ver logs dos workers
```bash
docker compose logs -f sync-telemetria   # SolisCloud telemetria (~10 min)
docker compose logs -f sync              # geração mensal (~6 h)
docker compose logs -f sync-dg           # Digital Grid faturas+rateio (~15 min)
```
Mensagens típicas de falha benigna: `pulado (sem token?)` / `sem credencial?` — o
ciclo é ignorado e repetido depois.

## Ver o histórico no banco
```bash
docker exec ascender-app-db-1 psql -U ascender -d ascender -c \
  "select * from sync_runs order by 1 desc limit 20;"
# frescor da telemetria:
docker exec ascender-app-db-1 psql -U ascender -d ascender -c \
  "select max(created_at) from telemetria_estacao;"
```

## Rodar um sync sob demanda (dentro do container)
```bash
docker exec ascender-app-app-1 sh -c 'cd /app && npm run db:sync-telemetria'
docker exec ascender-app-app-1 sh -c 'cd /app && npm run dg:preview'   # preview DG
```

## Credenciais
Configuradas em `/configuracoes/integracoes` (armazenadas em
`integration_credentials`, criptografadas — `lib/crypto/`). Teste pelos endpoints
`api/integrations/{soliscloud,digitalgrid,ai}/test`.

## Se a tela está desatualizada
As telas leem do **banco**, não da API. Dado velho = worker não rodou / falhou. Cheque
logs e `sync_runs` acima antes de suspeitar da tela.
