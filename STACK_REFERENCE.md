# Référence stack — Projet Pilotage

Document de **décision technique figée** pour ce dépôt. Toute nouvelle dépendance ou outillage doit être **répertorié ici** (version ou plage) avant d’être ajouté au code ou à la CI, sauf section marquée **DÉCISION REQUISE**.

Liens : [README](README.md) · [État du projet](STATE.md) · [Roadmap](ROADMAP.md) · [Changelog](CHANGELOG.md) · [CONTRIBUTING](CONTRIBUTING.md) · [ADR-001 lectures API](docs/ADR-001-politique-lecture-api.md) · [ADR-002 notes stratégiques](docs/ADR-002-notes-strategiques-api.md) · [ADR-003 recherche serveur (brouillon)](docs/ADR-003-recherche-filtre-serveur.md) · [ADR-004 correlation ID (brouillon)](docs/ADR-004-correlation-id-tracing.md)

---

## 1. Runtime & langages

| Élément            | Version / choix | Notes           |
| ------------------ | --------------- | --------------- |
| Python (backend)   | 3.12+           | Voir README     |
| Node.js (frontend) | 20+             | Voir README     |
| SQLite (dev)       | via SQLAlchemy  | Voir README     |

PostgreSQL est compatible via `DATABASE_URL` ; dimensionner le **pooling** des connexions en production si charge ou déploiement multi-instance (hors urgence en développement local).

---

## 2. Backend

| Composant            | Version (pin effective) |
| -------------------- | ----------------------- |
| FastAPI              | 0.136.0                 |
| Uvicorn              | 0.44.0                  |
| SQLAlchemy           | 2.0.49                  |
| Pydantic             | 2.13.2                  |
| Alembic              | 1.18.4                  |
| SlowAPI (rate limit) | 0.1.9                   |
| pytest               | 9.0.3                   |
| httpx                | 0.28.1                  |

**API** : REST JSON, OpenAPI via FastAPI (`/docs`).

**Auth mutations** : en-tête `X-API-Key` (comparaison en temps constant). Politique des **lectures GET** : [ADR-001](docs/ADR-001-politique-lecture-api.md).

---

## 3. Frontend

| Composant | Version (pin effective)             |
| --------- | ----------------------------------- |
| Next.js   | 14.2.5                              |
| React     | 18.3.1                              |
| Vitest    | ^4.1.4 (dev)                        |
| ESLint    | ^8.57.1 + eslint-config-next 14.2.5 |

**App Router** Next.js, pas de framework UI tiers imposé (CSS globaux + composants maison).

**CSS — organisation figée (sans dépendance npm supplémentaire)** :

- Point d’entrée unique : [`frontend/app/globals.css`](frontend/app/globals.css) ne contient que des `@import` ; **l’ordre des imports = l’ordre de cascade** — ne pas le réordonner sans revue visuelle.
- Styles globaux découpés sous [`frontend/app/styles/`](frontend/app/styles/) par domaine (tokens, base, layout, pages communes, vues calendrier / kanban / tableaux-formulaires, etc.).
- **CSS Modules** : autorisés **natifs Next.js** (`*.module.css` à côté d’un composant) pour le scope local ; les globaux restent la source pour design tokens, layout et styles transverses partagés.

**Appels API navigateur** : same-origin via `/api/proxy/...` ; pas de secret d’écriture dans le bundle client.

**Recherche & export (pilotage)** : la **recherche globale** (`/search?q=`) et le filtre backlog `?q=` appliquent un filtre **côté navigateur** sur l’ensemble des tâches chargées (boucle pagination `getAllTasksGlobal`, plafond de pages côté client). L’API `/taches/` n’expose pas de paramètre texte de recherche. **Évolution volumétrie** : prévoir un **filtre / recherche côté API** (paramètres de requête, index SQL full-text ou trigram selon besoin) — [ADR-003 (brouillon)](docs/ADR-003-recherche-filtre-serveur.md) à promouvoir avant code ; voir [ROADMAP](ROADMAP.md). **Export CSV** : génération navigateur (Blob), séparateur `;`, BOM UTF-8 pour Excel.

**Notes stratégiques** : panneau depuis la barre d’actions ; **source de vérité** `GET/PUT /strategic-notes/` (workspace `global`, voir [ADR-002](docs/ADR-002-notes-strategiques-api.md)). **PUT** via proxy Next avec clé serveur ; **copie locale** `localStorage` (`pilotage-strategic-notes`) en secours. Pas d’auth utilisateur fine ni chiffrement au repos.

---

## 4. CI / qualité

- **GitHub Actions** : `backend-tests.yml`, `frontend-build.yml`, `repo-guards.yml`
- **PR** : gabarit [`.github/pull_request_template.md`](.github/pull_request_template.md) (tests, secrets/config, checklist [ADR-001](docs/ADR-001-politique-lecture-api.md) si infra) ; modèle d’issue [ADR-003](.github/ISSUE_TEMPLATE/adr-003-recherche-serveur.yml).
- **Garde-fous secrets (sans dépendance)** : [`scripts/check-repo-guards.sh`](scripts/check-repo-guards.sh) — recherche de motifs à haut risque (clés PEM, préfixe `AKIA…`) dans les sources suivies ; exécuté en CI. **Revue humaine** des PR en complément — voir [CONTRIBUTING.md](CONTRIBUTING.md). Un outil dédié type **gitleaks** (action ou binaire) reste **DÉCISION REQUISE** avant d’ajouter une action marketplace ou un package.
- **pre-commit** : [`.pre-commit-config.yaml`](.pre-commit-config.yaml) (optionnel, local)

---

## 5. Hors périmètre figé (DÉCISION REQUISE)

Les sujets ci-dessous ne sont **pas** arbitrés dans ce dépôt ; ne pas introduire de dépendance ni de doc normative qui les impose tant que cette section n’est pas mise à jour.

- **Client mobile (Expo / RN)** — DÉCISION REQUISE
- **Auth utilisateur (OAuth, JWT session) pour les GET API** — DÉCISION REQUISE — voir [ADR-001](docs/ADR-001-politique-lecture-api.md)
- **E2E (Playwright, Cypress, etc.)** — DÉCISION REQUISE
- **Observabilité (APM, traces)** — DÉCISION REQUISE — **correlation_id** : plan cible décrit dans [ADR-004 (brouillon)](docs/ADR-004-correlation-id-tracing.md) ; implémentation uniquement après choix figé ici (génération client ou proxy, propagation backend, logs) ; pas de dépendance npm tant que l’APM n’est pas choisi.
- **Hébergement / orchestration (Docker, K8s)** — DÉCISION REQUISE
- **Internationalisation (i18n)** — DÉCISION REQUISE : chaînes françaises en dur ; figer librairie, stratégie de clés et extraction avant tout package npm.
Tant qu’une ligne **DÉCISION REQUISE** n’est pas remplacée par un choix figé (version + rôle), **ne pas** ajouter de dépendance npm ni de configuration CI associée. Pour **i18n** : lors de la décision, compléter une entrée dans ce document (package + version), documenter la convention de clés (ex. préfixe par domaine), puis extraire les chaînes progressivement.

---

## 6. Révision

Mettre à jour ce fichier lors d’un **upgrade majeur** de dépendance, d’un **changement d’auth**, ou d’une **nouvelle brique** (ex. package npm, service externe).

Dernière mise à jour des versions : **avril 2026** (alignement sur `package.json` et `requirements.txt` du dépôt).
