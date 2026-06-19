import argparse
import json
import re
from collections import Counter
from datetime import date, datetime
from pathlib import Path

from openpyxl import load_workbook


PROJECT_DIR = Path(__file__).resolve().parents[1]
DEFAULT_XLSX = Path(r"C:\Users\slaye\Downloads\CONTROLE DE USINAS_EWALDO.xlsx")
DEFAULT_OUT = PROJECT_DIR / "_analises" / "planilhas"


def normalize(value):
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if value is None:
        return None
    if isinstance(value, str):
        value = re.sub(r"\s+", " ", value).strip()
        return value or None
    return value


def find_header_row(rows, max_scan=20):
    best_idx = 0
    best_score = -1
    for idx, row in enumerate(rows[:max_scan]):
        values = [normalize(v) for v in row]
        non_empty = [v for v in values if v is not None]
        text_count = sum(1 for v in non_empty if isinstance(v, str))
        unique_count = len(set(str(v).lower() for v in non_empty))
        score = text_count * 2 + unique_count + len(non_empty)
        if score > best_score:
            best_idx = idx
            best_score = score
    return best_idx


def unique_headers(raw_headers):
    headers = []
    seen = Counter()
    for idx, value in enumerate(raw_headers, start=1):
        name = normalize(value)
        if name is None:
            name = f"Coluna {idx}"
        name = str(name)
        seen[name] += 1
        if seen[name] > 1:
            name = f"{name} ({seen[name]})"
        headers.append(name)
    return headers


def classify_column(values, header):
    filled = [v for v in values if v is not None]
    if not filled:
        return "vazio"
    lower_header = header.lower()
    if any(term in lower_header for term in ["data", "dt", "venc", "mes", "mês", "ano", "refer"]):
        return "data_periodo"
    if any(term in lower_header for term in ["valor", "preço", "preco", "tarifa", "r$", "fatura", "boleto", "total"]):
        return "monetario"
    if any(term in lower_header for term in ["kw", "kwh", "energia", "geração", "geracao", "consumo"]):
        return "energia"
    if any(term in lower_header for term in ["cliente", "nome", "empresa", "titular", "consumidor", "prosumidor"]):
        return "cadastro_pessoa_empresa"
    if any(term in lower_header for term in ["uc", "instala", "unidade", "medidor"]):
        return "cadastro_unidade_consumidora"
    if any(term in lower_header for term in ["usina", "gerador", "inversor", "placa", "potencia", "potência"]):
        return "cadastro_usina_ativo"
    numeric = sum(1 for v in filled if isinstance(v, (int, float)) and not isinstance(v, bool))
    if numeric / len(filled) >= 0.8:
        return "numero"
    distinct_ratio = len(set(map(str, filled))) / len(filled)
    if distinct_ratio <= 0.25:
        return "categoria_status"
    return "texto"


def sample_values(values, limit=6):
    result = []
    seen = set()
    for value in values:
        if value is None:
            continue
        text = str(value)
        if text in seen:
            continue
        result.append(value)
        seen.add(text)
        if len(result) >= limit:
            break
    return result


def analyze_sheet(ws):
    rows = list(ws.iter_rows(values_only=True))
    trimmed_rows = []
    for row in rows:
        values = [normalize(v) for v in row]
        if any(v is not None for v in values):
            trimmed_rows.append(values)

    if not trimmed_rows:
        return {
            "name": ws.title,
            "max_row": ws.max_row,
            "max_column": ws.max_column,
            "empty": True,
            "columns": [],
            "sample_rows": [],
        }

    header_idx = find_header_row(trimmed_rows)
    headers = unique_headers(trimmed_rows[header_idx])
    data_rows = trimmed_rows[header_idx + 1 :]
    meaningful_data_rows = [row for row in data_rows if any(v is not None for v in row)]
    col_count = len(headers)
    columns = []

    for idx, header in enumerate(headers):
        values = [row[idx] if idx < len(row) else None for row in meaningful_data_rows]
        filled_count = sum(1 for v in values if v is not None)
        distinct = len(set(str(v) for v in values if v is not None))
        columns.append(
            {
                "index": idx + 1,
                "name": header,
                "filled": filled_count,
                "fill_rate": round(filled_count / max(len(meaningful_data_rows), 1), 4),
                "distinct": distinct,
                "classification": classify_column(values, header),
                "samples": sample_values(values),
            }
        )

    sample_rows_out = []
    for row in meaningful_data_rows[:5]:
        sample_rows_out.append({headers[i]: (row[i] if i < len(row) else None) for i in range(col_count)})

    return {
        "name": ws.title,
        "max_row": ws.max_row,
        "max_column": ws.max_column,
        "empty": False,
        "header_row_detected": header_idx + 1,
        "data_rows": len(meaningful_data_rows),
        "columns": columns,
        "sample_rows": sample_rows_out,
    }


def infer_entities(sheets):
    entities = []
    for sheet in sheets:
        if sheet.get("empty"):
            continue
        classes = Counter(col["classification"] for col in sheet["columns"])
        likely = []
        if classes["cadastro_usina_ativo"]:
            likely.append("usinas_ativos")
        if classes["cadastro_pessoa_empresa"]:
            likely.append("clientes_prosumidores")
        if classes["cadastro_unidade_consumidora"]:
            likely.append("unidades_consumidoras")
        if classes["energia"]:
            likely.append("medicoes_energia")
        if classes["monetario"]:
            likely.append("faturas_pagamentos_propostas")
        if classes["data_periodo"]:
            likely.append("competencias_periodos")
        if not likely:
            likely.append("apoio_operacional")
        entities.append(
            {
                "sheet": sheet["name"],
                "likely_entities": likely,
                "data_rows": sheet.get("data_rows", 0),
                "key_candidates": [
                    col["name"]
                    for col in sheet["columns"]
                    if col["distinct"] == sheet.get("data_rows", 0) and col["filled"] > 0
                ][:8],
            }
        )
    return entities


def build_markdown(workbook_path, analysis):
    lines = [
        "# Analise da Planilha - Controle de Usinas ASCENDER",
        "",
        f"Arquivo analisado: `{workbook_path}`",
        f"Abas analisadas: `{len(analysis['sheets'])}`",
        "",
        "## Resumo das Abas",
        "",
        "| Aba | Linhas de dados | Colunas | Linha de cabecalho | Entidades provaveis |",
        "|---|---:|---:|---:|---|",
    ]
    entity_by_sheet = {item["sheet"]: item for item in analysis["entity_inference"]}
    for sheet in analysis["sheets"]:
        entity = entity_by_sheet.get(sheet["name"], {})
        lines.append(
            f"| {sheet['name']} | {sheet.get('data_rows', 0)} | {len(sheet.get('columns', []))} | "
            f"{sheet.get('header_row_detected', '-')} | {', '.join(entity.get('likely_entities', []))} |"
        )

    lines.extend(["", "## Campos por Aba", ""])
    for sheet in analysis["sheets"]:
        lines.append(f"### {sheet['name']}")
        lines.append("")
        if sheet.get("empty"):
            lines.append("- aba vazia")
            lines.append("")
            continue
        lines.append("| Campo | Classificacao | Preenchimento | Distintos | Exemplos |")
        lines.append("|---|---|---:|---:|---|")
        for col in sheet["columns"]:
            examples = ", ".join(str(v) for v in col["samples"][:4])
            lines.append(
                f"| {col['name']} | `{col['classification']}` | {col['fill_rate']:.0%} | "
                f"{col['distinct']} | {examples} |"
            )
        lines.append("")

    lines.extend(
        [
            "## Leitura Inicial",
            "",
            "- campos classificados como `cadastro_*` tendem a compor tabelas mestres",
            "- campos classificados como `energia`, `monetario` e `data_periodo` tendem a compor fatos/transacoes",
            "- a planilha deve ser normalizada antes de virar banco relacional",
            "- dados de SolisCloud e Digital Grid devem entrar como fontes externas vinculadas por usina, unidade consumidora, cliente e competencia",
            "",
            "## Proximos Passos",
            "",
            "- validar com a ASCENDER quais abas sao alimentadas diariamente",
            "- confirmar significado de cada coluna operacional",
            "- definir chaves reais: usina, UC/instalacao, cliente, contrato e competencia",
            "- separar cadastro inicial de movimentos mensais",
            "- gerar mock de dados para o prototipo React",
        ]
    )
    return "\n".join(lines) + "\n"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--xlsx", default=str(DEFAULT_XLSX))
    parser.add_argument("--out", default=str(DEFAULT_OUT))
    args = parser.parse_args()

    workbook_path = Path(args.xlsx).resolve()
    out_dir = Path(args.out).resolve()
    out_dir.mkdir(parents=True, exist_ok=True)

    wb = load_workbook(workbook_path, data_only=False, read_only=True)
    sheets = [analyze_sheet(ws) for ws in wb.worksheets]
    analysis = {
        "source": str(workbook_path),
        "generated_at": datetime.now().isoformat(timespec="seconds"),
        "sheets": sheets,
        "entity_inference": infer_entities(sheets),
    }

    json_path = out_dir / "controle-usinas-ewaldo-analise.json"
    md_path = out_dir / "Analise da Planilha - Controle de Usinas ASCENDER.md"
    json_path.write_text(json.dumps(analysis, ensure_ascii=False, indent=2), encoding="utf-8")
    md_path.write_text(build_markdown(workbook_path, analysis), encoding="utf-8")

    print(json.dumps({
        "source": str(workbook_path),
        "sheets": len(sheets),
        "json": str(json_path),
        "markdown": str(md_path),
        "sheet_names": [s["name"] for s in sheets],
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
