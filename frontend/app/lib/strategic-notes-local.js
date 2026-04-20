/** Aligné avec l’ancienne constante — réexportée depuis `category-constants.js`. */
export const STORAGE_STRATEGIC_NOTES_KEY = "pilotage-strategic-notes";

export function readNotesFromStorage() {
  if (typeof window === "undefined") {
    return "";
  }
  try {
    return window.localStorage.getItem(STORAGE_STRATEGIC_NOTES_KEY) || "";
  } catch {
    return "";
  }
}

export function writeNotesToStorage(text) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_STRATEGIC_NOTES_KEY, text);
  } catch {
    // quota ou mode privé
  }
}

export function formatStrategicNoteUpdatedAt(iso) {
  if (!iso) {
    return "";
  }
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) {
      return "";
    }
    return d.toLocaleString("fr-FR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return "";
  }
}
