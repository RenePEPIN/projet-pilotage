# ADR-001 — Politique de sécurité des lectures API (GET)

## Statut

Accepté (document de référence pour le dépôt actuel).

## Contexte

L’API FastAPI expose des routes de **lecture** (`GET /taches/`, `GET /projects/`, etc.) sans en-tête d’authentification, alors que les **mutations** (`POST`, `PUT`, `PATCH`, `DELETE`) exigent `X-API-Key`.

Le frontend Next.js appelle l’API en **same-origin** via `/api/proxy/...` ; la clé d’écriture reste côté serveur Node (variable d’environnement), jamais dans le bundle navigateur.

## Décision

- **Conserver** les lectures non authentifiées pour le **développement local** et les environnements où l’API n’est joignable que depuis un réseau de confiance.
- **Documenter** explicitement que ce choix **n’est pas suffisant** pour une exposition Internet publique sans couche supplémentaire.

## Conséquences

### Positives

- Simplicité de mise en route (pas de jeton à gérer pour les GET en dev).
- Les écritures restent protégées par clé API et proxy.

### Négatives / risques

- Toute personne pouvant joindre l’URL du backend peut **lire** les données exposées par les GET (liste des tâches, projets, etc.).
- La **rate limiting** (SlowAPI) limite l’abus mais ne remplace pas un contrôle d’accès.

## Options pour un déploiement production

À trancher selon le contexte (intranet, SaaS, démo publique) :

1. **Réseau** : API uniquement sur VPC, VPN, bastion, ou `127.0.0.1` avec tunnel.
2. **Authentification** : étendre la même logique que les écritures (ex. `X-API-Key` ou Bearer sur les GET), ou sessions/OAuth.
3. **Périmètre** : ne publier que le frontend ; le backend reste interne au cluster (ingress privé).

Toute évolution doit mettre à jour ce document et les tests associés.

---

## Alignement déploiement : « réseau de confiance » vs exposition large

Avant toute mise en production **accessible depuis Internet** ou un parc utilisateurs non maîtrisé, l’équipe doit **trancher explicitement** l’une des stratégies suivantes (combinables) :

| Stratégie | Idée | Quand la privilégier |
| --------- | ---- | -------------------- |
| **A — Backend non exposé** | Seul le frontend Next est public (edge/CDN) ; l’API FastAPI n’est joignable que depuis le réseau interne (même cluster, service interne, pas d’ingress public). Les navigateurs passent par le proxy Next (`/api/proxy/...`) pour les écritures ; les GET depuis le navigateur restent same-origin vers ce proxy si vous routez aussi les lectures par là. | SaaS classique, cohérent avec le modèle actuel « pas de secret dans le bundle ». |
| **B — Auth sur les GET** | Exiger la même (ou une autre) preuve d’identité sur `GET /taches/`, `GET /projects/`, etc., alignée sur les mutations. | API exposée publiquement ou multi-clients sans isoler le backend derrière un réseau fermé. |
| **C — Réseau fermé uniquement** | Pas d’auth lecture renforcée, mais **aucune** route backend vers l’Internet (VPN, IP allowlist, port non publié). | Intranet, démo locale, équipe réduite. |

**Règle** : si le backend est joignable depuis l’extérieur **sans** B ou **sans** C, les données lisibles via GET sont exposées — ce n’est pas corrigé par la seule rate limiting.

Les évolutions de code (middleware, dépendances, OpenAPI) suivent la décision retenue et [`STACK_REFERENCE.md`](../STACK_REFERENCE.md) (section auth / hors périmètre figé).

---

## Checklist process — avant exposition « hors réseau de confiance »

À remplir explicitement (issue, runbook de déploiement, ou section README environnement) **avant** de rendre l’URL du **backend FastAPI** joignable depuis Internet sans VPN / bastion :

- [ ] **Stratégie A, B ou C** (section *Alignement déploiement*) identifiée et **écrite** pour l’environnement cible.
- [ ] **Réseau** : règles firewall / ingress vérifiées (pas d’exposition accidentelle du port API si la stratégie exige un backend interne uniquement).
- [ ] **Same-origin / proxy** : si stratégie A, confirmer que les navigateurs n’appellent pas le backend directement pour des données sensibles sans passer par le périmètre prévu (Next ou autre).
- [ ] **Secrets** : `WRITE_API_KEY` et `DATABASE_URL` uniquement en variables d’environnement, jamais dans le dépôt (complément : CI `repo-guards` + revue humaine).
- [ ] **Revue** : au moins une relecture croisée sur la PR ou le changement d’infra qui ouvre l’exposition réseau.

Cette checklist ne remplace pas une analyse de menace formelle pour un produit réglementé ; elle formalise le **minimum de process** aligné sur cette ADR.
