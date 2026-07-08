#!/usr/bin/env python3
"""Gera/atualiza docs/kb/manifest.json a partir dos .md da KB e do cobertura.json.

Registra: documentos da KB (caminho + hash curto + data de modificação),
o conjunto de caminhos de código já analisados (de cobertura.json) e um resumo.

Uso:
    python3 scripts/kb/gen_manifest.py
"""
import datetime
import hashlib
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
KB = os.path.join(ROOT, "docs/kb")
MANIFEST = os.path.join(KB, "manifest.json")
COB = os.path.join(KB, "cobertura.json")


def sha12(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for block in iter(lambda: f.read(65536), b""):
            h.update(block)
    return h.hexdigest()[:12]


def main():
    docs = []
    for dirpath, _, files in os.walk(KB):
        for f in sorted(files):
            if f.endswith(".md"):
                p = os.path.join(dirpath, f)
                docs.append(
                    {
                        "doc": os.path.relpath(p, ROOT),
                        "hash": sha12(p),
                        "atualizado_em": datetime.date.fromtimestamp(
                            os.path.getmtime(p)
                        ).isoformat(),
                    }
                )

    analisados = []
    if os.path.exists(COB):
        with open(COB, encoding="utf-8") as f:
            for m in json.load(f).get("modulos", []):
                analisados += m.get("caminhos_codigo", [])

    manifest = {
        "gerado_em": datetime.date.today().isoformat(),
        "total_documentos": len(docs),
        "documentos": docs,
        "codigo_analisado": sorted(set(analisados)),
    }
    with open(MANIFEST, "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print(f"manifest.json atualizado: {len(docs)} documentos, "
          f"{len(set(analisados))} caminhos de código.")


if __name__ == "__main__":
    main()
