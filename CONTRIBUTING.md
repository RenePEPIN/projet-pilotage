# Contribution — Projet Pilotage

Liens : [README](README.md) · [STACK_REFERENCE](STACK_REFERENCE.md) · [ADR-001](docs/ADR-001-politique-lecture-api.md)

## Revue de code (PR)

- Gabarit de description : [`.github/pull_request_template.md`](.github/pull_request_template.md) (checklist tests, secrets / config, [checklist ADR-001](docs/ADR-001-politique-lecture-api.md) si infra).
- Les **garde-fous CI** ([`scripts/check-repo-guards.sh`](scripts/check-repo-guards.sh)) détectent des motifs à haut risque ; ils **ne remplacent pas** une relecture humaine (secrets contextuels, logique métier, exposition réseau).
- Avant tout déploiement ouvrant le backend sur Internet, suivre la **checklist** en fin d’[ADR-001](docs/ADR-001-politique-lecture-api.md) (*Checklist process — avant exposition « hors réseau de confiance »*).

## Outils d’analyse secrets (gitleaks, etc.)

Conformément à la gouvernance du dépôt : **ne pas** ajouter d’action GitHub Marketplace, de binaire ou de package npm pour le scan de secrets **sans** entrée préalable dans [`STACK_REFERENCE.md`](STACK_REFERENCE.md) (version, rôle, DECIDE → THEN IMPLEMENT).
En attendant, le script `check-repo-guards.sh` reste la référence CI sans dépendance externe.

## ADR et tickets

- **Recherche / filtre serveur** : voir [ADR-003 (brouillon)](docs/ADR-003-recherche-filtre-serveur.md) — modèle d’issue GitHub *« Activer ADR-003 — recherche / filtre serveur »* ([`.github/ISSUE_TEMPLATE/adr-003-recherche-serveur.yml`](.github/ISSUE_TEMPLATE/adr-003-recherche-serveur.yml)) lorsque les critères de volumétrie / produit sont remplis.
- **Correlation ID** : [ADR-004 (brouillon)](docs/ADR-004-correlation-id-tracing.md), activable après décision observabilité dans `STACK_REFERENCE.md` §5.

## Tests avant merge

- Backend : `pytest` (voir README).
- Frontend : `npm test` et `npm run lint` dans `frontend/`.
