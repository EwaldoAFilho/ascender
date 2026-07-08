#!/usr/bin/env python3
"""Aponta divergências (drift) entre código e KB — heurística simples, avisos.

Reporta:
  - caminhos_codigo em cobertura.json que NÃO existem (doc órfã/desatualizada);
  - módulos com status 'desatualizado' ou 'nao_mapeado';
  - diretórios de código (ascender-app/src/lib/*) SEM cobertura na KB.

Uso:
    python3 scripts/kb/drift.py            # só imprime avisos
    python3 scripts/kb/drift.py --strict   # exit 1 se houver qualquer drift
"""
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
COB = os.path.join(ROOT, "docs/kb/cobertura.json")
LIB = os.path.join(ROOT, "ascender-app/src/lib")


def main():
    if not os.path.exists(COB):
        print("ERRO: docs/kb/cobertura.json não existe.")
        sys.exit(1)
    with open(COB, encoding="utf-8") as f:
        cob = json.load(f)

    covered = set()
    problems = []
    for m in cob.get("modulos", []):
        nome = m.get("nome", "?")
        for p in m.get("caminhos_codigo", []):
            covered.add(p.rstrip("/"))
            if not os.path.exists(os.path.join(ROOT, p)):
                problems.append(f"[caminho inexistente] módulo '{nome}' aponta para {p}")
        if m.get("status") in ("desatualizado", "nao_mapeado"):
            problems.append(f"[status={m.get('status')}] módulo '{nome}'")

    if os.path.isdir(LIB):
        for name in sorted(os.listdir(LIB)):
            rel = f"ascender-app/src/lib/{name}".rstrip("/")
            covered_here = any(
                rel.startswith(c) or c.startswith(rel) for c in covered
            )
            if not covered_here:
                problems.append(f"[sem cobertura] {rel}")

    if problems:
        print("Possível drift entre código e KB:")
        for p in problems:
            print("  - " + p)
        if "--strict" in sys.argv:
            sys.exit(1)
    else:
        print("OK: sem drift aparente.")


if __name__ == "__main__":
    main()
