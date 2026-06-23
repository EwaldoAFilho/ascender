# PLANO — Fase 3B-C · Mapa premium com contorno do Brasil

Melhorar a percepção do mapa por pinos (3B-B) adicionando um **contorno do
Brasil** como base geográfica **100% local**. **Sem tiles, sem API externa, sem
geocodificação, sem dependência nova.**

> **Fora do escopo:** geocodificação, API/tiles, NOC/SOC completo, Fase 3C,
> schema/migration.

---

## 1. Abordagem avaliada

| Opção | Veredito |
|---|---|
| **GeoJSON externo / fetch** | ❌ proíbe rede/API. |
| **`@nivo/geo`** | ⚠ exige um GeoJSON do Brasil (bundle grande) + projeção própria; **muda** a forma de posicionar os pinos (re-validar tudo). Mais risco. |
| **GeoJSON local grande (estados)** | ⚠ arquivo pesado; precisaria de fonte confiável (sem rede para obter). |
| **Polígono SVG local simplificado** (escolhido) | ✅ **mais seguro**: array curto de coordenadas **lon/lat** embutido, **sem dependência**, e **reaproveita a `project()` atual** → pinos e contorno **alinhados pela mesma projeção**. |

**Escolha:** **manter o SVG próprio** e desenhar um **polígono do Brasil
simplificado** (≈45 vértices) projetado pela mesma função equiretangular já usada
pelos pinos.

## 2. Por que é seguro

- **Sem rede:** as coordenadas do contorno ficam **no código** (constante).
- **Sem API key, sem tiles, sem geocodificação.**
- **Sem dependência nova** (continua SVG puro).
- **Alinhamento garantido:** contorno e pinos usam a **mesma `project()`** sobre o
  **mesmo bounding box** → consistência.
- **Reversível:** remover o polígono volta ao mapa da 3B-B.

## 3. O que muda no componente

- Adicionar `BRAZIL_OUTLINE` (lista `[lon, lat]` simplificada) e desenhar um
  `<polygon>` (terra) **atrás dos pinos**.
- Trocar a moldura/retícula por **mar (fundo) + silhueta do Brasil** (mais
  premium e limpo).
- **Pinos** (status/tooltip/link) e **lista de usinas sem coordenadas**:
  **inalterados**.

## 4. Limitações (honestas)

- O contorno é **simplificado** (≈45 pontos, hand-authored sem rede) → silhueta
  **reconhecível**, não cartográfica. Refinar com um GeoJSON real (quando houver
  como obtê-lo localmente) fica para uma evolução futura.
- **Projeção equiretangular** sobre o bbox → leve distorção (aceitável p/ visão
  nacional).
- Pino com coordenada **fora do Brasil** pode cair sobre o "mar" ou na borda
  (clamp) — já tratado na 3B-B.

## 5. Tema claro/escuro

- "Mar" e "terra" via **tokens** (`--surface-soft`, `--brand-blue`, `--line`) →
  adapta automaticamente aos dois temas.

## 6. Arquivos prováveis

| Arquivo | Mudança |
|---|---|
| `src/components/UsinasMap.tsx` | + `BRAZIL_OUTLINE` + `<polygon>`; troca moldura/retícula por mar+silhueta. |
| `src/app/globals.css` | + CSS da silhueta (`.map-brazil`, `.map-sea`); remove regras da retícula se ficarem órfãs. |

> Sem rede/API/tiles/geocodificação/dependência/schema/migration. Pinos e lista
> sem-coords preservados. Início não tocada.
