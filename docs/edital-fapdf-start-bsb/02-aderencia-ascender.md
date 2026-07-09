# Aderência da ASCENDER ao Edital FAPDF START BSB (nº 11/2026)

> Avalia se e como o SaaS da ASCENDER se encaixa no edital, mapeia os critérios de
> avaliação contra evidências reais do produto e lista os pontos a resolver antes da
> inscrição. Leia junto com `01-analise-edital.md` (o que o edital exige) e
> `03-documentacao-tecnica.md` (o que o produto faz hoje).
> Confiança: alta no técnico; itens jurídicos/societários marcados como **[CONFIRMAR]**.

---

## 1. Veredito

**A ASCENDER é aderente ao edital.** O produto é uma plataforma de software
inovadora em **Energia / IoT / Cidades Inteligentes**, **já em operação como SaaS
multi-tenant**, com **cliente âncora em produção** (Ascender Solar Tech) e **segundo
cliente em contratação** — o que caracteriza um negócio em **estágio de aceleração**
(Eixo III). Restam **decisões societárias e de conformidade** (não técnicas) a
encaminhar, detalhadas em §4 e §5.

## 2. Elegibilidade — checklist

| Requisito do edital | Situação | Ação |
|---------------------|----------|------|
| Startup **ME/EPP** (MEI só Eixos I/II) | **[CONFIRMAR]** enquadramento da PJ proponente | Definir/estruturar a PJ (§4) |
| **Sede e administração no DF/RIDE** | Ascender atua em **Brasília** ✓ | Confirmar sede da PJ proponente no CNPJ |
| **Faturamento ≤ R$ 4,8 mi/ano** | **[CONFIRMAR]** | Verificar faturamento da PJ proponente |
| **CNPJ ≤ 10 anos** | **[CONFIRMAR]** | Verificar data de constituição |
| **Objeto social compatível** (desenvolvimento de software/tecnologia) | **[CONFIRMAR]** — Ascender Solar Tech tem objeto de energia; SaaS é de tecnologia | Ajustar objeto social **ou** usar entidade de tecnologia dedicada (§4) |
| **Adimplência** FAPDF / DF / União (certidões) | **[CONFIRMAR]** | Levantar certidões (item 17) |
| Coordenador sócio/representante, 18+, domicílio DF/RIDE | Fundador reside em Brasília **[CONFIRMAR]** | — |
| Cadastros: SIGFAP, start.bsb.br, SEI-GDF (usuário externo) | Pendente | Criar cadastros no início da janela |
| **Comprovação de maturidade** p/ entrar direto no Eixo III (item 7.4) | Produto em produção; **[CONFIRMAR]** passagem por programa local | Reunir evidências ou aceitar avaliação ad hoc (§4) |

## 3. Mapa: critérios de avaliação do Eixo III × evidências reais do produto

Fórmula: `NOTA = 3M + 4I + 3E + 4P + 5F` (cada critério de 4 a 10; ver `01-analise-edital.md` §6.2).

### M — Problema e oportunidade de mercado (peso 3)
- **Problema**: integradoras e geradoras de energia solar operam hoje em **silos** —
  telemetria de geração no **SolisCloud**, faturamento/rateio no **Digital Grid**,
  contas da distribuidora em **PDF**, e propostas comerciais em **planilhas**. Falta
  uma visão consolidada de **O&M + financeiro + comercial**, e o cálculo de créditos
  ficou mais complexo com o **Fio B (Lei 14.300/2022)**.
- **Oportunidade**: a **geração distribuída (GD)** cresce fortemente no Brasil;
  há milhares de integradoras, e o DF/RIDE tem mercado solar relevante. Mercado
  **B2B recorrente** (uma assinatura por integradora/geradora).
- **Evidência no produto**: telas de Operação, Geração, Financeiro, Rateio e Propostas
  já resolvem o problema para um operador real.

### I — Potencial inovador (peso 4)
- **Diferencial**: plataforma **única** que unifica **telemetria IoT** (inversores/
  dataloggers Solis) + **financeiro** (Digital Grid) + **IA** (extração de dados de
  faturas PDF) + **motor de propostas FV** (dimensionamento, precificação, payback/TIR,
  **Fio B**) + **auditoria automática de rateio de créditos SCEE** (detecção de
  inconsistências) — algo que SolisCloud e Digital Grid **isolados não entregam**.
- **Arquitetura**: **sync-first** (workers sincronizam as APIs externas; as telas leem
  do banco, com selo de frescor) e **multi-tenant SaaS** (uma base, N integradoras).
- **Grau de inovação**: **incremental-a-radical** — combina tecnologias existentes com
  **inovação de produto** (consolidação + auditoria de rateio + IA aplicada a faturas).

### E — Equipe empreendedora (peso 3)
- **[PREENCHER]** com o perfil do fundador/coordenador (formação, experiência em
  energia solar e software) e da equipe. Comprovar **capacidade técnica** (o produto,
  com ~23 mil linhas de TypeScript em produção, é evidência forte) **e gerencial**.

### P — Potencial de negócio (peso 4)
- **Aplicabilidade no DF** ✓ (cliente âncora em Brasília).
- **Viabilidade do modelo** ✓: SaaS B2B, receita recorrente por tenant.
- **Avanço na prototipação/experimentação** ✓✓: **não é protótipo — está em
  produção** (`https://gestao.ascenderenergiasolar.com`), com MVP validado em operação
  real e **2º cliente em contratação**. Esse é o ponto mais forte da candidatura.

### F — Potencial financeiro (peso 5, **o maior**)
- **Modelo**: assinatura recorrente B2B; **custo marginal baixo** por novo tenant
  (multi-tenant), o que dá **escalabilidade** (definição do próprio edital, item 5.2).
- **TAM/SAM/SOM**: **[PREENCHER]** — nº de integradoras/geradoras de GD no Brasil e
  no DF/RIDE, ticket médio de assinatura, metas de aquisição.
- **Projeções e valuation**: **[CONSTRUIR]** — 24-36 meses de receita/custo, com o
  uso da subvenção como alavanca (desenvolvimento de features que destravam novos
  clientes). Como F tem o maior peso, **é onde investir mais esforço na proposta**.

> **Leitura estratégica**: a candidatura é forte em **P** (produto em produção) e **I**
> (diferencial técnico claro). O trabalho de escrita deve reforçar **F** (projeções,
> escalabilidade) e **M** (dimensionar o mercado), e **documentar E** (equipe).

## 4. Decisões estruturantes a tomar (não técnicas)

1. **Entidade proponente** — quem assina:
   - **(a) Ascender Solar Tech**, se o objeto social contemplar (ou for alterado para
     contemplar) **desenvolvimento de software/tecnologia**; ou
   - **(b) uma startup de tecnologia dedicada** ao SaaS (a plataforma como produto que
     será vendido para a Ascender e para outras integradoras). Coerente com o fato de o
     SaaS **já atender a Ascender como cliente e ter um 2º cliente entrando** — ou seja,
     o SaaS é um **produto vendável**, não um sistema interno. O edital admite PF
     constituir a empresa em 7 dias úteis após a aprovação.
   - **Impacto**: define objeto social, faturamento a comprovar, quadro societário e a
     narrativa (“empresa de energia” vs. “startup de software para o setor de energia”).

2. **Eixo** — recomendado **III (Aceleração, R$ 200 mil)**. Alternativa conservadora:
   **II (R$ 110 mil)** se a comprovação de projeções financeiras/valuation ainda for
   imatura. Como o produto **já está em comercialização**, o Eixo III é o encaixe correto.

3. **Comprovação de maturidade (item 7.4)** para entrar direto no Eixo III sem ter
   passado pelos Eixos I/II: reunir evidência de passagem por **programa de startups do
   ecossistema local** (aceleradora, incubadora, hub) **ou** preparar-se para a
   **avaliação de maturidade por ≥ 2 avaliadores ad hoc**.

## 5. Gaps e riscos da candidatura (e como viram metas do projeto)

| # | Gap / risco | Severidade | Encaminhamento |
|---|-------------|:----------:|----------------|
| 1 | Enquadramento jurídico do proponente (objeto social tech, ME/EPP, sede DF, ≤10 anos, ≤R$4,8mi) | **Alta** | Decisão §4.1 + ajuste contratual/certidões |
| 2 | Comprovação de maturidade (item 7.4) | Média | Reunir evidências ou aceitar avaliação ad hoc |
| 3 | **LGPD art. 37**: log rastreável de acesso a dados pessoais + política de retenção/eliminação | Média | **Vira meta do projeto** — desenvolver trilha de auditoria e conformidade LGPD com a subvenção |
| 4 | Uso dos recursos: cloud/hospedagem recorrente **não** é financiável | Baixa | Estruturar orçamento em bolsas de inovação + serviços/consultoria + software + equipamentos (ver §6) |
| 5 | Métricas de negócio (MRR, nº de tenants, projeções, valuation) ainda não formalizadas | Média | Construir para o critério **F** (o de maior peso) |

## 6. Rascunho de plano de aplicação dos R$ 200 mil (Eixo III) — a validar

Alinhado aos itens financiáveis (edital §10) e às metas de produto. **Números
ilustrativos** — ajustar ao plano de trabalho real.

| Natureza | Item | Faixa sugerida | Observação |
|----------|------|---------------:|------------|
| Custeio | **Bolsas de estímulo à inovação** (equipe de P,D&I) | até R$ 60.000 (30%) | Limite do Eixo III; não é salário |
| Custeio | **Serviços de terceiros PF/PJ** — desenvolvimento, UX, consultoria técnica | R$ 60.000–90.000 | Ex.: dev backend/frontend, especialista LGPD, consultoria de dados |
| Custeio | **Software/licenças** e material de consumo | R$ 10.000–20.000 | Ferramentas de dev, licenças, componentes |
| Custeio | **Registro de propriedade intelectual** (INPI, marca/software) | R$ 5.000–10.000 | Item financiável explícito |
| Capital | **Equipamentos** de desenvolvimento | R$ 20.000–40.000 | Estações de trabalho, servidores locais de teste |
| — | Diárias/passagens (eventual) | pontual | Só se houver deslocamento previsto no plano |

> ⚠️ **Custeio de infraestrutura recorrente** (cloud, hospedagem, internet) tende a
> **não ser financiável** (tarifas de telecomunicação, item 11). Manter esse custo fora
> da subvenção.

## 7. Metas de projeto candidatas (para o Plano de Trabalho)

Boas metas conectam o financiamento a entregas de produto verificáveis. Candidatas,
extraídas dos gaps e do roadmap real (`HANDOFF.md` §9 e KB):

1. **Conformidade LGPD** — trilha de auditoria de acesso a dados pessoais (art. 37) +
   política de retenção/eliminação + relatório de tratamento (gap #3 → conformidade).
2. **RBAC completo por tenant** — papéis/permissões finos (já há a fundação:
   `tenant_memberships`, papel por tenant).
3. **Onboarding self-service de novas integradoras** — do signup à operação, para
   sustentar a **escalabilidade** (evidência para o critério F).
4. **Motor de propostas/relatórios** — reimpressão a partir do snapshot, parser de
   contas de outras distribuidoras, edição manual dos campos extraídos.
5. **Escala da telemetria** — scheduler, retenção/particionamento das séries IoT.
6. **Analytics/IA** — expandir a extração por IA e indicadores de O&M.

Cada meta deve ter **indicador de aferição** (edital, Cláusula 3 da minuta) — ex.:
“nº de tenants ativos”, “% de faturas extraídas por IA sem intervenção”, “tempo de
onboarding de nova integradora”.
</content>
