/**
 * Décorateur partagé pour les projets chargés depuis l’API (tests / affichage).
 */
export function decorateProjectApiCreatedAt(project) {
  return { ...project, createdAt: "API" };
}
