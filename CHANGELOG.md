# Changelog — Projet Pilotage

Format inspiré de [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/). Les versions suivent le **sémantique** si le projet adopte des tags (`v1.0.0`, etc.).

Liens : [README](README.md) · [ROADMAP](ROADMAP.md) · [État du projet](STATE.md)

---

## [Unreleased]

### À documenter lors des prochaines livraisons

- Ajouts, corrections, changements breaking, sécurité.

### Dev

- GitHub : [`.github/pull_request_template.md`](.github/pull_request_template.md), [issue ADR-003](.github/ISSUE_TEMPLATE/adr-003-recherche-serveur.yml) ; [CONTRIBUTING](CONTRIBUTING.md) mis à jour.
- Frontend : `app-shell` découpé (`app-shell-icons`, `app-shell-nav-config`, `app-shell-breadcrumb` + test Vitest fil d’Ariane).
- Documentation : [ADR-001](docs/ADR-001-politique-lecture-api.md) — *Alignement déploiement* (A/B/C), *Checklist process* avant exposition hors réseau de confiance ; [ADR-003](docs/ADR-003-recherche-filtre-serveur.md) / [ADR-004](docs/ADR-004-correlation-id-tracing.md) (brouillons) ; [CONTRIBUTING.md](CONTRIBUTING.md) ; [STACK_REFERENCE](STACK_REFERENCE.md) / [ROADMAP](ROADMAP.md) mis à jour.
- Frontend : notes stratégiques — `strategic-notes-local.js` (stockage + format date) ; `category-constants` réexporte la clé localStorage.
- CI : workflow `repo-guards.yml` + [`scripts/check-repo-guards.sh`](scripts/check-repo-guards.sh) (motifs secrets, sans dépendance).
- Frontend : refactor pilotage — `usePilotageGlobalTasks`, `PilotageTasksTable`, `pilotage-project-helpers` (recherche + backlog).
- Frontend : proxy `/api/proxy/*` — refus explicite **503** + logs si `WRITE_API_KEY` est vide ; plafond de pages sur `getAllTasksGlobal` / `getAllTasksByProjectId` ; refactor `use-project-board-state` en hooks (`use-board-tasks-paging`, `use-board-filters`, `use-board-kanban-actions`) + `useProjectsWithApiDecorated` / `decorateProjectApiCreatedAt`.
- Configuration **pre-commit** : hook ESLint portable (`npm run lint:fix`), Prettier figé sur **mirrors-prettier v3.1.0**, documentation dans le README ; formatage initial (Black, Ruff, Prettier, whitespace) et `noqa` Ruff E402 sur `backend/main.py` (imports après `load_dotenv`).
- Backend : `DependencyValidationError` réexportée depuis `crud.tache` (alignée sur `validators.dependency`) ; tests de contrat `tests/test_crud_contract.py` (import `main:app` + identité du type).
- Frontend : **503** mappé dans `api-client.js` (message explicite + `detail` du proxy) ; `detail-form` découpé en `detail-form-fields.js` et `detail-form-actions.js` ; README (Python CI vs local, tableau dépannage API/503).
- Frontend : **502** / **504** mappés dans `api-client.js` ; `home-content.js` découpé en modules (`home-content-hero.js`, filtres, bannières, KPI/pagination, vues) ; **i18n** notée DÉCISION REQUISE dans `STACK_REFERENCE.md` ; README — rappel pytest/vitest avant merge.
- Frontend : **`500`** mappé dans `api-client.js` ; `task-category-section.js` découpé (`task-category-kanban-column.js`, `task-category-list-table.js`, `task-category-display.js`, `task-category-kanban-sort.js`) ; `STACK_REFERENCE` / README — règles i18n sans package, note PostgreSQL / pooling.
- Frontend : `globals.css` réduit à des `@import` ; styles extraits sous `app/styles/` (cascade = ordre des imports) ; règle figée dans `STACK_REFERENCE.md` §3 ; script utilitaire `frontend/scripts/split-globals-css.py` pour ré-extraire si besoin.
- Frontend : **tableau de bord projet** restauré sur `/projects/[projectId]/dashboard` (synthèse KPI + liens vers vues + répartition par catégorie alignée sur les filtres) ; entrée projet `/projects/[id]` redirige vers le dashboard ; onglet « Tableau de bord » dans les onglets de vue ; logique d’agrégation testée (`project-dashboard-rows`).
- Frontend : **pilotage** — recherche globale `/search?q=` (filtre client sur toutes les tâches chargées via API), barre du haut reliée à cette page ; export **CSV** (séparateur `;`, BOM) depuis la recherche et le backlog ; filtre optionnel `?q=` sur le backlog ; pas de nouvelle dépendance npm.
- Frontend : bouton **Notes** (barre d’actions) ouvrant un panneau **Notes stratégiques** ; persistance **API** `GET/PUT /strategic-notes/` (workspace global) + copie `localStorage` en secours ; backend : table `strategic_notes`, migration `0006`, [ADR-002](docs/ADR-002-notes-strategiques-api.md).

---

## Historique

*Aucune release formelle documentée ici pour l’instant — compléter à partir du premier tag ou de la première livraison nommée.*

---

*Fichier créé en février 2026 : squelette pour release notes futures.*
