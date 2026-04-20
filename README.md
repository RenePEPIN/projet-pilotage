# Projet Pilotage

Application fullstack de gestion de projets et de tâches, conçue comme un projet de portfolio orienté qualité logicielle.

Le dépôt met en avant une architecture claire, un backend FastAPI structuré, un frontend Next.js moderne, une base versionnée avec Alembic, des tests automatisés et une approche explicite de la sécurité sur les routes d'écriture.

## Pourquoi ce projet est intéressant pour un recruteur

Ce projet ne montre pas seulement une interface ou une API isolée. Il démontre une capacité à livrer un produit fullstack cohérent de bout en bout :

- conception d'une architecture modulaire
- modélisation métier et validation des données
- gestion des migrations de base de données
- sécurisation des mutations côté serveur
- tests backend et frontend
- build de production et intégration continue

Autrement dit, il reflète une approche d'ingénierie complète, pas seulement une démo visuelle.

## Ce que l'application permet

- gérer plusieurs projets
- créer, modifier et supprimer des tâches
- organiser les tâches dans une vue Kanban par statut
- définir des dépendances entre tâches
- visualiser les échéances dans un calendrier
- paginer les résultats côté API
- bénéficier d'une interface qui gère les états de chargement et d'erreur

## Compétences démontrées

- séparation claire des responsabilités entre UI, logique métier, accès aux données et configuration
- utilisation de FastAPI, SQLAlchemy et Pydantic v2 dans une architecture maintenable
- mise en place d'un proxy d'écriture Next.js pour protéger les secrets
- validation métier sur les dépendances et détection de cycles
- tests automatisés sur les comportements critiques
- workflows GitHub Actions pour valider le backend, le build frontend et les garde-fous dépôt

## Documentation de gouvernance

| Document | Rôle |
| -------- | ---- |
| [`STACK_REFERENCE.md`](STACK_REFERENCE.md) | Stack et versions figées ; périmètre **DÉCISION REQUISE** pour les ajouts d’outillage. |
| [`STATE.md`](STATE.md) | État courant du dépôt et liens vers la doc utile. |
| [`ROADMAP.md`](ROADMAP.md) | Jalons et priorités (squelette à compléter). |
| [`CHANGELOG.md`](CHANGELOG.md) | Notes de version (squelette [Unreleased]). |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | Revue PR, garde-fous secrets, ADR / tickets (recherche serveur, correlation ID). |

---

## Stack technique

| Couche          | Technologies                                       |
| --------------- | -------------------------------------------------- |
| Frontend        | Next.js 14, React 18, App Router                   |
| Frontend tests  | Vitest                                             |
| Backend         | FastAPI, SQLAlchemy, Pydantic v2                   |
| Base de données | SQLite en local, PostgreSQL compatible             |
| Migrations      | Alembic                                            |
| Sécurité        | Proxy, CORS, CSP, SlowAPI ; GET non auth en dev.   |
| CI              | GitHub Actions                                     |

*Politique des lectures GET et détail sécurité : [ADR-001](docs/ADR-001-politique-lecture-api.md).*

## Architecture

```text
Navigateur
  |
  | GET directs
  v
Frontend Next.js
  |
  | POST / PUT / DELETE via proxy serveur
  v
/api/proxy/[...path]
  |
  v
API FastAPI
  |
  v
SQLAlchemy + SQLite / PostgreSQL
```

Le frontend n'expose jamais la clé d'écriture au navigateur. Les mutations passent par une route serveur Next.js qui valide la requête avant transmission au backend.

## Structure du dépôt

```text
.
├── .pre-commit-config.yaml
├── CHANGELOG.md
├── ROADMAP.md
├── STACK_REFERENCE.md
├── STATE.md
├── backend/
│   ├── alembic/
│   ├── core/
│   ├── crud/
│   ├── models/
│   ├── routers/
│   ├── schemas/
│   ├── tests/
│   ├── app_factory.py
│   ├── database.py
│   └── main.py
├── docs/
│   └── ADR-001-politique-lecture-api.md
├── frontend/
│   ├── app/
│   │   ├── api/proxy/[...path]/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── detail/
│   │   └── projects/
│   ├── next.config.mjs
│   ├── Makefile
│   └── package.json
└── .github/workflows/
```

## Focus technique

### Backend

- `app_factory.py` centralise l'assemblage de l'application.
- `crud/`, `routers/`, `schemas/` et `core/` sont séparés proprement.
- les dépendances entre tâches sont validées avec contrôle de cohérence projet et détection de cycle.
- la pagination est gérée directement au niveau API.
- les migrations Alembic sont maintenues avec des helpers DRY d'inspection.

### Frontend

- App Router Next.js avec pages projets, détail et proxy API.
- hook `useProjects` dédié au chargement et au fallback des projets.
- helpers dédiés pour les statuts, la pagination, les dépendances et les appels API.
- vue Kanban avec détection visuelle des tâches bloquées.

### Sécurité

- proxy d'écriture côté serveur
- validation stricte du `Content-Type: application/json`
- sanitisation des segments de chemin via `SAFE_PATH_SEGMENT_RE`
- comparaison de clé API en temps constant côté backend
- Content Security Policy alignée avec l'URL d'API publique
- rate limiting avec prise en charge optionnelle des proxys de confiance

#### Politique des lectures (GET) vs écritures

| Flux | Authentification FastAPI | Remarque |
| ---- | ------------------------- | -------- |
| `POST`, `PUT`, `PATCH`, `DELETE` | Oui — en-tête `X-API-Key` | Le navigateur n'envoie pas la clé en direct : passage par `/api/proxy/...` (serveur Next.js). |
| `GET`, `HEAD` | Non dans ce dépôt | Choix adapté au **développement local** et à un réseau de confiance. |

**Déploiement hors localhost** : avant toute exposition publique de l'URL du backend, définir une stratégie explicite : API uniquement sur réseau privé / VPN, authentification étendue aux GET (clé, JWT, OAuth), ou reverse proxy avec filtrage (IP, mTLS). Le détail des options et le statu quo sont documentés dans [**`docs/ADR-001-politique-lecture-api.md`**](docs/ADR-001-politique-lecture-api.md).

## Installation locale

### Prérequis

- Python **3.12+** (la CI GitHub Actions utilise **3.12** ; un poste en **3.13** ou ultérieur fonctionne en général si `pip install -r requirements.txt` réussit — en cas d’écart, aligner le venv sur 3.12).
- Node.js 20+
- Git

### Hooks Git (pre-commit)

Optionnel : formatage (**Black**, **Ruff**, **Prettier**) et lint (**Next.js / ESLint**) avant chaque commit. Configuration : [`.pre-commit-config.yaml`](.pre-commit-config.yaml).

```bash
pip install pre-commit
pre-commit install
```

Vérifier une fois sur tout le dépôt :

```bash
pre-commit run --all-files
```

Nécessite les dépendances **backend** (`pip install -r requirements.txt`) et **frontend** (`pnpm install` ou `npm install` dans `frontend/`) pour que les hooks puissent s’exécuter.

### Installation — backend

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate

# Linux / macOS
source .venv/bin/activate

pip install -r requirements.txt
```

### Installation — frontend

```bash
cd frontend
npx --yes pnpm install
```

## Configuration

### Configuration — backend

Créer `backend/.env` à partir de `backend/.env.example`.

```env
DATABASE_URL=sqlite:///./data/api_tache.db
WRITE_API_KEY=changez-moi-en-production
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
TRUST_PROXY_HEADERS=false
TRUSTED_PROXY_IPS=127.0.0.1,::1,localhost
```

**Montée en charge** : SQLite convient au développement et à une charge faible. Pour plusieurs utilisateurs simultanés ou déploiement multi-instance, prévoir **PostgreSQL** (`DATABASE_URL`) et le **pooling** des connexions — arbitrage et versions dans [`STACK_REFERENCE.md`](STACK_REFERENCE.md).

### Configuration — frontend

Créer `frontend/.env.local` à partir de `frontend/.env.example`.

```env
API_BASE_URL=http://127.0.0.1:8001
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8001
WRITE_API_KEY=changez-moi-en-production
```

**Optionnel — navigation latérale (liens « projets vedettes »)** : sans variable, les entrées par défaut du dépôt s’affichent. Pour un autre environnement, définir `NEXT_PUBLIC_SHELL_NAV_JSON` avec un JSON valide (tableau de groupes `{ "title", "items": [{ "href", "label", "icon" }] }`). Voir [`frontend/app/lib/shell-nav-config.js`](frontend/app/lib/shell-nav-config.js). Rebuild du frontend après changement (variable injectée au build).

## Démarrage du projet

### 1. Initialiser la base

```bash
cd backend
alembic upgrade head
```

### 2. Lancer l'API

```bash
cd backend
uvicorn main:app --host 127.0.0.1 --port 8001 --reload
```

API disponible sur `http://127.0.0.1:8001`
Documentation Swagger : `http://127.0.0.1:8001/docs`

### 3. Lancer le frontend

```bash
cd frontend
npx --yes pnpm dev --port 3000
```

Application disponible sur `http://localhost:3000`

### Dépannage local (API injoignable, 503 sur `/api/proxy/...`)

| Symptôme | Variables à vérifier | Action |
| -------- | -------------------- | ------ |
| **503** ou délais ~10–12 s sur les appels données | `frontend/.env.local` : `API_BASE_URL` (et `NEXT_PUBLIC_API_BASE_URL`) doivent pointer vers l’URL où **uvicorn** écoute (ex. `http://127.0.0.1:8001`). | Redémarrer `pnpm dev` après modification du `.env.local`. |
| Backend qui refuse de démarrer | `backend/.env` : **`WRITE_API_KEY`** obligatoire (voir `core/config.py`). | Définir une valeur non vide ; même valeur côté frontend pour le proxy si vous testez des écritures. |
| Écritures 401 via le navigateur | `WRITE_API_KEY` dans `frontend/.env.local` alignée sur le backend. | Pas de clé dans le bundle client pour les GET ; le proxy lit la clé côté serveur Next. |

**Rappel** : l’API FastAPI doit être lancée (`uvicorn` sur le même host/port que `API_BASE_URL`) avant d’utiliser l’interface.

Alternative Windows avec libération automatique du port 3000 :

```bash
cd frontend
make dev3000
```

## Tests et validation

Avant une **fusion (merge)** sur la branche principale, il est recommandé d’aligner la CI en exécutant localement **`pytest`** (backend) et **`vitest`** (frontend) — voir les commandes ci-dessous. En cas d’échec lié à l’API, voir la section **Dépannage local** (plus bas dans ce fichier).

### Tests — backend

```bash
cd backend
pytest -v
```

Le backend est couvert par une suite **pytest** (voir CI), notamment sur :

- CRUD tâches et projets
- dépendances entre tâches
- validation des erreurs métier
- détachement de `parent_task_id`
- pagination

### Tests — frontend

```bash
cd frontend
npx --yes pnpm test
```

Le frontend est couvert par une suite Vitest (proxy, client API, hook `useProjects`, pagination, dépendances, calendrier, etc.).

### Build de production

```bash
cd frontend
npx --yes pnpm build
```

## CI/CD

Trois workflows GitHub Actions sont inclus :

- `backend-tests.yml` : installation Python puis exécution de `pytest`
- `frontend-build.yml` : installation Node/pnpm puis build Next.js avec lint et vérifications
- `repo-guards.yml` : exécution de [`scripts/check-repo-guards.sh`](scripts/check-repo-guards.sh) (motifs à haut risque type clé PEM ou préfixe `AKIA`, sans dépendance externe)

## Migrations de base de données

Révisions principales :

- `0001` : création de `taches`
- `0002` : ajout des projets et du scope projet
- `0003` : dépendance parent `parent_task_id`
- `0004` : ajout de `due_date`
- `0005` : contrainte enum sur `etat`

Commandes utiles :

```bash
alembic upgrade head
alembic downgrade base
alembic current
```

## API principale

### Health

- `GET /health/db`

### Projects

- `GET /projects/`
- `GET /projects/defaults`
- `POST /projects/`
- `PATCH /projects/{project_id}`

### Tasks

- `GET /taches/`
- `GET /taches/{tache_id}`
- `POST /taches/`
- `PUT /taches/{tache_id}`
- `DELETE /taches/{tache_id}`

Les routes d'écriture nécessitent l'en-tête `X-API-Key` côté backend. Dans le navigateur, elles passent par le proxy Next.js.

Les **lectures** (`GET`) ne sont pas protégées par clé API dans cette version — voir la sous-section *Politique des lectures (GET) vs écritures* plus haut et l'[ADR-001](docs/ADR-001-politique-lecture-api.md).

## Résumé

Projet Pilotage est un bon exemple de projet portfolio seniorisable : il montre à la fois la capacité à construire un produit utile, à structurer une base de code proprement, à sécuriser les flux sensibles et à livrer avec des tests et une CI réalistes.
