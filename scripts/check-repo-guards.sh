#!/usr/bin/env bash
# Garde-fous dépôt : motifs à haut risque (secrets) sans dépendance externe.
# Usage : depuis la racine du dépôt : bash scripts/check-repo-guards.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

bad() {
  local pattern="$1"
  local msg="$2"
  local out
  if out=$(git grep -nE "$pattern" \
    -- ':!**/node_modules/**' \
    ':!**/pnpm-lock.yaml' \
    ':!**/package-lock.json' \
    ':!**/.git/**' \
    2>/dev/null); then
    echo "$out"
    echo "check-repo-guards: ${msg}" >&2
    exit 1
  fi
}

bad 'BEGIN (RSA|OPENSSH|EC) PRIVATE KEY' 'Bloc de cle privee (PEM) detecte dans le suivi Git.'
bad 'AKIA[0-9A-Z]{16}' 'Identifiant de cle AWS (prefixe AKIA) detecte.'

echo "check-repo-guards: OK"
