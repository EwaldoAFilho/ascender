FROM node:20-alpine

WORKDIR /app

# Compatibilidade para binários nativos pré-compilados (ex.: @node-rs/argon2).
RUN apk add --no-cache libc6-compat

# Dependências (incluindo dev — necessárias para build, migrations e seed).
COPY package.json package-lock.json ./
RUN npm ci

# Código-fonte e build de produção.
COPY . .
RUN npm run build
RUN chmod +x ./docker-entrypoint.sh

EXPOSE 3000
ENV PORT=3000

# O entrypoint aplica migrations + seed e então inicia o servidor.
ENTRYPOINT ["./docker-entrypoint.sh"]
