# VALIDAÇÃO VISUAL — Executivo (pós Fase 2D-A)

> **Honestidade de método e limites:**
> 1. **O deploy roda na VPS, não neste ambiente.** Este é o repositório de
>    desenvolvimento; o servidor de produção (`srv1769779:~/ascender`) é outra
>    máquina, sem acesso a partir daqui. **Não executei o deploy** — o comando é
>    para você rodar na VPS (§1).
> 2. **Sem navegador/captura aqui** → a "validação visual" é por **análise de
>    CSS/código** do painel. Itens de tema/pixel exigem **olho humano** (👁). Não
>    afirmo ter visto a tela renderizada.

Legenda: ✔ verificado por código · 👁 requer olho humano · ⚠ observação

---

## 1. Deploy (a executar na VPS)

```bash
cd ~/ascender && git pull && cd ascender-app && docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```
- **Sem migração** nesta fase (a 2D-A só reusa dados já carregados).
- `main` em `7862f2c` (ComparisonChart no Executivo).

---

## 2. Como o painel responde (fatos de código)

Painel "Realizado × meta (mês até hoje)" no Executivo, **após os MetricCards**,
antes do bloco "Aderência por usina / Tendência do ano".

| Condição | Comportamento | Status |
|---|---|---|
| **Com meta** (`espTot > 0`) | 2 barras (Realizado por faixa de cor · Meta como referência listrada) + delta | ✔ / 👁 |
| **Sem meta** (`espTot = 0`) | estado vazio "Defina a meta de geração das usinas…" (não inventa) | ✔ |
| **Desktop** | `grid 130px 1fr auto` (rótulo · barra · valor) | 👁 (✔ código) |
| **Mobile (<560px)** | `grid 96px 1fr`; valor desce p/ 2ª linha à direita; barras full | ✔ código |
| **Tema escuro** | cores por tokens com override dark | 👁 |
| **Tema claro** | idem | 👁 |

---

## 3. Avaliações específicas (tarefa 3)

- **Painel ficou claro?** ✔ título + descrição ("meta proporcional aos dias
  decorridos · apenas usinas com meta definida") + 2 barras + delta.
- **"Meta até hoje" bem entendido?** ✔ rótulo na barra + descrição reforçam que é
  **proporcional aos dias**, não meta cheia nem diária.
- **Delta "na meta / acima / abaixo"?** ✔ texto + ícone + cor por faixa
  (ok ≥ meta · atenção até −15% · abaixo). Empate = **"na meta"**.
- **Complementa o PowerRing ou repete?** ⚠ **Complementa, com sobreposição
  parcial.** O anel mostra a **% de aderência** e, no *sublabel*, já diz
  "Realizado X / meta até hoje Y kWh". O ComparisonChart re-apresenta esses
  números como **barras + delta** (mais visual/executivo). Não é idêntico, mas há
  redundância textual com o sublabel do anel → ver recomendação §5.
- **Bem posicionado após os MetricCards?** ✔ Sim — fluxo coerente
  (cockpit → números → comparação → aderência por usina/tendência).
- **Mobile legível?** ✔ (código) barras ocupam a largura; o valor numérico vai
  para a 2ª linha (sem overflow). 👁 confirmar conforto de leitura.

---

## 4. Bug visual?

- **Nenhum bug claro** por código. ⚠ Observação menor: **sem meta**, o anel e o
  ComparisonChart exibem **ambos** "Defina a meta…" (mensagem dupla). É coerente
  (mesma ação) e discreto; não é bug. Pode ser unificado num polimento futuro.
- **Nenhuma alteração de código** nesta validação.

---

## 5. Conclusão e recomendações

- **Conclusão visual (por código):** o ComparisonChart está **claro, conservador
  e correto**; comportamento responsivo e estados (com/sem meta) adequados. Falta
  só o **carimbo visual humano** (temas/mobile no deploy).
- **ComparisonChart aprovado?** ✅ **Sim** (pendente apenas o ok visual humano);
  sem bloqueio técnico (`tsc`/`build` OK).
- **Simplificar o sublabel do PowerRing?** ✅ **Recomendo sim**, como **polimento
  pequeno**: deixar o anel só com a **%** (ex.: sublabel "X% da meta até hoje") e
  deixar os **kWh absolutos** por conta do ComparisonChart — elimina a redundância
  textual. **Não apliquei** agora (é polimento, não bug; aguardo seu ok).
- **Executivo pronto para a próxima fase?** ✅ **Tecnicamente sim.**
- **Avançar para 2D-B ou microfase de polimento?** **Recomendação:** uma
  **microfase curta de polimento** (2D-A-polish) para (a) simplificar o sublabel do
  PowerRing e (b) unificar a mensagem "sem meta", **antes** de 2D-B — pequena,
  segura, fecha as duas observações acima. Se preferir, dá para ir direto à 2D-B e
  deixar o polimento para depois; ambos são válidos.

> Nenhuma fase nova (Heatmap / SiteMap / mapa / ComparisonChart por usina)
> iniciada. Aguardando sua decisão.
