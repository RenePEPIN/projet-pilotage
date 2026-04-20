/** Libellé projet pour tableaux recherche / backlog. */
export function projectLabel(projectId, projectById) {
  return projectById.get(String(projectId)) || projectId;
}
