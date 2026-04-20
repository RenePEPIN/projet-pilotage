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
- workflows GitHub Actions pour valider le backend et le build frontend

## Stack technique

| Couche          | Technologies                                       |
| --------------- | -------------------------------------------------- |
| Frontend        | Next.js 14, React 18, App Router                   |
| Frontend tests  | Vitest                                             |
| Backend         | FastAPI, SQLAlchemy, Pydantic v2                   |
| Base de données | SQLite en local, PostgreSQL compatible             |
| Migrations      | Alembic                                            |
| Sécurité        | Proxy Next.js, validation JSON, CORS, CSP, SlowAPI |
| CI              | GitHub Actions                                     |

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

## Installation locale

### Prérequis

- Python 3.12+
- Node.js 20+
- Git

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

## Configuration

### Backend

Créer `backend/.env` à partir de `backend/.env.example`.

```env
DATABASE_URL=sqlite:///./data/api_tache.db
WRITE_API_KEY=changez-moi-en-production
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
TRUST_PROXY_HEADERS=false
TRUSTED_PROXY_IPS=127.0.0.1,::1,localhost
```

### Frontend

Créer `frontend/.env.local` à partir de `frontend/.env.example`.

```env
API_BASE_URL=http://127.0.0.1:8001
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8001
WRITE_API_KEY=changez-moi-en-production
```

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

Alternative Windows avec libération automatique du port 3000 :

```bash
cd frontend
make dev3000
```

## Tests et validation

### Backend

```bash
cd backend
pytest -v
```

Le backend est couvert par 25 tests, notamment sur :

- CRUD tâches et projets
- dépendances entre tâches
- validation des erreurs métier
- détachement de `parent_task_id`
- pagination

### Frontend

```bash
cd frontend
npx --yes pnpm test
```

Le frontend est couvert par 26 tests, notamment sur :

- proxy d'écriture
- client API
- hook `useProjects`
- helpers pagination
- helpers dépendances Kanban

### Build de production

```bash
cd frontend
npx --yes pnpm build
```

## CI/CD

Deux workflows GitHub Actions sont inclus :

- `backend-tests.yml` : installation Python puis exécution de `pytest`
- `frontend-build.yml` : installation Node/pnpm puis build Next.js avec lint et vérifications

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

## Résumé

Projet Pilotage est un bon exemple de projet portfolio seniorisable : il montre à la fois la capacité à construire un produit utile, à structurer une base de code proprement, à sécuriser les flux sensibles et à livrer avec des tests et une CI réalistes.
