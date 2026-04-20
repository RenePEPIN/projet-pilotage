# ADR-002 — Notes stratégiques persistées (API)

## Contexte

Les notes stratégiques étaient uniquement en `localStorage` (un navigateur). Besoin d’une **source de vérité serveur** pour partage équipe et multi-appareils, avec **mutations** protégées comme le reste de l’API.

## Décision

- **Modèle** `strategic_notes` : une ligne par `workspace_id` ; MVP avec un seul workspace **`global`** (unique constraint).
- **API** :
  - `GET /strategic-notes/` — lecture sans clé (aligné sur les GET dev existants).
  - `PUT /strategic-notes/` — corps `{ "content": "<texte>" }` avec `X-API-Key` (comparaison en temps constant).
- **Frontend** : chargement GET + sauvegarde PUT via proxy Next (clé serveur) ; **copie locale** en secours si API indisponible.
- **Limite** : pas d’auth utilisateur fine, pas de chiffrement au repos ; contenu texte jusqu’à 500 000 caractères (validation Pydantic).

## Conséquences

- Migration Alembic `0006_strategic_notes`.
- `STACK_REFERENCE.md` §3 mis à jour.

## Statut

**Accepté** — avril 2026.
