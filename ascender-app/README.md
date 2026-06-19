# ASCENDER — Sistema Web

Sistema web da ASCENDER (gestão de usinas solares) construído a partir do
protótipo `ascender-dashboard`. Esta primeira fase (MVP) entrega:

- **Login único compartilhado** (e-mail + senha, sessão por cookie httpOnly).
- **Módulo SolisCloud com dados reais** da API (telemetria de usinas,
  inversores e alarmes), com a assinatura HMAC executada no servidor.
- **Tela de configuração de tokens** (`Configurações > Integrações`): cadastro
  das credenciais SolisCloud (cifradas em AES-256-GCM) e teste de conexão.
- **Cadastros-mestre** (distribuidora, cliente, UC, usina, contrato): CRUD real
  persistido no Postgres; a usina vincula ao **Station ID real** da SolisCloud.
- Demais módulos (Executivo, Usinas, Rateio, Financeiro, Propostas, Integrações)
  navegáveis com **dados mock**, prontos para evoluir.

## Stack

Next.js 15 (App Router) · React 18 · TypeScript · TanStack Query · Drizzle ORM ·
PostgreSQL · iron-session · @node-rs/argon2 · `node:crypto` (HMAC + AES-256-GCM).

## Como rodar com Docker (recomendado — servidor próprio)

1. Crie o `.env` a partir do exemplo e preencha os segredos:
   ```bash
   cp .env.example .env
   # Gere as chaves:
   node -e "console.log('APP_ENCRYPTION_KEY=' + require('crypto').randomBytes(32).toString('base64'))"
   node -e "console.log('SESSION_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
   # Defina também LOGIN_EMAIL e LOGIN_PASSWORD.
   ```
2. Suba os serviços (app + PostgreSQL):
   ```bash
   docker compose up --build
   ```
   O container aplica as migrations, faz o seed do login e dos cadastros, e
   inicia o servidor.
3. Acesse `http://localhost:3000` e entre com `LOGIN_EMAIL` / `LOGIN_PASSWORD`.
4. Vá em **Configurações > Integrações**, cadastre o **KeyId** e o **KeySecret**
   da SolisCloud e clique em **Testar conexão**. Com credenciais válidas, o
   módulo **SolisCloud** passa a exibir os dados reais.

> Em produção com HTTPS, defina `APP_BASE_URL=https://seu-dominio` para que o
> cookie de sessão use o atributo `Secure`. Garanta o relógio do host
> sincronizado (NTP): a SolisCloud rejeita a assinatura se o horário divergir
> mais de 15 minutos.

## Desenvolvimento local

```bash
npm install
# Suba um Postgres (ex.: docker run -d -e POSTGRES_USER=ascender \
#   -e POSTGRES_PASSWORD=ascender -e POSTGRES_DB=ascender -p 5432:5432 postgres:16-alpine)
cp .env.example .env   # DATABASE_URL apontando para localhost
npm run db:migrate
npm run db:seed
npm run db:seed:cadastros
npm run dev
```

## Variáveis de ambiente

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | String de conexão do PostgreSQL. |
| `APP_ENCRYPTION_KEY` | Chave mestra (32 bytes base64) p/ cifrar as credenciais. |
| `SESSION_SECRET` | Segredo da sessão (≥ 32 caracteres). |
| `LOGIN_EMAIL` / `LOGIN_PASSWORD` | Credencial inicial do login único (seed). |
| `APP_BASE_URL` | URL pública; define o `Secure` do cookie quando `https://`. |

As chaves da SolisCloud **não** ficam no `.env` — são cadastradas (cifradas)
pela tela de Integrações.

## Estrutura

```
src/
  app/                      # App Router (login, dashboard, rotas /api)
    (dashboard)/            # layout protegido + páginas dos módulos
    api/auth/               # login, logout, troca de senha
    api/soliscloud/         # proxy de leitura (stations, inverters, alarms, status)
    api/integrations/soliscloud/  # credenciais + testar conexão
  lib/
    auth/                   # sessão (iron-session), senha (argon2), guard
    crypto/secrets.ts       # AES-256-GCM
    db/                     # schema, client e seed (Drizzle)
    soliscloud/             # sign (HMAC), client, mappers, credentials
  hooks/ · components/ · types/ · mocks/
```

## Próximas fases (fora do escopo do MVP)

- Integração financeira **Digital Grid** (depende de validação contratual da API).
- Importador da planilha **Controle de Usinas** (Excel).
- Lançamentos/movimentos (geração mensal, faturas, rateio) e **RBAC** com
  múltiplos usuários (a sessão já está modelada para isso).
