import argparse
import json
from pathlib import Path

import numpy as np
from sentence_transformers import SentenceTransformer


PROJECT_DIR = Path(__file__).resolve().parents[1]
DEFAULT_EMBED_DIR = PROJECT_DIR / "_embeddings" / "soliscloud-api"
DEFAULT_MODEL = "all-MiniLM-L6-v2"


def load_jsonl(path: Path) -> list[dict]:
    rows = []
    with path.open("r", encoding="utf-8") as handle:
        for line in handle:
            if line.strip():
                rows.append(json.loads(line))
    return rows


def main() -> None:
    parser = argparse.ArgumentParser(description="Busca semantica local na base SolisCloud API da ASCENDER.")
    parser.add_argument("query", help="Pergunta ou termo de busca.")
    parser.add_argument("--embed-dir", default=str(DEFAULT_EMBED_DIR))
    parser.add_argument("--model", default=DEFAULT_MODEL)
    parser.add_argument("--top-k", type=int, default=5)
    args = parser.parse_args()

    embed_dir = Path(args.embed_dir).expanduser().resolve()
    chunks_path = embed_dir / "chunks.jsonl"
    embeddings_path = embed_dir / "embeddings.npy"

    if not chunks_path.exists() or not embeddings_path.exists():
        raise FileNotFoundError(
            "Base nao encontrada. Execute primeiro ingest_soliscloud_api_pdf.py."
        )

    chunks = load_jsonl(chunks_path)
    embeddings = np.load(embeddings_path)
    model = SentenceTransformer(args.model)
    query_vector = model.encode(["query: " + args.query], normalize_embeddings=True)
    scores = embeddings @ query_vector[0]
    top_indexes = np.argsort(scores)[::-1][: args.top_k]

    for rank, idx in enumerate(top_indexes, start=1):
        chunk = chunks[int(idx)]
        endpoints = ", ".join(
            f"{item['method']} {item['path']}" for item in chunk.get("endpoints", [])
        ) or "sem endpoint detectado"
        preview = " ".join(chunk["text"].split())[:700]
        print(f"\n#{rank} score={scores[idx]:.4f}")
        print(f"pagina={chunk['page']} kind={chunk['kind']} chunk_id={chunk['id']}")
        print(f"endpoints={endpoints}")
        print(f"nota={chunk.get('obsidian_note')}")
        print(f"trecho={preview}")


if __name__ == "__main__":
    main()
