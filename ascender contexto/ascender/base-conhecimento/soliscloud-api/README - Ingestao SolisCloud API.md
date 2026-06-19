# README - Ingestao SolisCloud API

## Objetivo

Compilar a documentacao PDF da API SolisCloud em uma base exclusiva da empresa ASCENDER.

## Entradas

PDF padrao:

`C:\Users\slaye\Downloads\SolisCloud Platform API Document V2.0.pdf`

## Saidas

- notas Markdown por chunk em `base-conhecimento/soliscloud-api/chunks`
- indice geral em `base-conhecimento/soliscloud-api/Base de Conhecimento - SolisCloud API - ASCENDER.md`
- chunks estruturados em `_embeddings/soliscloud-api/chunks.jsonl`
- vetores em `_embeddings/soliscloud-api/embeddings.npy`
- endpoints detectados em `_embeddings/soliscloud-api/endpoints.json`
- manifesto em `_embeddings/soliscloud-api/manifest.json`

## Gerar Base

```powershell
python "C:\obsidian\dev_fluig_protheus\05 - Projetos\ascender\scripts\ingest_soliscloud_api_pdf.py" --copy-pdf
```

## Buscar na Base

```powershell
python "C:\obsidian\dev_fluig_protheus\05 - Projetos\ascender\scripts\search_soliscloud_api.py" "como autenticar na api"
```

## Observacoes

- esta base nao deve ser misturada com a base geral de Fluig/Protheus
- os dados sao vinculados ao projeto ASCENDER
- se a documentacao da SolisCloud mudar, execute a ingestao novamente
