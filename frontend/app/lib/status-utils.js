export function toUiStatus(rawStatus) {
  const value = String(rawStatus || "")
    .trim()
    .toLowerCase();

  if (value === "a faire" || value === "afaire") {
    return "aFaire";
  }
  if (value === "en cours" || value === "encours") {
    return "enCours";
  }
  if (value === "terminee" || value === "terminée") {
    return "terminee";
  }
  return "aFaire";
}

export function toApiStatus(rawStatus) {
  const uiStatus = toUiStatus(rawStatus);

  if (uiStatus === "enCours") {
    return "En cours";
  }
  if (uiStatus === "terminee") {
    return "Terminee";
  }
  return "A faire";
}

export function getStatusClass(etat) {
  return toUiStatus(etat);
}
