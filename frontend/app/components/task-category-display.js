/**
 * Affichage texte commun (catégorie tâche / liste / Kanban).
 */

import { toUiStatus } from "../lib/status-utils";

export function getShortDescription(value) {
  const text = (value || "").trim();
  if (text.length <= 90) {
    return text || "Sans description";
  }
  return `${text.slice(0, 87)}...`;
}

export function getStatusLabel(etat) {
  const labels = {
    aFaire: "A faire",
    enCours: "En cours",
    terminee: "Terminees",
  };
  return labels[toUiStatus(etat)] || etat;
}
