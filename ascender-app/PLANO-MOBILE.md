# Plano de Navegação Mobile — ASCENDER

_Planejamento (ainda não implementado). Objetivo: ótima experiência no celular._

## Princípio (definido com o usuário)

- **Mobile = acompanhar.** No celular o usuário quer *ver como está* — geração,
  financeiro, alertas, status das usinas. Consulta rápida, leitura, no polegar.
- **Desktop = trabalhar.** Cadastrar, editar, conciliar, simular propostas é
  melhor na tela grande. Esse trabalho **não precisa existir no mobile**.
- Consequência: no celular **escondemos os Cadastros (e edição)** da navegação e
  priorizamos as telas de monitoramento.

## Estado atual (diagnóstico)

- A `sidebar` (em `(dashboard)/layout.tsx`) vira uma **grade de ~9 botões** no
  topo abaixo de 1101px (2 colunas <761px). Ocupa quase uma tela inteira antes
  do conteúdo — não é navegação mobile de verdade.
- A `topbar` tem uma *search-box* decorativa que só rouba espaço no celular.
- As **tabelas** (`DataTable`) têm `min-width: 760px` → **scroll horizontal** no
  mobile, ruim para "dar uma olhada".
- Cadastros (trabalho) aparecem misturados com as telas de consulta.

## Telas: consulta (mobile) × trabalho (desktop)

| Grupo | Telas | Mobile? |
|---|---|---|
| **Consulta** | Início, Executivo, SolisCloud, Usinas, Rateio, Financeiro, Geração, Análise, Integrações | **Sim** |
| **Trabalho** | Cadastros (clientes, usinas, UCs, contratos, distribuidoras, conciliação), Propostas | **Não** (ocultar) |
| **Conta** | Configurações › Senha, tema, sair | Sim (mínimo) |
| **Conta (trabalho)** | Configurações › Usuários, Integrações (credenciais) | A confirmar |

> `Propostas` e o detalhe de `Configurações` no mobile são **decisões abertas**
> (ver fim do doc).

## Proposta de navegação mobile

**Bottom tab bar** (barra fixa no rodapé) — padrão de apps de monitoramento,
alcançável com o polegar. 4 atalhos de consulta + "Mais":

```
conteúdo da tela (scroll)
─────────────────────────────
│  🏠      📊      ⚡      💰     ☰   │  ← bottom tab bar (fixa)
│ Início  Exec.  Operação Financ. Mais │
─────────────────────────────
```

- **Operação** agrupa SolisCloud + Usinas (telemetria/alertas/desempenho).
- **Mais** abre um *drawer/sheet* com o restante de consulta (Rateio, Geração,
  Análise, Integrações) + Conta (senha, tema, sair).
- **Top bar mobile** compacto: logo pequeno + título da tela + toggle de tema.
  A search-box decorativa some no mobile.

No **desktop nada muda** — a sidebar atual continua.

## Telas de consulta otimizadas para o toque

- **Tabelas → cartões**: evoluir o `DataTable` para um **modo cartão** abaixo de
  ~760px (cada linha vira um card empilhado "rótulo: valor"), eliminando o
  scroll horizontal. Reaproveitável por todas as telas (Financeiro, Rateio,
  Usinas, SolisCloud, coletores, inversores…).
- **SummaryStrip**: já é responsivo (`auto-fit`) — mantém. É o melhor formato
  mobile para "como está".
- **Gráficos** (Recharts/Nivo): revisar alturas/margens e rótulos em telas
  estreitas. Cockpit/PowerRing já empilham bem.
- Alvos de toque ≥ 44px; respeitar `env(safe-area-inset-bottom)` (notch iOS).

## Rotas de trabalho abertas no celular

Se o usuário cair numa rota de cadastro/edição no mobile (link salvo, favorito),
mostrar um estado amigável em vez de uma tela quebrada:

> “Esta área é feita para o computador. Os cadastros e edições ficam melhores no
> desktop — aqui no celular o foco é acompanhar.” + botão **Voltar ao início**.

Não bloquear no servidor (a sessão é a mesma) — é uma camada de UX no cliente.

## Arquitetura técnica (como implementar)

1. **Escopo por módulo**: adicionar uma flag em `dashboard-data.ts`
   (ex.: `scope: "all" | "desktop"`). A navegação filtra por escopo + viewport.
2. **Viewport**: layout por **CSS** (bottom nav só aparece em `max-width: 760px`;
   sidebar só em desktop) + um hook `useIsMobile()` (matchMedia) para a lógica do
   guard. Cuidado com hidratação (montar no cliente; já há o padrão `theme: null`
   no `ThemeProvider`).
3. **Componentes novos**: `MobileTopBar` e `MobileNav` (bottom tab + sheet
   "Mais"), montados no `(dashboard)/layout.tsx`. Sidebar ganha `display:none` no
   mobile; MobileNav, `display:none` no desktop.
4. **Guard**: componente `DesktopOnly` (ou check no `cadastros/layout.tsx` e em
   `propostas`) que, em telas estreitas, troca o conteúdo pelo aviso acima.
5. **DataTable modo cartão**: variante responsiva no próprio componente
   (CSS `@container`/media query ou render condicional por `useIsMobile`).

## Fases

1. ✅ **Navegação (feita)** — `MobileNav` (bottom tab bar: Início · Executivo ·
   Operação · Financeiro · **Mais**) + top bar mobile (marca + título + tema);
   sidebar/topbar de desktop escondidas abaixo de **900px**; Cadastros e
   Propostas ocultos no celular (nav e ModuleGrid via `scope: "desktop"`).
2. **Guard** — aviso "melhor no desktop" nas rotas de trabalho em telas estreitas.
3. **Tabelas responsivas** — modo cartão no `DataTable` (<760px).
4. **Polish** — gráficos, espaçamentos, safe-area, toque; testar iOS + Android.

## Decisões

- **D1 — Padrão de navegação:** ✅ **bottom tab bar** (adotado na Fase 1).
- **D2 — Escopo mobile:** ✅ ocultos **Cadastros** e **Propostas**; o restante de
  consulta + Configurações ficam no menu "Mais". (Reabrir se quiser ajustar o
  que aparece.)
- **D3 — Rota de trabalho no mobile:** _em aberto (Fase 2)_ — aviso "melhor no
  desktop" (recomendado) ou redirecionar para o Início?
- **D4 — Tabelas:** _em aberto (Fase 3)_ — evoluir o `DataTable` para modo cartão
  (recomendado) ou manter o scroll horizontal?
