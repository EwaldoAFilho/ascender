# REVISÃO — Fase 3B-B · Mapa por pinos das usinas

Branch: `ux/fase-3b-b-mapa-pinos`

> **Método:** revisão por **código** + **simulação determinística** da projeção e
> da lógica de seleção. **Sem navegador/captura** → tema/pixel exigem **olho
> humano** (👁).

Legenda: ✔ verificado/executado · 👁 requer olho humano · ⚠ observação

---

## 1. Ajuste aplicado nesta revisão (pequeno, seguro)

**Portabilidade CSS:** `rx`/`r` como **propriedades CSS** (`.map-frame { rx:8 }`
e `circle { r:6 }` no hover) **não funcionam no Safari** (cosméticos, não
quebram, mas inconsistentes). Corrigido:
- arredondamento da moldura via **atributo SVG** `rx={8}` no `<rect>`;
- hover trocado por **`fill-opacity`** (portável) no halo do pino.

## 2. Cenários (simulação determinística)

| Cenário | Resultado | OK |
|---|---|---|
| Nenhuma usina com lat/long | `pins=[]` → estado vazio; KPIs "No mapa 0/Y" | ✔ |
| Uma com coordenadas | 1 pino | ✔ |
| Várias com coordenadas | N pinos | ✔ |
| Coords + sem-coords misturadas | pinos + lista discreta "sem coordenadas" | ✔ |
| Coord **fora do bbox** do Brasil | **clamp** à moldura (não quebra) | ✔ |
| **Lat/long invertidas** (ex.: lat −47.88, long −15.79) | ambos válidos por faixa → **clamp** no canto (não quebra) | ✔ ⚠ ver §6 |
| Pinos próximos/sobrepostos | empilham (z-order) + tooltip; ok p/ poucas usinas | ✔ |
| Status online | pino **verde** (`--sev-ok`) | ✔ |
| Status alarme | pino **âmbar** (`--sev-warning`) | ✔ |
| Status offline | pino **vermelho** (`--sev-critical`) | ✔ |
| Status sem telemetria | pino **neutro** (`--muted`) | ✔ |

Projeção conferida com coords reais: **DF/GO no centro**, extremos N/S no
topo/base, fora-do-Brasil → borda.

## 3. Rota `/mapa` (tarefa 3)

- ✔ **Server component** (sem `"use client"`).
- ✔ **Sem endpoint novo** (queries chamadas direto no server).
- ✔ **Apenas dados do banco:** `getUsinasComTelemetria()` + `listUsinas()`.
- ✔ **Sem API externa**, ✔ **sem tiles externos** (SVG puro).
- ✔ **Não quebra sem coordenadas:** `pins=[]` → mensagem; página renderiza.

## 4. Navegação (tarefa 4)

- ✔ Item **"Mapa"** na **sidebar** (com estado `active`).
- ✔ Item **"Mapa"** no **"Mais"** do mobile.
- ✔ **Header** correto (`resolveHeader` → "Mapa das usinas").
- ✔ **Não polui** (1 item em cada); o "Mais" é uma sheet rolável → não quebra o
  mobile.

## 5. Componente `UsinasMap` (tarefa 5)

- ✔ **Apresentação pura** — verificado: **0** ocorrências de `getDb/fetch/await/
  import de queries/db` no arquivo. Recebe `pins` + `semCoords`.
- ✔ **Tooltip** (`<title>`): nome · kWp · status.
- ✔ **Legenda** de status (4 cores).
- ✔ Lista **sem-coordenadas** discreta (`<details>` colapsável).
- ✔ **Contadores** corretos (a página separa `pins` × `semCoords` por `id`).
- ✔ **Link** `<a href="/usinas">` em cada pino.
- ✔ **Estado vazio** quando não há pinos.

## 6. Observações / limitações

- **Lat/long invertidas** passam na validação (ambos são valores válidos por
  faixa) e o pino vai para o **canto** (clamp). ⚠ **Recomendação futura (não
  agora):** detectar coordenadas **fora do bounding box do Brasil** e sinalizar no
  cadastro/mapa — fica documentado (regra desta fase: não adicionar bbox/contorno
  agora).
- **Sem contorno do Brasil** (só moldura + retícula) — documentado como **próximo
  passo** (GeoJSON local/`@nivo/geo`), conforme permitido.

## 7. Revisão visual (👁)

| Item | Status |
|---|---|
| Tema escuro / claro | 👁 (cores e superfícies por tokens com override dark) |
| Desktop / mobile | ✔ código (SVG `width:100%`, `max-width:640px`, `viewBox`) |
| Moldura + retícula suficientes p/ v1? | 👁 — **honestamente mínimo**, mas funcional e legível |
| Ausência do contorno compromete muito? | 👁 — compromete a *percepção "mapa"*; aceitável p/ v1 com a evolução documentada |
| Premium o bastante p/ navegação? | 👁 — **suficiente p/ v1**; o salto premium é o contorno do país (próx. passo) |

## 8. Verificação

- `npx tsc --noEmit` → **OK** (exit 0).
- `npm run build` → **OK** — `/mapa` registrada; 12/12 páginas (exit 0).

## 9. Conclusão

**Aprovado para merge** (técnico). Cenários corretos (incl. clamp e estados
vazios), rota **server sem endpoint**, componente **puro**, navegação discreta.
Ajuste desta revisão: **portabilidade CSS** (Safari). Pendente o **carimbo visual
humano** (temas/mobile) e a decisão sobre o **contorno do Brasil** como próxima
evolução.

> **Sem merge.** Próxima fase não iniciada.
