/**
 * Configuration et utilitaires dates du calendrier projet (plage affichable,
 * bornes de navigation, grille 5 semaines). Source de verite pour eviter les
 * constantes magiques dans les composants.
 */

/** Nombre de semaines affichees (5 x 7 = 35 jours). */
export const CALENDAR_WEEKS_IN_VIEW = 5;

export const CALENDAR_DAYS_IN_VIEW = CALENDAR_WEEKS_IN_VIEW * 7;

/** Plage autorisee pour afficher / positionner les echeances (inclus), cles ISO. */
export const CALENDAR_RANGE_START_KEY = "2006-02-01";

export const CALENDAR_RANGE_END_KEY = "2026-04-30";

/**
 * Premier lundi d une fenetre 5 semaines entierement pertinente (>= 1er fev. 2006).
 */
export const CALENDAR_MIN_MONDAY_KEY = "2006-02-06";

/**
 * Dernier lundi tel que lundi + 34 jours <= 30 avril 2026.
 */
export const CALENDAR_MAX_MONDAY_KEY = "2026-03-23";

const MONTH_LABELS = [
  "Janvier",
  "Fevrier",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Aout",
  "Septembre",
  "Octobre",
  "Novembre",
  "Decembre",
];

export function compareDateKeys(a, b) {
  if (a === b) {
    return 0;
  }
  return a < b ? -1 : 1;
}

export function isDueDateInAllowedRange(dueKey) {
  return (
    compareDateKeys(dueKey, CALENDAR_RANGE_START_KEY) >= 0 &&
    compareDateKeys(dueKey, CALENDAR_RANGE_END_KEY) <= 0
  );
}

export function clampMondayKey(key) {
  if (compareDateKeys(key, CALENDAR_MIN_MONDAY_KEY) < 0) {
    return CALENDAR_MIN_MONDAY_KEY;
  }
  if (compareDateKeys(key, CALENDAR_MAX_MONDAY_KEY) > 0) {
    return CALENDAR_MAX_MONDAY_KEY;
  }
  return key;
}

export function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseLocalDateKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) {
    return new Date();
  }
  const dt = new Date(y, m - 1, d);
  dt.setHours(0, 0, 0, 0);
  return dt;
}

/** Lundi de la semaine (semaine commencant lundi). */
export function startOfMondayWeek(referenceDate) {
  const d = new Date(referenceDate);
  d.setHours(0, 0, 0, 0);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return d;
}

export function mondayKeyFromDate(referenceDate) {
  return formatDateKey(startOfMondayWeek(referenceDate));
}

export function addDaysToMondayKey(mondayKey, deltaDays) {
  const d = parseLocalDateKey(mondayKey);
  d.setDate(d.getDate() + deltaDays);
  return formatDateKey(startOfMondayWeek(d));
}

/** Jours consecutifs a partir du lundi donne (longueur = CALENDAR_DAYS_IN_VIEW). */
export function buildFiveWeekDays(mondayDate) {
  const start = new Date(mondayDate);
  start.setHours(0, 0, 0, 0);
  return Array.from({ length: CALENDAR_DAYS_IN_VIEW }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });
}

export function getCalendarRangeTitle(gridDays) {
  if (gridDays.length === 0) {
    return "";
  }
  const first = gridDays[0];
  const last = gridDays[gridDays.length - 1];
  const sameYear = first.getFullYear() === last.getFullYear();
  const left = sameYear
    ? `${first.getDate()} ${MONTH_LABELS[first.getMonth()]}`
    : `${first.getDate()} ${
        MONTH_LABELS[first.getMonth()]
      } ${first.getFullYear()}`;
  const right = `${last.getDate()} ${
    MONTH_LABELS[last.getMonth()]
  } ${last.getFullYear()}`;
  return `${left} — ${right}`;
}
