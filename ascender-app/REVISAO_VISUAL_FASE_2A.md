# REVISÃO VISUAL — Fase 2A · HealthScore

Branch: `ux/fase-2a-healthscore` · Commit base: `30d471c`

> **Método e honestidade:** esta revisão foi feita por **inspeção de código** e
> **simulação determinística** da fórmula (`computeHealthScore` é função pura, então
> cada estado pode ser traçado com exatidão). **Não há navegador/captura de tela
> neste ambiente**, portanto os itens de **renderização, tema e responsividade**
> exigem **conferência visual humana** no ambiente real — estão marcados com 👁.
> Não afirmo ter "visto" o que não pude renderizar.

Legenda: ✔ verificado por código · 👁 requer conferência visual humana · ⚠ ajuste recomendado

---

## 1. Checklist obrigatório

| Item | Status | Observação |
|---|---|---|
| Início — tema escuro | 👁 | CSS usa tokens com override no dark; conferir contraste real. |
| Início — tema claro | 👁 | idem. |
| Executivo — tema escuro | 👁 | idem. |
| Executivo — tema claro | 👁 | idem. |
| Desktop | 👁 | layout em linha (medidor + corpo); ver respiro com cockpit logo abaixo. |
| Mobile/responsivo | 👁 (✔ código) | há `@media (max-width:560px)` → coluna; conferir no aparelho. |
| HealthScore com dados normais | ✔ | traçado abaixo. |
| Estado saudável | ✔ | score ≥ 85 e sem offline → verde, "Operação saudável". |
| Estado atenção | ✔ | 60–84, ou qualquer offline, ou telemetria > 60 min → âmbar. |
| Estado crítico | ✔ | < 60, ou ≥ 30% offline → vermelho. |
| Sem telemetria exibindo `—` | ✔ | `noData=true` → medidor mostra "—" (não 0/100). |
| Motivos da nota claros | ✔ | top 3 motivos com bolinha de severidade + título + descrição. |
| StatusBanner compatível com modo antigo | ✔ | API por contagens intacta (ver §4). |
| Sem duplicação confusa com MetricCards | ⚠ | duplicação leve na Início (ver §3.1). |

---

## 2. Estados do HealthScore (simulação da fórmula)

Exemplos com parque de 10 usinas / 10 coletores:

| Cenário | Entradas | Score | Status | Cor | Rótulo |
|---|---|---|---|---|---|
| Saudável | 10 online, 0 offline/alarme, telemetria 8 min | **100** | healthy | verde | Operação saudável |
| Atenção (1 offline) | 9 online, 1 offline | **96** | **attention** | âmbar | Operação em atenção |
| Atenção (atraso) | 10 online, telemetria 90 min | **~92** | **attention** | âmbar | Operação em atenção |
| Crítico (40% offline) | 6 online, 4 offline | **82** | **critical** | vermelho | Operação crítica |
| Crítico (combinado) | 2 offline, 3 alarme, 5 coletores mudos, 200 min, 20 vencidas | **~28** | critical | vermelho | Operação crítica |
| Sem telemetria | 0 usinas, sem coleta | **"—"** | attention | âmbar | Sem telemetria |

Confirmações importantes da lógica:
- **1 offline force atenção** mesmo com nota alta (96) — não vira "saudável". ✔
- **≥ 30% offline força crítico** mesmo com nota 82. ✔
- **Sem telemetria** mostra **"—"**, nunca 0 nem 100. ✔

---

## 3. Problemas encontrados / ajustes finos

> §3.1, §3.2 e §3.3 foram **APLICADOS** na branch `ux/fase-2a-healthscore` após a
> revisão (mudanças pequenas e reversíveis; Fase 2B não iniciada).

### 3.1 ✅ APLICADO — Duplicação leve na Início — "usinas online"
A contagem de usinas online aparece em **três** lugares na Início:
1. nos **motivos** do HealthScore (quando saudável: "N usina(s) online…");
2. no `MetricCard` **"Usinas online"** (faixa da Fase 1);
3. nos **chips** do cockpit (`N online / N em alarme / N offline`).

**Recomendação:** remover o `MetricCard` "Usinas online" da Início (o HealthScore
+ chips já cobrem), mantendo os cards de "Capacidade instalada" e "Aproveitamento
agora" (esses não duplicam). Reduz ruído sem perder informação.

### 3.2 ✅ APLICADO — Cor do estado "sem telemetria"
Hoje `noData` usa `status="attention"` → **âmbar**, que lê como "aviso". "Sem
dados" é mais um estado **neutro/desconhecido** do que um alerta.
**Recomendação:** usar cor **neutra/info** (`--sev-info`) para o caso `noData`,
mantendo o "—". Ajuste pequeno e seguro (só apresentação).

### 3.3 ✅ APLICADO — Alarme ativo rebaixa o status (decisão de produto)
Decisão aprovada: **qualquer usina em alarme força status mínimo `attention`**
(o rótulo deixa de ser "Operação saudável"). A nota pode seguir alta e **um
alarme isolado não torna `critical`**. Regra documentada no
`PLANO_FASE_2A_HEALTHSCORE.md` e no `RELATORIO_FASE_2A_HEALTHSCORE.md`.

### 3.4 Observação — dois blocos "grandes" no topo
Início e Executivo passam a ter HealthScore + cockpit (PowerRing) empilhados no
topo. Não é problema, mas vale o **olho humano** confirmar que o respiro
(`--sp-4`) ficou bom e que não "empurra" demais o conteúdo. 👁

---

## 4. Confirmações de compatibilidade (código)

- `StatusBanner` mantém o **modo por contagens** da Fase 1 (props
  `online/alarme/offline/total` continuam funcionando) e ganhou o modo `health`
  opcional. **Hoje não está montado** em nenhuma tela (a Início passou a usar o
  `HealthScore` premium) — disponível para reuso na Fase 2B (ex.: SolisCloud).
- `computeHealthScore()` permanece **pura**; `getHealthScore()` é a **única** com
  leitura de banco; **Início e Executivo** chamam a mesma função.
- Sem mock, sem migração, sem alteração de API externa/auth/rotas/regra de negócio.

---

## 5. Conclusão

- **Lógica e contrato (estados, "—", salvaguardas):** ✔ aprovados por código.
- **Renderização, temas e responsividade:** 👁 **pendente de conferência visual
  humana** no ambiente real (não pude capturar telas aqui).
- **Ajustes finos:** §3.1, §3.2 e §3.3 **aplicados** nesta branch (ver §3).

**Veredito:** **Aprovado em código (com os ajustes §3.1–§3.3 aplicados);
aguardando o "ok" visual humano.** Sugiro:
1. fazer a conferência visual (4 telas × 2 temas + mobile) usando este checklist,
   já com os ajustes (sem o card "Usinas online"; sem-telemetria em tom neutro;
   alarme rebaixando para "atenção");
2. então liberar a Fase 2B (AttentionCenter).
