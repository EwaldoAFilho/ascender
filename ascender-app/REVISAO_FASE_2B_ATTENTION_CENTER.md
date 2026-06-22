# REVISÃO — Fase 2B · Centro de Atenção

Branch: `ux/fase-2b-attention-center` · Commit revisado: `15f7e2b`

> **Método (honestidade):** sem navegador/captura neste ambiente. Revisão por
> **inspeção de código** + **simulação determinística** de `buildIncidents`
> (função pura, então cada estado é traçável com exatidão). Itens de
> **renderização/tema/responsivo** exigem **conferência visual humana** (👁).

Legenda: ✔ verificado por código · 👁 requer olho humano · ⚠ recomendação

---

## 1. Checklist visual

| Item | Status | Observação |
|---|---|---|
| Início com 0 incidentes | ✔ | `AttentionCenter` mostra estado positivo "Tudo operando" (verde). |
| Início com críticos | ✔ | usina offline → `sev-critical` (borda/ícone vermelhos), no topo da lista. |
| Início com warning | ✔ | alarme/coletor/vencidas/atraso>60 → `sev-warning` (âmbar). |
| Início com info | ✔ | atraso 30–60 min / sem telemetria → `sev-info` (azul). |
| Estado "+N adicionais" | ✔ | com > 6 incidentes, exibe 6 + "+ N adicional(is)". |
| Tema escuro | 👁 | usa tokens com override dark; conferir contraste real. |
| Tema claro | 👁 | idem. |
| Mobile/responsivo | 👁 (✔ código) | `@media (max-width:560px)` faz o item quebrar e a ação ir p/ a direita. |

### Simulação de estados (`buildIncidents`)
| Cenário | Saída |
|---|---|
| Tudo ok | lista vazia → painel "Tudo operando dentro do esperado". |
| 2 usinas offline | 2 itens `critical` "Usina offline · <nome>" no topo, ação "Ver operação" → `/soliscloud`. |
| 1 alarme + 1 coletor mudo | 2 itens `warning`. |
| Telemetria 45 min | 1 item `info` "Telemetria atrasada · há 45 min". |
| Telemetria 90 min | 1 item `warning`. |
| 3 faturas vencidas | 1 item `warning` agregado → `/financeiro`. |
| Sem telemetria | 1 item `info` → `/configuracoes/integracoes` (demais omitidos). |
| 10 offline | 6 exibidos + "+ 4 adicional(is)". |

---

## 2. Avaliação do Centro de Atenção

| Critério | Veredito |
|---|---|
| Não duplicou demais os motivos do HealthScore | ⚠ **Aceitável** — Health Score = resumo agregado (top 3); Centro = itens **por entidade + ação**. Hierarquia resumo→detalhe (padrão Datadog). Ver §4. |
| Não empurrou o cockpit para baixo | ✔ Ordem: HealthScore → **cockpit** → MetricCards → **AttentionCenter** → Frota. O cockpit segue no topo; o Centro fica abaixo. |
| Não ficou grande demais | ✔ Cap de 6 + faturas agregadas; itens compactos. |
| Linguagem acionável | ✔ título + alvo + `actionLabel` ("Ver operação/alarmes/coletores/financeiro/Configurar"). |
| Severidade clara | ✔ borda esquerda + ícone por severidade (crítico/atenção/info). |
| Links úteis e existentes | ✔ `/soliscloud`, `/financeiro`, `/configuracoes/integracoes` — **as três rotas existem** no app. |

---

## 3. Pontos aprovados

- Lógica de incidentes correta e **derivada do banco** (sem mock).
- `buildIncidents()` **pura**; `getIncidents()` única camada de leitura.
- Priorização (crítico→atenção→info), cap de 6 e estado positivo funcionam.
- Severidade e ação coerentes com os tokens da Fase 1.
- Sem alteração de auth/rotas/endpoints/regra de negócio/schema.

---

## 4. Problemas encontrados / ajustes finos

> Nenhum **bloqueante**. Recomendações abaixo **não foram aplicadas** (manter a
> branch enxuta; algumas tocam Fase 2A/2C, fora do escopo agora).

### 4.1 ⚠ Risco de interpretação — "offline à noite" (recomendação p/ 2C)
À noite as usinas solares param de gerar e os dataloggers podem reportar
`offline`/sem comunicação. Se a SolisCloud reportar `offline` no período noturno,
o Centro pode encher de "Usina offline" (crítico) **todas as noites** — falso
positivo. **Não confirmei** o comportamento noturno da SolisCloud neste ambiente.
**Recomendação (2C):** distinguir "offline no horário solar" (problema real) de
"offline à noite" (esperado), possivelmente cruzando com janela diurna. Afeta
também o Health Score (Fase 2A). **Não alterar agora** (mexe em interpretação).

### 4.2 ⚠ Sobreposição com os motivos do HealthScore (opcional)
As mesmas categorias aparecem 2× na Início (resumo no HealthScore + detalhe no
Centro). É o padrão Datadog e está aceitável. **Opção futura:** reduzir os
"motivos" do HealthScore para 1–2 quando o Centro estiver presente, deixando o
detalhe só no Centro. Não aplicado (mudaria visual já aprovado da 2A).

### 4.3 ⚠ Posição do Centro (preferência)
Hoje fica após os MetricCards. Para um viés mais "NOC" (incidentes primeiro),
poderia subir para logo abaixo do HealthScore. **Mantido** como está (não polui o
topo). Decisão de produto.

---

## 5. Avaliação técnica — duplicidade de leitura

**Sim, há leitura duplicada** na Início (sem refatorar agora, conforme pedido):

| Leitura | Vezes na Início | De onde |
|---|---|---|
| `lerEstacoesDoBanco()` | ~4× | `getUsinasComTelemetria`, `getTelemetriaPorStation`, `getHealthScore`, `getIncidents` |
| `lerColetoresDoBanco()` | 2× | `getHealthScore`, `getIncidents` |
| `ultimaTelemetriaEm()` | 3× | chamada direta, `getHealthScore`, `getIncidents` |
| `contarFaturasVencidasDg()` | 2× | `getHealthScore`, `getIncidents` |

São consultas **leves/indexadas** e rodam **em paralelo** (`Promise.all`), então o
impacto hoje é pequeno. Porém `getHealthScore()` e `getIncidents()` leem
**exatamente os mesmos 4 conjuntos**.

**Recomendação futura (não agora):** criar um agregador
`getOperationalOverview()` em `src/lib/operacao/` que faça as 4 leituras **uma
vez** e alimente tanto `computeHealthScore()` quanto `buildIncidents()` (ambas já
são funções puras — encaixam perfeitamente). Eliminaria a duplicidade sem mudar
contrato. Bom candidato para a Fase 2C, quando a Timeline também precisar dos
mesmos dados.

---

## 6. Verificação

- `npx tsc --noEmit` → **OK** (exit 0).
- `npm run build` → **OK** — "Compiled successfully" + 12/12 páginas (exit 0).

---

## 7. Conclusão

**Aprovado para merge** (técnico OK; visual aprovado por código/simulação).
Pendente apenas a **conferência visual humana** (temas/mobile) com o checklist da
§1. **Nenhum ajuste de código foi necessário** nesta revisão.

Recomendações registradas para o futuro (não bloqueiam o merge):
- §4.1 "offline à noite" → tratar na Fase 2C (afeta interpretação do Health Score).
- §5 `getOperationalOverview()` → desduplicar leitura na Fase 2C.
- §4.2/§4.3 → opções de produto (sobreposição e posição).

> Aguardando o **ok** para o merge na `main`. Fase 2C **não iniciada**.
