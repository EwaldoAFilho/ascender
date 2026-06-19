# Contrato REST - Digital Grid Financeiro

## Contexto

Contrato preliminar inferido a partir dos arquivos da plataforma Digital Grid recebidos para o projeto ASCENDER.

Fonte principal:

- `C:/Users/slaye/Downloads/digital grid/financeiro.txt`
- `C:/Users/slaye/Downloads/digital grid/financeiro rest return.txt`

## Endpoint

```http
GET /financeiro_json
```

## Uso Observado

O endpoint alimenta a tabela `#tableFinance` via DataTables.

Comportamento observado no frontend:

- DataTables com `serverSide: true`
- parametro `page` enviado conforme pagina atual
- parametros existentes na URL da tela sao repassados para a requisicao
- retorno esperado no formato padrao do DataTables

## Formato de Retorno

```json
{
  "draw": 1,
  "recordsTotal": 12,
  "recordsFiltered": 12,
  "data": []
}
```

## Campos de Cada Registro

| Campo | Uso observado |
|---|---|
| `pk` | identificador da fatura/registro |
| `payment_status` | status financeiro exibido na coluna Status |
| `a_company` | cliente/prosumidor |
| `value` | valor exibido como valor da fatura |
| `a_regarding_date_str` | competencia em formato textual, exemplo `ABR/2026` |
| `a_installation` | unidade consumidora/instalacao |
| `bill_generated` | URL da fatura gerada |
| `distributor_bill` | URL da fatura da distribuidora |
| `is_approved_financial` | indica se ja passou pela aprovacao financeira |
| `registered_at` | data de registro do boleto |
| `due_date` | vencimento |
| `installation_whatsapp` | indica se instalacao tem WhatsApp |
| `installation_agent_whatsapp` | indica se agente tem WhatsApp |
| `bar_code` | codigo de barras do boleto |
| `line_code` | linha digitavel do boleto |
| `billet_amount` | valor do boleto |
| `finance_can_be_approved` | controla se o usuario pode aprovar fatura |
| `generators_match` | indica se o gerador da fatura bate com o gerador da instalacao |
| `a_generator_month` | identificador do gerador/usina da competencia |
| `generator_month_generator_representation` | descricao do gerador/usina |
| `a_regarding_date` | competencia em data ISO |
| `billet_pending_registration` | indica pendencia/falha de registro |

## Status Observados

- `Aguardando`
- `Pago`
- `Parcelado`
- `Negativado`
- `Vencido`

## Acoes Relacionadas

Endpoints inferidos do frontend:

```http
GET /aprovar-financeiro/{id}
GET /cancelar-aprovacao/{id}
GET /arquivar-fatura/{id}
GET /tornar-negativado/{id}
GET /tornar-parcelado/{id}
POST /tornar-pago/{id}
GET /reenviar-fatura/{id}?by=email
GET /reenviar-fatura/{id}?by=whatsapp
GET /download-fatura/{id}/bill_generated
POST /arquivar-faturas
```

## Regras de Interface Observadas

- se `payment_status` for `Pago`, o botao de status nao abre dropdown
- se `is_approved_financial` for verdadeiro e status nao for `Pago`, a interface permite remover aprovacao e tornar pago
- se status for `Parcelado`, aparece opcao para tornar negativado
- se status for `Negativado` ou `Aguardando`, aparece opcao para parcelar fatura
- se status for `Vencido`, aparecem opcoes para arquivar, negativar ou parcelar
- se `finance_can_be_approved` e `generators_match` forem verdadeiros, aparece opcao de aprovar fatura
- se `generators_match` for falso, aparece alerta de gerador divergente
- se houver WhatsApp da instalacao e do agente, a interface permite reenviar por e-mail ou WhatsApp

## Observacoes de Seguranca

- este contrato e inferido pelo frontend, nao por documentacao oficial
- validar autenticacao, CSRF e autorizacao antes de qualquer automacao
- `bar_code`, `line_code`, URLs de fatura e dados de clientes sao sensiveis
- URLs de fatura sao assinadas e temporarias, nao devem ser tratadas como identificador persistente

