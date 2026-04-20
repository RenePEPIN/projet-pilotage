import { describe, expect, it } from "vitest";
import {
  CALENDAR_DAYS_IN_VIEW,
  CALENDAR_MAX_MONDAY_KEY,
  CALENDAR_MIN_MONDAY_KEY,
  CALENDAR_RANGE_END_KEY,
  CALENDAR_RANGE_START_KEY,
  addDaysToMondayKey,
  buildFiveWeekDays,
  clampMondayKey,
  compareDateKeys,
  formatDateKey,
  getCalendarRangeTitle,
  isDueDateInAllowedRange,
  mondayKeyFromDate,
  parseLocalDateKey,
  startOfMondayWeek,
} from "./calendar-config";

describe("compareDateKeys", () => {
  it("ordonne les cles ISO YYYY-MM-DD", () => {
    expect(compareDateKeys("2006-02-01", "2006-02-01")).toBe(0);
    expect(compareDateKeys("2006-01-01", "2006-02-01")).toBeLessThan(0);
    expect(compareDateKeys("2026-04-30", "2006-02-01")).toBeGreaterThan(0);
  });
});

describe("isDueDateInAllowedRange", () => {
  it("accepte les bornes inclusives", () => {
    expect(isDueDateInAllowedRange(CALENDAR_RANGE_START_KEY)).toBe(true);
    expect(isDueDateInAllowedRange(CALENDAR_RANGE_END_KEY)).toBe(true);
  });

  it("refuse hors plage", () => {
    expect(isDueDateInAllowedRange("2005-12-31")).toBe(false);
    expect(isDueDateInAllowedRange("2026-05-01")).toBe(false);
  });
});

describe("clampMondayKey", () => {
  it("ramene au lundi minimum si trop tot", () => {
    expect(clampMondayKey("2000-01-01")).toBe(CALENDAR_MIN_MONDAY_KEY);
  });

  it("ramene au lundi maximum si trop tard", () => {
    expect(clampMondayKey("2030-01-01")).toBe(CALENDAR_MAX_MONDAY_KEY);
  });

  it("laisse inchangé un lundi dans la fenetre", () => {
    expect(clampMondayKey(CALENDAR_MIN_MONDAY_KEY)).toBe(
      CALENDAR_MIN_MONDAY_KEY,
    );
    expect(clampMondayKey("2020-06-01")).toBe("2020-06-01");
  });
});

describe("navigation 5 semaines et bornes", () => {
  it("recule d une fenetre puis clamp au minimum", () => {
    const stepped = addDaysToMondayKey(
      CALENDAR_MIN_MONDAY_KEY,
      -CALENDAR_DAYS_IN_VIEW,
    );
    expect(clampMondayKey(stepped)).toBe(CALENDAR_MIN_MONDAY_KEY);
  });

  it("avance d une fenetre depuis le max reste borne", () => {
    const stepped = addDaysToMondayKey(
      CALENDAR_MAX_MONDAY_KEY,
      CALENDAR_DAYS_IN_VIEW,
    );
    expect(clampMondayKey(stepped)).toBe(CALENDAR_MAX_MONDAY_KEY);
  });
});

describe("buildFiveWeekDays", () => {
  it("produit 35 jours consecutifs a partir du lundi", () => {
    const monday = parseLocalDateKey(CALENDAR_MIN_MONDAY_KEY);
    const days = buildFiveWeekDays(monday);
    expect(days).toHaveLength(35);
    expect(formatDateKey(days[0])).toBe(CALENDAR_MIN_MONDAY_KEY);
    expect(formatDateKey(days[34])).toBe("2006-03-12");
  });
});

describe("mondayKeyFromDate", () => {
  it("retourne le lundi de la meme semaine", () => {
    const wed = new Date(2006, 1, 1);
    expect(mondayKeyFromDate(wed)).toBe("2006-01-30");
  });
});

describe("getCalendarRangeTitle", () => {
  it("retourne une chaine vide si grille vide", () => {
    expect(getCalendarRangeTitle([])).toBe("");
  });

  it("formate un titre avec premier et dernier jour", () => {
    const monday = parseLocalDateKey(CALENDAR_MIN_MONDAY_KEY);
    const days = buildFiveWeekDays(monday);
    const title = getCalendarRangeTitle(days);
    expect(title).toContain("—");
    expect(title.length).toBeGreaterThan(10);
  });
});

describe("startOfMondayWeek", () => {
  it("aligne sur le lundi", () => {
    const d = new Date(2026, 3, 30);
    const mon = startOfMondayWeek(d);
    expect(mon.getDay()).toBe(1);
  });
});
