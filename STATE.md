# État du projet — Projet Pilotage

Vue **opérationnelle** du dépôt : liens, périmètre actuel, points de vigilance. Pour les **versions et règles d’évolution technique**, voir [`STACK_REFERENCE.md`](STACK_REFERENCE.md).

---

## Liens utiles

- **README principal** : [README.md](README.md)
- **Stack figée & décisions techniques** : [STACK_REFERENCE.md](STACK_REFERENCE.md)
- **Politique lectures API (GET)** : [docs/ADR-001-politique-lecture-api.md](docs/ADR-001-politique-lecture-api.md)
- **Workflows CI** : [.github/workflows/](.github/workflows/)
- **Roadmap** : [ROADMAP.md](ROADMAP.md)
- **Journal des versions** : [CHANGELOG.md](CHANGELOG.md)

---

## Phase / périmètre actuel

- **Stade** : projet portfolio / développement local opérationnel.
- **Fonctionnel** : projets, tâches CRUD, dépendances, Kanban / tableau / liste / calendrier, proxy d’écriture, tests backend + frontend, build Next.js en CI.
- **Documentation gouvernance** : `STACK_REFERENCE.md` et ce fichier présents pour alignement process (WePact / anti-dérive stack).

---

## Indicateurs rapides

- **Tests backend** : `pytest` dans `backend/tests/`
- **Tests frontend** : `vitest` dans `frontend/` — voir README (*Tests et validation*)
- **Hooks locaux** : [`.pre-commit-config.yaml`](.pre-commit-config.yaml) — voir README (*Hooks Git*)
- **CHANGELOG** : [CHANGELOG.md](CHANGELOG.md) — squelette [Unreleased]
- **Contribution / revue PR** : [CONTRIBUTING.md](CONTRIBUTING.md)
- **ROADMAP** : [ROADMAP.md](ROADMAP.md) — squelette à détailler

Avant merge : exécuter **pytest** et **vitest** localement. Dépannage API : section *Dépannage local* du README.

---

## Prochaines évolutions possibles (non planifiées ici)

À trancher avec la gouvernance produit ; ne pas ajouter d’outillage sans mise à jour de `STACK_REFERENCE.md` :

- Authentification sur les lectures API si exposition publique.
- Enrichir `CHANGELOG.md` et `ROADMAP.md` au fil des releases (fichiers présents, contenu à compléter).
- Décisions structurantes → ADR dans `docs/`.

---

*Dernière mise à jour : avril 2026.*
