# Pull request

## Résumé

<!-- Décrire brièvement le changement. -->

## Checklist

- [ ] **Tests** : `pytest` (backend) et `npm test` + `npm run lint` (frontend) exécutés localement si la PR touche le code concerné.
- [ ] **Secrets & config** : pas de clé / token / mot de passe en dur ; fichiers d’environnement ou d’infra sensibles relus (la CI [`repo-guards`](../../scripts/check-repo-guards.sh) est un filet, pas un substitut à la revue humaine).
- [ ] **Changement d’infra / exposition réseau** : si la PR ouvre ou modifie l’accès au backend vers Internet, la [checklist ADR-001](docs/ADR-001-politique-lecture-api.md) (*Checklist process — avant exposition « hors réseau de confiance »*) a été parcourue et la stratégie (A / B / C) est claire pour les relecteurs.
- [ ] **Documentation** : `STACK_REFERENCE.md` / ADR mis à jour si nouvelle dépendance ou décision structurante (voir [CONTRIBUTING](CONTRIBUTING.md)).
