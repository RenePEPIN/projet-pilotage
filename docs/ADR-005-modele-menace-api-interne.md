# ADR-005 — Modèle de menace ( périmètre API interne / BFF )

**Statut :** accepté (documentation)
**Date :** 2026-04

## Contexte

L’API FastAPI et le frontend Next.js (`/api/proxy`) sont pensés pour un **réseau de confiance** ou une exposition contrôlée, avec **lectures largement ouvertes** ([ADR-001](ADR-001-politique-lecture-api.md)) et **écritures** protégées par `X-API-Key` (comparaison en temps constant côté backend ; clé **uniquement côté serveur Next** pour les mutations via proxy).

## Actifs

- Intégrité et disponibilité des tâches et projets (SQLite / PostgreSQL selon déploiement).
- La **clé d’écriture** (équivalent secret opératoire partagé).
- Données métier (dont notes stratégiques) — **non chiffrées au repos** dans le schéma actuel (voir ADR-002).

## Menaces traitées

| Menace | Mesure existante |
|--------|-------------------|
| Fuite de clé dans le bundle client | Mutations via `/api/proxy` + `WRITE_API_KEY` env serveur uniquement |
| En-têtes / clickjacking / MIME | CSP, `X-Frame-Options`, `X-Content-Type-Options` (Next) |
| Abus de débit | Rate limiting (SlowAPI) sur routes |
| Injection SQL | ORM SQLAlchemy, pas de SQL dynamique utilisateur pour le cœur métier |
| Confusion sur l’origine HTTP | CORS avec origines listées ; `TRUST_PROXY_HEADERS` documenté si reverse proxy |

## Hors périmètre actuel (non requis pour « confiance réseau »)

- Identification **utilisateur par requête** (GET anonymes possibles — ADR-001).
- **correlation_id** / traçabilité distribuée — DÉCISION REQUISE ([ADR-004](ADR-004-correlation-id-tracing.md)).
- Scans secrets avancés (ex. gitleaks en CI) — DÉCISION REQUISE ([STACK_REFERENCE](../STACK_REFERENCE.md)).

## Processus

- Audits de dépendances **pip-audit** (backend) et **pnpm audit** (frontend) en CI — voir workflows GitHub.
- Revue PR ([checklist ADR-001](ADR-001-politique-lecture-api.md) si exposition publique).

## Conséquence

Tant qu’aucune décision d’**auth utilisateur** ou d’**observabilité** n’est figée dans `STACK_REFERENCE.md`, les implémentations restent alignées sur ce périmètre documenté plutôt que sur un modèle SaaS multi-tenant complet.
