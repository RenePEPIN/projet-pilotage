# App de pilotage — Todo / Task Manager

Application fullstack de gestion de tâches organisées par projets, avec une vue Kanban, des dépendances entre tâches et un calendrier intégré.

---

## Sommaire

- [Architecture](#architecture)
- [Stack technique](#stack-technique)
- [Structure du dépôt](#structure-du-dépôt)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Configuration](#configuration)
- [Lancer le projet en local](#lancer-le-projet-en-local)
- [Tests](#tests)
- [CI/CD](#cicd)
- [Migrations de base de données](#migrations-de-base-de-données)
- [API — Endpoints principaux](#api--endpoints-principaux)
- [Variables d'environnement](#variables-denvironnement)
- [Sécurité](#sécurité)

---

## Architecture

```
┌─────────────────────────────────────┐
│         Navigateur (client)         │
│   Next.js App Router — React 18     │
│   Lecture directe API (GET)         │
│   Écriture via proxy sécurisé       │
└────────────┬─────────────┬──────────┘
             │ GET          │ POST/PUT/PATCH/DELETE
             │              ▼
             │  ┌───────────────────────────┐
             │  │  /api/proxy/[...path]     │
             │  │  Route Next.js Server     │
             │  │  • Validation HMAC key    │
             │  │  • Sanitisation du chemin │
             │  │  • Validation Content-Type│
             │  └────────────┬──────────────┘
             │               │
             ▼               ▼
┌─────────────────────────────────────┐
│         FastAPI (Python)            │
│   SQLAlchemy + SQLite / PostgreSQL  │
│   Alembic — migrations versionnées  │
│   SlowAPI — rate limiting           │
└─────────────────────────────────────┘
```

Le frontend ne transmet jamais la `WRITE_API_KEY` au navigateur. Toutes les mutations passent par un proxy Next.js côté serveur qui valide la clé par comparaison HMAC en temps constant.

---

## Stack technique

| Couche               | Technologie                      | Version |
| -------------------- | -------------------------------- | ------- |
| Frontend             | Next.js                          | 14.2.5  |
| Frontend             | React                            | 18.3.1  |
| Frontend — tests     | Vitest                           | 4.x     |
| Frontend — pkg       | pnpm                             | via npx |
| Backend              | FastAPI                          | 0.136.0 |
| Backend              | SQLAlchemy                       | 2.0.x   |
| Backend              | Pydantic                         | v2      |
| Backend — migrations | Alembic                          | 1.18.x  |
| Backend — rate limit | SlowAPI                          | 0.1.9   |
| Backend — tests      | pytest                           | 9.x     |
| Base de données      | SQLite (dev) / PostgreSQL (prod) | —       |
| Runtime Python       | Python                           | ≥ 3.12  |
| Runtime Node         | Node.js                          | ≥ 20    |

---

## Structure du dépôt

```
.
├── backend/
│   ├── alembic/                  # Migrations Alembic versionnées
│   │   └── versions/
│   │       ├── 0001_create_taches_table.py
│   │       ├── 0002_projects_and_task_scope.py
│   │       ├── 0003_add_parent_task_dependency.py
│   │       ├── 0004_add_due_date_to_taches.py
│   │       └── 0005_constrain_tache_etat_enum.py
│   ├── alembic_inspection.py     # Helpers DRY pour les migrations
│   ├── app_factory.py            # Factory FastAPI (middlewares, routeurs)
│   ├── core/
│   │   ├── config.py             # Settings (dotenv)
│   │   ├── rate_limit.py         # Limiter + dérivation IP client
│   │   └── task_status.py        # Enum Etat partagé (modèle + schéma)
│   ├── crud/                     # Couche accès données
│   ├── database.py               # Moteur SQLAlchemy, session, ping
│   ├── dependencies.py           # Dépendances FastAPI (auth, session)
│   ├── main.py                   # Point d'entrée uvicorn
│   ├── models/                   # Modèles ORM
│   ├── requirements.txt
│   ├── routers/
│   │   ├── health.py             # GET /health
│   │   ├── projects.py           # CRUD projets
│   │   └── taches.py             # CRUD tâches
│   ├── schemas/                  # Schémas Pydantic (request / response)
│   ├── scripts/
│   │   └── start-api.ps1         # Script de démarrage Windows
│   └── tests/
│       └── test_api.py           # Suite pytest — 25 tests
│
├── frontend/
│   ├── app/
│   │   ├── api/proxy/[...path]/
│   │   │   ├── route.js          # Proxy sécurisé écriture
│   │   │   └── route.test.js
│   │   ├── components/           # Composants React (Kanban, formulaires…)
│   │   ├── hooks/                # use-projects
│   │   ├── lib/                  # Helpers métier et API client
│   │   ├── projects/             # Pages projets
│   │   ├── detail/               # Page détail / édition tâche
│   │   └── page.js               # Page d'accueil
│   ├── next.config.mjs           # Config Next (CSP, headers)
│   ├── Makefile                  # Raccourcis dev
│   └── package.json
│
├── .github/
│   └── workflows/
│       ├── backend-tests.yml     # CI pytest
│       └── frontend-build.yml    # CI build + lint Next.js
│
└── README.md
```

---

## Prérequis

- **Python ≥ 3.12** avec `pip`
- **Node.js ≥ 20** avec `npx`
- **pnpm** (installé automatiquement via `npx --yes pnpm`)
- **Git**

---

## Installation

### Backend

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate
# Linux / macOS
source .venv/bin/activate

pip install -r requirements.txt
```

### Frontend

```bash
cd frontend
npx --yes pnpm install
```

---

## Configuration

### Backend — `backend/.env`

Copier le fichier d'exemple :

```bash
cp backend/.env.example backend/.env
```

| Variable              | Défaut                          | Description                            |
| --------------------- | ------------------------------- | -------------------------------------- |
| `DATABASE_URL`        | `sqlite:///./data/api_tache.db` | URL SQLAlchemy (SQLite ou PostgreSQL)  |
| `WRITE_API_KEY`       | `changez-moi-en-production`     | Clé secrète pour les routes d'écriture |
| `ALLOWED_ORIGINS`     | `http://localhost:3000`         | Origines CORS autorisées (virgules)    |
| `TRUST_PROXY_HEADERS` | `false`                         | Lire `X-Forwarded-For` en production   |
| `TRUSTED_PROXY_IPS`   | `127.0.0.1,::1`                 | IPs proxy de confiance                 |

### Frontend — `frontend/.env.local`

Copier le fichier d'exemple :

```bash
cp frontend/.env.example frontend/.env.local
```

| Variable                   | Description                                               |
| -------------------------- | --------------------------------------------------------- |
| `API_BASE_URL`             | URL interne backend (côté serveur Next.js)                |
| `NEXT_PUBLIC_API_BASE_URL` | URL backend exposée au navigateur + utilisée par la CSP   |
| `WRITE_API_KEY`            | Doit correspondre exactement à `WRITE_API_KEY` du backend |

> ⚠️ `WRITE_API_KEY` n'est jamais envoyée au navigateur — elle est lue uniquement dans la route proxy `/api/proxy/[...path]` côté serveur.

---

## Lancer le projet en local

### 1. Initialiser la base de données

```bash
cd backend
alembic upgrade head
```

### 2. Démarrer le backend

```bash
# Dans backend/ avec le venv activé
uvicorn main:app --host 127.0.0.1 --port 8001 --reload
```

L'API est disponible sur `http://127.0.0.1:8001`.  
Documentation Swagger : `http://127.0.0.1:8001/docs`

### 3. Démarrer le frontend

```bash
# Option A — via Makefile (libère le port 3000 si occupé)
cd frontend
make dev3000

# Option B — directement
cd frontend
npx --yes pnpm dev --port 3000
```

L'application est disponible sur `http://localhost:3000`.

---

## Tests

### Backend

```bash
cd backend
# Avec le venv activé
pytest -v
```

25 tests couvrant les CRUD tâches, projets, dépendances, pagination et régressions de nullité.

Pour les tests utilisant une base SQLite dédiée :

```bash
ALLOW_TEST_DATABASE=1 pytest -v
```

### Frontend

```bash
cd frontend
npx --yes pnpm test
```

26 tests Vitest couvrant :

- Proxy (400, 405, 415, succès)
- Client API (retry, timeout, gestion d'erreurs)
- Hook `useProjects` (réponse vide, liste API, defaults)
- Helpers Kanban (dépendances, tri topologique)
- Helpers pagination et troncature

---

## CI/CD

Deux workflows GitHub Actions s'exécutent sur chaque push et pull request vers `main` / `master` :

| Workflow       | Fichier                                | Ce qu'il fait                                                    |
| -------------- | -------------------------------------- | ---------------------------------------------------------------- |
| Backend Tests  | `.github/workflows/backend-tests.yml`  | Installe deps Python, exécute `pytest`                           |
| Frontend Build | `.github/workflows/frontend-build.yml` | Installe deps Node, exécute `next build` avec lint et type-check |

---

## Migrations de base de données

Les migrations sont versionnées dans `backend/alembic/versions/` :

| Révision | Description                            |
| -------- | -------------------------------------- |
| `0001`   | Création de la table `taches`          |
| `0002`   | Ajout des projets et portée des tâches |
| `0003`   | Dépendance parent (`parent_task_id`)   |
| `0004`   | Ajout de `due_date`                    |
| `0005`   | Contrainte enum sur `etat`             |

```bash
# Appliquer toutes les migrations
alembic upgrade head

# Revenir en arrière (smoke test)
alembic downgrade base

# Voir l'état actuel
alembic current
```

---

## API — Endpoints principaux

### Santé

| Méthode | Route     | Description                          |
| ------- | --------- | ------------------------------------ |
| `GET`   | `/health` | Vérifie que l'API est opérationnelle |

### Projets

| Méthode  | Route                | Description                     |
| -------- | -------------------- | ------------------------------- |
| `GET`    | `/projects/`         | Liste tous les projets          |
| `POST`   | `/projects/`         | Crée un projet                  |
| `PATCH`  | `/projects/{id}`     | Renomme un projet               |
| `DELETE` | `/projects/{id}`     | Supprime un projet              |
| `GET`    | `/projects/defaults` | Retourne les projets par défaut |

### Tâches

| Méthode  | Route          | Description                                                 |
| -------- | -------------- | ----------------------------------------------------------- |
| `GET`    | `/taches/`     | Liste les tâches (filtres: `project_id`, `limit`, `offset`) |
| `POST`   | `/taches/`     | Crée une tâche                                              |
| `GET`    | `/taches/{id}` | Récupère une tâche                                          |
| `PUT`    | `/taches/{id}` | Met à jour une tâche (remplace)                             |
| `PATCH`  | `/taches/{id}` | Met à jour partiellement une tâche                          |
| `DELETE` | `/taches/{id}` | Supprime une tâche                                          |

Les routes `POST`, `PUT`, `PATCH`, `DELETE` nécessitent l'en-tête `X-Write-Api-Key: <WRITE_API_KEY>`.

---

## Variables d'environnement

Récapitulatif complet :

```
# backend/.env
DATABASE_URL=sqlite:///./data/api_tache.db
WRITE_API_KEY=changez-moi-en-production
ALLOWED_ORIGINS=http://localhost:3000
TRUST_PROXY_HEADERS=false
TRUSTED_PROXY_IPS=127.0.0.1,::1

# frontend/.env.local
API_BASE_URL=http://127.0.0.1:8001
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8001
WRITE_API_KEY=changez-moi-en-production
```

---

## Sécurité

- **Proxy sécurisé** : toutes les mutations transitent par `/api/proxy/[...path]` côté serveur Next.js. La clé n'est jamais exposée au navigateur.
- **Validation HMAC** : comparaison de la clé en temps constant (`timingSafeEqual`) pour se prémunir contre les attaques temporelles.
- **Sanitisation de chemin** : chaque segment de l'URL proxy est validé via une expression régulière stricte (`SAFE_PATH_SEGMENT_RE`) avant d'être transmis au backend.
- **Validation Content-Type** : les routes `POST`, `PUT`, `PATCH` exigent `Content-Type: application/json`.
- **CORS** : liste blanche d'origines configurable via `ALLOWED_ORIGINS`.
- **CSP** : en-têtes Content-Security-Policy générés dans `next.config.mjs`, alignés sur `NEXT_PUBLIC_API_BASE_URL`.
- **Rate limiting** : SlowAPI avec dérivation d'IP cliente sécurisée (prise en compte optionnelle des headers proxy).
