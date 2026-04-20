# Roadmap — Projet Pilotage

Document **vivant** : priorités et jalons produit / technique. À **compléter** au fil des besoins. Les versions et outils figés restent dans [`STACK_REFERENCE.md`](STACK_REFERENCE.md).

Liens : [README](README.md) · [État du projet](STATE.md) · [CHANGELOG](CHANGELOG.md) · [CONTRIBUTING](CONTRIBUTING.md)

---

## Principes

- Toute **nouvelle dépendance** ou brique transverse → mise à jour de `STACK_REFERENCE.md` (et ADR si structurant).
- Les items ci-dessous sont des **pistes** ; dates et priorités sont à fixer par l’équipe.

---

## À court terme (à définir)

| Thème           | Détail          | Statut          |
| --------------- | --------------- | --------------- |
| *À compléter*   | *À compléter*   | *À compléter*   |

---

## À moyen terme (à définir)

| Thème | Détail | Statut |
| ----- | ------ | ------ |
| Recherche / backlog à grande échelle | Filtre ou recherche texte **côté API** — [ADR-003 (brouillon)](docs/ADR-003-recherche-filtre-serveur.md) ; ticket type *« Activer ADR-003 »* quand critères volumétrie / produit remplis. | Piste |
| Alignement exposition API | Choisir et documenter la stratégie (backend interne, auth sur les GET, ou réseau fermé) si le déploiement dépasse le dev local — [ADR-001](docs/ADR-001-politique-lecture-api.md). | Piste |
| Correlation ID | [ADR-004 (brouillon)](docs/ADR-004-correlation-id-tracing.md) — implémentation après §5 observabilité figée dans `STACK_REFERENCE.md`. | Bloqué par §5 stack |

---

## Backlog idées (non engagées)

- Authentification des lectures API si exposition publique (voir [ADR-001](docs/ADR-001-politique-lecture-api.md) — section *Alignement déploiement*).
- E2E, observabilité (APM + **correlation_id**), mobile : **DÉCISION REQUISE** dans `STACK_REFERENCE.md` avant implémentation.
- **Notes stratégiques** : **fait** — API `GET/PUT /strategic-notes/` + copie locale secours ; voir [ADR-002](docs/ADR-002-notes-strategiques-api.md). Pistes futures : workspaces multiples, auth utilisateur, chiffrement.

---

*Dernière mise à jour : avril 2026.*
