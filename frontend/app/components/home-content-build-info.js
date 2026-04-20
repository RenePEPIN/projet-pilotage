/**
 * Messages flash depuis l’URL (retour formulaire détail) et sous-titres par vue.
 */

export function buildInfo(searchParams) {
  if (searchParams.get("modifier")) {
    return `La tache ${searchParams.get(
      "modifier",
    )} a ete modifiee avec succes`;
  }
  if (searchParams.get("annulerModifier")) {
    return `La tache ${searchParams.get(
      "annulerModifier",
    )} n'a pas ete modifiee`;
  }
  if (searchParams.get("ajouter")) {
    const sectionLabel = searchParams.get("sectionLabel");
    const section = searchParams.get("section");
    const projectName = searchParams.get("projectName");
    const projectSuffix = projectName ? ` - projet ${projectName}` : "";
    if (sectionLabel) {
      return `La tache ${searchParams.get(
        "ajouter",
      )} a ete ajoutee avec succes (${sectionLabel}${projectSuffix})`;
    }
    if (section) {
      return `La tache ${searchParams.get(
        "ajouter",
      )} a ete ajoutee avec succes (${section}${projectSuffix})`;
    }
    return `La tache ${searchParams.get(
      "ajouter",
    )} a ete ajoutee avec succes${projectSuffix}`;
  }
  if (searchParams.get("annulerAjouter")) {
    return "Aucune tache n'a ete ajoutee, creation annulee";
  }
  if (searchParams.get("supprimerTache")) {
    return `La tache ${searchParams.get(
      "supprimerTache",
    )} a ete supprimee avec succes`;
  }
  return "";
}

export const VIEW_SUBTITLES = {
  dashboard:
    "Synthese du projet : indicateurs, acces aux vues et repartition par categorie.",
  kanban: "Kanban — colonnes et glisser-deposer.",
  table: "Vue lignes — toutes les taches en tableau pagine.",
  calendar:
    "Fev. 2006 — avr. 2026 : echeances et repartition ouvrée (sans date).",
  list: "Liste — vue compacte par statut.",
};
