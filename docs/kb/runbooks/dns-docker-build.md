# Runbook: build Docker falhando por DNS (IPv6-only)

## Sintomas
Ao rodar `docker compose build`/`up --build`:
- `npm error Exit handler never called!` durante `RUN npm ci`;
- `apk ... WARNING: ... DNS: transient error` / `ERROR: unable to select packages`;
- `npm error EAI_AGAIN getaddrinfo registry.npmjs.org`.

## Causa
O forwarder de DNS do Docker Desktop (`192.168.65.7`) resolve `registry.npmjs.org` /
`dl-cdn.alpinelinux.org` **só em IPv6**, e a rede dos containers é IPv4 → falha de
resolução nos passos `RUN`. **Não é bug de npm nem do Dockerfile.**

## Correção definitiva (recomendada)
Aponte o daemon para DNS IPv4 público:
1. Edite `~/.docker/daemon.json` (Docker Desktop → Settings → Docker Engine) e
   adicione, preservando o resto:
   ```json
   { "dns": ["8.8.8.8", "1.1.1.1"] }
   ```
2. `systemctl --user restart docker-desktop`
3. Rebuild normal: `docker compose up -d --build`.

Verificar: `docker run --rm alpine cat /etc/resolv.conf` deve mostrar `8.8.8.8`.

## Paliativo (sem mexer no daemon)
```bash
docker build --add-host registry.npmjs.org:104.16.4.34 \
  --add-host dl-cdn.alpinelinux.org:151.101.2.132 -t ascender-app-app .
```
(IPs Cloudflare/Fastly — podem mudar; resolva-os com `docker run --dns=8.8.8.8 alpine getent ahostsv4 <host>`.)

## Cache envenenado
Se um `npm ci` falhou parcialmente e ficou em cache, builds seguintes dão
`sh: next: not found`. Bust com `docker compose build --no-cache`.

> Registrado após incidente em 2026-07-08. A VPS pode ter o mesmo problema no build.
