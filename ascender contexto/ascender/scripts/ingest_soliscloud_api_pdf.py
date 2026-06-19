import argparse
import hashlib
import json
import re
import shutil
from collections import Counter
from datetime import datetime
from pathlib import Path

import numpy as np
from pypdf import PdfReader
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity


PROJECT_DIR = Path(__file__).resolve().parents[1]
DEFAULT_PDF = Path(r"C:\Users\slaye\Downloads\SolisCloud Platform API Document V2.0.pdf")
DEFAULT_KB_DIR = PROJECT_DIR / "base-conhecimento" / "soliscloud-api"
DEFAULT_EMBED_DIR = PROJECT_DIR / "_embeddings" / "soliscloud-api"
DEFAULT_MODEL = "all-MiniLM-L6-v2"
DEFAULT_MAX_CHARS = 2400
DEFAULT_OVERLAP = 280


ENDPOINT_RX = re.compile(
    r"(?P<method>GET|POST|PUT|DELETE|PATCH)\s+"
    r"(?P<path>(?:https?://[^\s`]+|/[A-Za-z0-9_./{}?=&:%-]+))",
    re.IGNORECASE,
)
PATH_ONLY_RX = re.compile(r"(?<!\w)(/[A-Za-z0-9_./{}-]*(?:api|v\d|station|plant|inverter|device|alarm|energy|login|token)[A-Za-z0-9_./{}-]*)", re.IGNORECASE)
AUTH_RX = re.compile(r"token|secret|sign|signature|key|authorization|auth|password|nonce|timestamp", re.IGNORECASE)


def slugify(value: str, fallback: str) -> str:
    value = value.lower()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    value = value.strip("-")
    return value or fallback


def sha1(text: str) -> str:
    return hashlib.sha1(text.encode("utf-8", errors="ignore")).hexdigest()[:16]


def normalize_text(text: str) -> str:
    text = text.replace("\x00", "")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def read_pdf_pages(pdf_path: Path) -> list[dict]:
    reader = PdfReader(str(pdf_path))
    pages = []
    for page_number, page in enumerate(reader.pages, start=1):
        text = page.extract_text() or ""
        text = normalize_text(text)
        if text:
            pages.append({"page": page_number, "text": text})
    return pages


def heading_for_text(text: str, page_number: int) -> str:
    for line in text.splitlines():
        clean = line.strip()
        if not clean:
            continue
        if len(clean) > 90:
            clean = clean[:87].rstrip() + "..."
        return clean
    return f"Pagina {page_number}"


def chunk_text(text: str, max_chars: int, overlap: int) -> list[str]:
    paragraphs = [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]
    chunks = []
    current = ""

    for paragraph in paragraphs:
        candidate = f"{current}\n\n{paragraph}".strip() if current else paragraph
        if len(candidate) <= max_chars:
            current = candidate
            continue
        if current:
            chunks.append(current)
        if len(paragraph) <= max_chars:
            current = paragraph
            continue
        start = 0
        while start < len(paragraph):
            part = paragraph[start : start + max_chars].strip()
            if part:
                chunks.append(part)
            if start + max_chars >= len(paragraph):
                break
            start += max_chars - overlap
        current = ""

    if current:
        chunks.append(current)
    return chunks


def extract_endpoint_hints(text: str) -> list[dict]:
    found = []
    seen = set()
    for match in ENDPOINT_RX.finditer(text):
        method = match.group("method").upper()
        path = match.group("path").rstrip(".,;)")
        key = (method, path)
        if key not in seen:
            found.append({"method": method, "path": path})
            seen.add(key)
    for match in PATH_ONLY_RX.finditer(text):
        path = match.group(1).rstrip(".,;)")
        key = ("UNKNOWN", path)
        if key not in seen:
            found.append({"method": "UNKNOWN", "path": path})
            seen.add(key)
    return found


def classify_chunk(text: str, endpoints: list[dict]) -> str:
    lower = text.lower()
    if endpoints:
        return "endpoint"
    if AUTH_RX.search(text):
        return "autenticacao"
    if any(term in lower for term in ["error", "erro", "code", "status", "response"]):
        return "resposta_erro"
    if any(term in lower for term in ["parameter", "parametro", "request", "body"]):
        return "parametros"
    return "referencia"


def make_chunks(pages: list[dict], max_chars: int, overlap: int) -> list[dict]:
    chunks = []
    for page in pages:
        page_number = page["page"]
        heading = heading_for_text(page["text"], page_number)
        parts = chunk_text(page["text"], max_chars=max_chars, overlap=overlap)
        for idx, part in enumerate(parts, start=1):
            endpoints = extract_endpoint_hints(part)
            kind = classify_chunk(part, endpoints)
            chunk_id = sha1(f"soliscloud-api:{page_number}:{idx}:{part[:700]}")
            chunks.append(
                {
                    "id": chunk_id,
                    "empresa": "ASCENDER",
                    "dominio": "soliscloud-api",
                    "source": "SolisCloud Platform API Document V2.0.pdf",
                    "page": page_number,
                    "chunk_index": idx,
                    "title": heading,
                    "kind": kind,
                    "endpoints": endpoints,
                    "text": part,
                }
            )
    return chunks


def write_json(path: Path, data) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def write_jsonl(path: Path, rows: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        for row in rows:
            handle.write(json.dumps(row, ensure_ascii=False) + "\n")


def write_chunk_notes(kb_dir: Path, chunks: list[dict]) -> list[dict]:
    chunk_dir = kb_dir / "chunks"
    chunk_dir.mkdir(parents=True, exist_ok=True)
    notes = []
    for chunk in chunks:
        endpoint = chunk["endpoints"][0]["path"] if chunk["endpoints"] else chunk["title"]
        filename = f"{chunk['page']:03d}-{chunk['chunk_index']:02d}-{slugify(endpoint, chunk['id'])}.md"
        path = chunk_dir / filename
        frontmatter = [
            "---",
            "empresa: ASCENDER",
            "dominio: soliscloud-api",
            f"source: {chunk['source']}",
            f"page: {chunk['page']}",
            f"chunk_id: {chunk['id']}",
            f"kind: {chunk['kind']}",
            "---",
            "",
        ]
        endpoints = ""
        if chunk["endpoints"]:
            lines = ["## Endpoints Detectados", ""]
            for item in chunk["endpoints"]:
                lines.append(f"- `{item['method']} {item['path']}`")
            endpoints = "\n".join(lines) + "\n\n"
        body = (
            "\n".join(frontmatter)
            + f"# SolisCloud API - Pagina {chunk['page']} - Chunk {chunk['chunk_index']}\n\n"
            + f"Origem: `{chunk['source']}`\n\n"
            + endpoints
            + "## Conteudo Extraido\n\n"
            + chunk["text"].strip()
            + "\n"
        )
        path.write_text(body, encoding="utf-8")
        note = {"chunk_id": chunk["id"], "path": str(path), "page": chunk["page"]}
        notes.append(note)
        chunk["obsidian_note"] = str(path)
    return notes


def build_embeddings(chunks: list[dict], model_name: str) -> np.ndarray:
    model = SentenceTransformer(model_name)
    texts = [
        "passage: "
        + item["empresa"]
        + " "
        + item["dominio"]
        + " "
        + item["kind"]
        + " "
        + item["title"]
        + " "
        + item["text"]
        for item in chunks
    ]
    embeddings = model.encode(
        texts,
        batch_size=32,
        normalize_embeddings=True,
        show_progress_bar=True,
    )
    return np.asarray(embeddings, dtype=np.float32)


def top_endpoint_list(chunks: list[dict]) -> list[dict]:
    rows = []
    seen = set()
    for chunk in chunks:
        for endpoint in chunk["endpoints"]:
            key = (endpoint["method"], endpoint["path"])
            if key in seen:
                continue
            rows.append(
                {
                    "method": endpoint["method"],
                    "path": endpoint["path"],
                    "page": chunk["page"],
                    "chunk_id": chunk["id"],
                    "obsidian_note": chunk.get("obsidian_note"),
                }
            )
            seen.add(key)
    return rows


def related_chunks(chunks: list[dict], embeddings: np.ndarray, limit: int = 80) -> list[dict]:
    if len(chunks) < 2:
        return []
    sim = cosine_similarity(embeddings)
    relations = []
    for i in range(len(chunks)):
        for j in range(i + 1, len(chunks)):
            if chunks[i]["page"] == chunks[j]["page"]:
                continue
            score = float(sim[i, j])
            if score >= 0.58:
                relations.append(
                    {
                        "score": round(score, 4),
                        "from_id": chunks[i]["id"],
                        "from_page": chunks[i]["page"],
                        "to_id": chunks[j]["id"],
                        "to_page": chunks[j]["page"],
                    }
                )
    relations.sort(key=lambda item: item["score"], reverse=True)
    return relations[:limit]


def write_overview(kb_dir: Path, pdf_path: Path, chunks: list[dict], endpoints: list[dict], model_name: str) -> Path:
    kind_counts = Counter(item["kind"] for item in chunks)
    pages = sorted({item["page"] for item in chunks})
    lines = [
        "# Base de Conhecimento - SolisCloud API - ASCENDER",
        "",
        "## Contexto",
        "",
        "Base exclusiva da empresa ASCENDER para consulta da documentacao da API SolisCloud.",
        "",
        f"- PDF origem: `{pdf_path}`",
        f"- paginas extraidas: `{len(pages)}`",
        f"- chunks gerados: `{len(chunks)}`",
        f"- modelo de embeddings: `{model_name}`",
        "",
        "## Distribuicao",
        "",
    ]
    for kind, count in kind_counts.most_common():
        lines.append(f"- `{kind}`: {count}")
    lines.extend(["", "## Endpoints Detectados", ""])
    if endpoints:
        for item in endpoints:
            lines.append(f"- `{item['method']} {item['path']}` - pagina `{item['page']}`")
    else:
        lines.append("- Nenhum endpoint detectado automaticamente. Revisar chunks extraidos.")
    lines.extend(
        [
            "",
            "## Como Usar",
            "",
            "- consultar os chunks em `base-conhecimento/soliscloud-api/chunks`",
            "- usar `_embeddings/soliscloud-api/chunks.jsonl` como fonte textual estruturada",
            "- usar `_embeddings/soliscloud-api/embeddings.npy` para busca vetorial local",
            "- usar `scripts/search_soliscloud_api.py` para buscas semanticas",
            "",
            "## Links do Projeto",
            "",
            "- [[05 - Projetos/ascender/Perfil da Empresa|Perfil da Empresa]]",
            "- [[05 - Projetos/ascender/descoberta/Contexto Operacional - ASCENDER Solar Tech|Contexto Operacional - ASCENDER Solar Tech]]",
            "- [[05 - Projetos/ascender/dashboards/Plano Inicial de Dashboards - ASCENDER|Plano Inicial de Dashboards]]",
        ]
    )
    path = kb_dir / "Base de Conhecimento - SolisCloud API - ASCENDER.md"
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return path


def main() -> None:
    parser = argparse.ArgumentParser(description="Ingere PDF da API SolisCloud para base ASCENDER.")
    parser.add_argument("--pdf", default=str(DEFAULT_PDF), help="Caminho do PDF da API SolisCloud.")
    parser.add_argument("--kb-dir", default=str(DEFAULT_KB_DIR), help="Pasta Markdown da base ASCENDER.")
    parser.add_argument("--embed-dir", default=str(DEFAULT_EMBED_DIR), help="Pasta de saida dos embeddings.")
    parser.add_argument("--model", default=DEFAULT_MODEL, help="Modelo sentence-transformers.")
    parser.add_argument("--max-chars", type=int, default=DEFAULT_MAX_CHARS)
    parser.add_argument("--overlap", type=int, default=DEFAULT_OVERLAP)
    parser.add_argument("--copy-pdf", action="store_true", help="Copia o PDF para a pasta da base.")
    args = parser.parse_args()

    pdf_path = Path(args.pdf).expanduser().resolve()
    kb_dir = Path(args.kb_dir).expanduser().resolve()
    embed_dir = Path(args.embed_dir).expanduser().resolve()

    if not pdf_path.exists():
        raise FileNotFoundError(f"PDF nao encontrado: {pdf_path}")

    kb_dir.mkdir(parents=True, exist_ok=True)
    embed_dir.mkdir(parents=True, exist_ok=True)

    pages = read_pdf_pages(pdf_path)
    chunks = make_chunks(pages, max_chars=args.max_chars, overlap=args.overlap)
    if not chunks:
        raise RuntimeError("Nenhum texto foi extraido do PDF.")

    if args.copy_pdf:
        shutil.copy2(pdf_path, kb_dir / pdf_path.name)

    notes = write_chunk_notes(kb_dir, chunks)
    embeddings = build_embeddings(chunks, args.model)
    endpoints = top_endpoint_list(chunks)
    relations = related_chunks(chunks, embeddings)

    np.save(embed_dir / "embeddings.npy", embeddings)
    write_jsonl(embed_dir / "chunks.jsonl", chunks)
    write_json(embed_dir / "endpoints.json", endpoints)
    write_json(embed_dir / "relationships.json", relations)
    write_json(embed_dir / "manifest.json", {
        "empresa": "ASCENDER",
        "dominio": "soliscloud-api",
        "pdf": str(pdf_path),
        "generated_at": datetime.now().isoformat(timespec="seconds"),
        "model": args.model,
        "pages_extracted": len(pages),
        "chunks": len(chunks),
        "chunk_notes": len(notes),
        "endpoints_detected": len(endpoints),
        "outputs": {
            "kb_dir": str(kb_dir),
            "embed_dir": str(embed_dir),
            "chunks_jsonl": str(embed_dir / "chunks.jsonl"),
            "embeddings_npy": str(embed_dir / "embeddings.npy"),
            "endpoints_json": str(embed_dir / "endpoints.json"),
        },
    })
    overview = write_overview(kb_dir, pdf_path, chunks, endpoints, args.model)

    print(json.dumps({
        "empresa": "ASCENDER",
        "pdf": str(pdf_path),
        "pages_extracted": len(pages),
        "chunks": len(chunks),
        "endpoints_detected": len(endpoints),
        "overview": str(overview),
        "embed_dir": str(embed_dir),
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
