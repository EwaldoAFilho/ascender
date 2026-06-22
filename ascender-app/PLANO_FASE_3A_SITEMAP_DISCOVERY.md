# PLANO — Fase 3A · SiteMap / Mapa geográfico (DISCOVERY)

**Discovery apenas.** Nenhum código, migration, componente ou endpoint criado.
Objetivo: levantar se há dados e infra para um mapa das usinas, e recomendar o
caminho mais seguro. Classificação: **[real]** · **[derivado]** ·
**[indisponível]** · **[depende de backend]**.

---

## 1. A tabela `usinas` tem latitude/longitude?

**Não.** Colunas atuais (schema + migrations até `0014`):
`id, nome, codigo_digital_grid, station_id_soliscloud, distribuidora_id,
potencia_kwp, geracao_esperada_kwh_mes, status, origem, origem_sincronizado_em,
created_at, updated_at` **+ (0014)** `endereco, bairro, estado, cep,
codigo_cliente, codigo_instalacao, modulos, inversores`.

→ **Não há `latitude`/`longitude`** (nem `geom`/coordenadas). **[indisponível]**

## 2. Tem endereço, cidade, UF ou CEP?

| Campo | Existe? | Observação |
|---|---|---|
| `endereco` (logradouro) | ✅ (0014) | texto livre |
| `bairro` | ✅ (0014) | texto livre |
| `estado` (UF) | ✅ (0014) | texto livre (UF) |
| `cep` | ✅ (0014) | texto livre |
| **cidade/município** | ❌ | **não há coluna**; só dá para derivar via CEP/endereço |

> Há ainda `distribuidoras.uf` (UF da distribuidora) — proxy **grosseiro** de
> região, não da localização da usina.

## 3. Há dados suficientes para posicionar as usinas?

- **Para posicionar com precisão (pino no mapa): não**, porque **faltam
  coordenadas** (lat/long). Endereço/CEP **não** posicionam sozinhos — precisam
  de **geocodificação** (endereço → coordenadas).
- **Preenchimento real dos campos de endereço:** **[indisponível neste
  ambiente]** — o banco **local** está desatualizado (sem as migrations 0011/0014;
  a coluna `endereco` nem existe nele). Os campos foram adicionados
  **recentemente e são manuais** → expectativa de **baixo preenchimento** até que
  alguém cadastre. **Ação:** medir na **produção**:
  ```sql
  SELECT count(*) total,
         count(*) FILTER (WHERE coalesce(cep,'')<>'')      com_cep,
         count(*) FILTER (WHERE coalesce(estado,'')<>'')   com_uf,
         count(*) FILTER (WHERE coalesce(endereco,'')<>'') com_endereco
  FROM usinas;
  ```
- **Conclusão:** sem coordenadas e com endereço provavelmente esparso, **não há
  base suficiente hoje** para um mapa preciso. Há dois caminhos (§5).

## 4. Seria necessário alterar schema?

**Para um mapa preciso (por pino): sim** — adicionar `latitude` e `longitude`
(`double precision`, nullable) à `usinas` (migration aditiva pequena), e
**persistir** as coordenadas (geocodificadas uma vez ou inseridas manualmente).
Opcional: coluna `cidade`.

- **Sem coordenadas persistidas, não há mapa confiável** (geocodificar a cada
  render é inviável — ver §7).
- Alternativa **sem schema**: mapa **por UF** (baixa fidelidade) usando só
  `estado` — não precisa de migration, mas não mostra a usina no ponto exato (§5).

## 5. Dá para começar com mapa baseado no endereço existente?

Dois cenários conservadores:

- **(A) Mapa por UF (sem schema, baixa fidelidade) — viável já, SE `estado` estiver
  preenchido.** Agrupar usinas por UF e pintar/marcar estados do Brasil
  (choropleth/markers por estado). **[derivado]** de `estado`. Não mostra o ponto
  exato; serve como "distribuição por estado". Risco: se `estado` estiver vazio,
  vira mapa vazio.
- **(B) Mapa por pino (alta fidelidade) — exige passo de backend.** Geocodificar
  `endereco/cep` → `lat/long` **uma vez** (worker/script), **persistir** em colunas
  novas, e plotar pinos. **[depende de backend]** (schema + geocodificação +
  preenchimento dos endereços).

→ **Geocodificar no render a partir do endereço atual NÃO é recomendado** (lento,
rate-limit, ToS). "Começar com o endereço existente" só funciona bem **persistindo
coordenadas** (B) ou aceitando o **nível-UF** (A).

## 6. Bibliotecas de mapa — existentes/necessárias

- **Instaladas hoje:** **nenhuma de mapa.** Há `@nivo/bar|core|pie` e `recharts`.
- **Opções:**

| Opção | Tipo | Prós | Contras |
|---|---|---|---|
| **`@nivo/geo`** (somar ao @nivo já usado) | SVG + GeoJSON | **sem tiles externos**, sem API key, leve, on-brand, tema fácil | precisa de GeoJSON do Brasil; sem ruas (bom p/ UF/pinos) |
| **SVG próprio do Brasil** (GeoJSON custom) | SVG | zero dep nova, controle total, offline | mais trabalho manual |
| **Leaflet + OSM** (`react-leaflet`) | tiles raster | ruas/zoom, padrão de mercado, sem key (OSM) | **tiles de servidor externo** (rede/privacidade/ToS), peso |
| **MapLibre GL** | tiles vetoriais | bonito/interativo | mais pesado; precisa de fonte de tiles |

→ **Recomendação para a v1 conservadora:** **`@nivo/geo` (ou SVG próprio) com
GeoJSON do Brasil**, **sem tiles externos** (privacidade/offline/no-key),
plotando **por UF (A)** ou **pinos por lat/long (B)** quando houver coordenadas.
Leaflet/MapLibre só se for exigido **nível de rua**.

## 7. Riscos de usar geocodificação

- **Dependência externa** (Nominatim/OSM, Google, etc.): **rate limits** (Nominatim
  ~1 req/s + atribuição), **ToS**, **custo** (Google é pago), **disponibilidade**.
- **Privacidade:** enviar endereços de clientes a um 3º.
- **Precisão:** endereços brasileiros são "sujos" → resultados imprecisos sem
  revisão; CEP melhora, mas CEP→ponto único nem sempre é exato.
- **Arquitetural:** **não** geocodificar por request — fazer **uma vez** (worker/
  script) e **persistir**; caso contrário, lentidão e estouro de limite.
- **Conclusão:** geocodificação é **[depende de backend]** e deve ser **batch +
  cacheada/persistida**, idealmente com **fallback manual** (lat/long editável no
  cadastro).

## 8. Onde o mapa deve entrar?

| Tela | Aderência | Comentário |
|---|---|---|
| **Início** | ❌ | **congelada** (operação ao vivo); não tocar. |
| **Executivo** | ⚠ | consolidado, mas **já denso** (HealthScore, cockpit, cards, ComparisonChart, aderência, tendência, heatmap). Um mapa aumentaria muito a altura. |
| **SolisCloud (Operação & O&M)** | ✅ | **melhor encaixe** — mapa de **sites + status de comunicação** é o conceito NOC/SOC. Porém é **client component** → exigiria **endpoint de leitura** para os dados do mapa (a avaliar). |
| **Nova rota dedicada `/mapa`** | ✅ (futuro) | tela própria evita poluir as existentes; server component → query direta sem endpoint novo. |

→ **Recomendação:** **SolisCloud** (conceitualmente), **ou** uma **rota dedicada
`/mapa`** (server, sem endpoint novo) se quisermos evitar poluir o Executivo/
SolisCloud. Decidir junto com o caminho de dados (A vs B).

---

## 9. Síntese e recomendação

- **Hoje não há base para um mapa preciso:** **faltam coordenadas**; endereço/CEP
  existem mas são **manuais/recentes** (preenchimento **[indisponível]** aqui,
  provavelmente baixo) e **sem cidade**.
- **Caminho mínimo viável sem backend:** **mapa por UF (A)** com `@nivo/geo`/SVG —
  só se `estado` estiver preenchido na produção. Baixa fidelidade.
- **Caminho "de verdade" (pinos):** **[depende de backend]** — migration
  `latitude/longitude` + **geocodificação batch persistida** (com fallback manual)
  + preenchimento dos endereços.
- **Lib:** preferir **`@nivo/geo`/SVG sem tiles** (sem API key, privacidade);
  Leaflet só se precisar de ruas.
- **Local:** **SolisCloud** ou **rota dedicada `/mapa`** (evitar Início/Executivo).

### Pré-requisitos antes de implementar (Fase 3B, quando autorizado)
1. **Medir na produção** o preenchimento de `estado/cep/endereco`.
2. **Decidir A (UF, sem schema) × B (pinos, com schema + geocodificação)**.
3. Se **B**: aprovar **migration aditiva** (`latitude`/`longitude`) + **script de
   geocodificação batch** + **lat/long editável** no cadastro de usina.
4. **Escolher a lib** (`@nivo/geo`/SVG) e a **tela** (SolisCloud × `/mapa`).

> **Nada implementado.** Sem migration, sem componente, sem endpoint, sem
> alteração de schema/código. Próxima ação depende das decisões acima.
