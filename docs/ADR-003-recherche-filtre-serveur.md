# ADR-003 — Recherche / filtre tâches côté API (brouillon)

## Statut

**Brouillon / proposé** — à promouvoir en *Accepté* après revue et avant tout code backend ou changement de contrat `GET /taches/`.

## Contexte

Aujourd’hui, la recherche globale et le filtre backlog chargent l’ensemble des tâches via pagination côté client puis filtrent en mémoire ([`STACK_REFERENCE.md`](../STACK_REFERENCE.md) §3). Ce modèle convient à une volumétrie modeste ; il ne scale pas indéfiniment (réseau, mémoire navigateur, temps de chargement).

## Décision (à trancher)

Lorsque **au moins un** des critères ci-dessous est atteint, ouvrir un **ticket** (titre suggéré : « Activer ADR-003 — recherche / filtre serveur ») et faire valider cette ADR :

| Déclencheur possible | Exemple |
| -------------------- | ------- |
| Volumétrie | > N tâches (à fixer) ou chargement global > X secondis en conditions réelles. |
| Produit | Besoin de recherche full-text, filtres combinés, ou tri serveur. |
| Exposition | Utilisateurs externes ou mobile consommant la même API. |

**Périmètre technique envisagé** (sans engagement tant que l’ADR n’est pas acceptée) :

- Paramètres de requête sur `GET /taches/` (ex. `q`, `project_id` déjà partiel, filtres statut / section).
- Index base adaptés (trigram PostgreSQL, `LIKE` borné, ou full-text selon besoin).
- Pagination conservée ; plus de chargement « tout le corpus » pour la seule recherche.

## Conséquences

- Mise à jour OpenAPI, tests `pytest`, et éventuellement client (`task-api.js`) — **après** acceptation de l’ADR.
- La décision d’implémentation reste **hors scope** tant que ce fichier est en *Brouillon*.

## Liens

- [ADR-001](ADR-001-politique-lecture-api.md) — lectures GET (auth réseau ou future auth sur GET).
- [ROADMAP](../ROADMAP.md) — piste « recherche / backlog à grande échelle ».
