# ADR-004 — Correlation ID (brouillon — dépend de l’observabilité)

## Statut

**Brouillon** — **ne pas implémenter en code** tant que [`STACK_REFERENCE.md`](../STACK_REFERENCE.md) §5 **Observabilité** reste *DÉCISION REQUISE*. Ce document décrit le plan cible pour éviter de rediscuter le *quoi* au moment où l’APM / les traces seront figés.

## Contexte

Sans identifiant de corrélation commun, les logs navigateur, proxy Next et FastAPI sont difficiles à relier en production.

## Décision cible (à activer après choix stack observabilité)

1. **Nom d’en-tête** : par ex. `X-Correlation-ID` ou `traceparent` si la stack W3C Trace Context est retenue — à aligner sur l’outil APM choisi.
2. **Génération** : côté **client** (première requête) ou **proxy Next** (middleware / `route.js`) si l’on veut une source unique pour le SSR.
3. **Propagation** : le proxy ajoute ou transmet l’en-tête vers le backend ; FastAPI le lit et l’injecte dans les logs structurés (ou le middleware de logging).
4. **Réponse** : optionnel — renvoyer le même ID dans les en-têtes de réponse pour le support.

## Hors scope jusqu’à décision

- Aucun package npm ni action CI supplémentaire tant que l’observabilité n’est pas figée dans `STACK_REFERENCE.md`.
- Pas de modification obligatoire du client avant le choix produit.

## Liens

- [STACK_REFERENCE.md §5](../STACK_REFERENCE.md) — Observabilité (DÉCISION REQUISE).
