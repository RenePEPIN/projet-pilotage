"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  CALENDAR_DAYS_IN_VIEW,
  CALENDAR_MAX_MONDAY_KEY,
  CALENDAR_MIN_MONDAY_KEY,
  addDaysToMondayKey,
  buildFiveWeekDays,
  clampMondayKey,
  formatDateKey,
  getCalendarRangeTitle,
  isDueDateInAllowedRange,
  mondayKeyFromDate,
  parseLocalDateKey,
} from "../lib/calendar-config";
import { getStatusClass } from "../lib/status-utils";

const WEEKDAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function sortTasksStable(a, b) {
  const na = Number(a.id);
  const nb = Number(b.id);
  if (Number.isFinite(na) && Number.isFinite(nb) && na !== nb) {
    return na - nb;
  }
  return String(a.titre || "").localeCompare(String(b.titre || ""), "fr");
}

export default function ProjectCalendar({ tasks, activeProjectId }) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [rangeStartMondayKey, setRangeStartMondayKey] = useState(() =>
    clampMondayKey(mondayKeyFromDate(new Date())),
  );

  const gridDays = useMemo(() => {
    const monday = parseLocalDateKey(rangeStartMondayKey);
    return buildFiveWeekDays(monday);
  }, [rangeStartMondayKey]);

  const gridDateKeys = useMemo(() => gridDays.map(formatDateKey), [gridDays]);

  const gridKeySet = useMemo(() => new Set(gridDateKeys), [gridDateKeys]);

  const weekdayKeysInGrid = useMemo(() => {
    return gridDays
      .filter((d) => {
        const dow = d.getDay();
        return dow !== 0 && dow !== 6;
      })
      .map(formatDateKey);
  }, [gridDays]);

  const tasksByDate = useMemo(() => {
    const map = {};

    const withDue = tasks.filter(
      (t) => Boolean(t.dueDate) && isDueDateInAllowedRange(t.dueDate),
    );
    const withoutDue = tasks.filter((t) => !t.dueDate).sort(sortTasksStable);

    withDue.forEach((task) => {
      const key = task.dueDate;
      if (!gridKeySet.has(key)) {
        return;
      }
      if (!map[key]) {
        map[key] = [];
      }
      map[key].push({ task, placement: "due" });
    });

    const workSlots = weekdayKeysInGrid;
    if (workSlots.length > 0) {
      withoutDue.forEach((task, index) => {
        const dateKey = workSlots[index % workSlots.length];
        if (!map[dateKey]) {
          map[dateKey] = [];
        }
        map[dateKey].push({ task, placement: "planned" });
      });
    }

    return map;
  }, [tasks, gridKeySet, weekdayKeysInGrid]);

  const tasksOutsideWindow = useMemo(() => {
    return tasks.filter((t) => {
      if (!t.dueDate) {
        return false;
      }
      if (!isDueDateInAllowedRange(t.dueDate)) {
        return true;
      }
      return !gridKeySet.has(t.dueDate);
    }).length;
  }, [tasks, gridKeySet]);

  const todayKey = formatDateKey(today);

  function showPreviousPeriod() {
    setRangeStartMondayKey((prev) =>
      clampMondayKey(addDaysToMondayKey(prev, -CALENDAR_DAYS_IN_VIEW)),
    );
  }

  function showNextPeriod() {
    setRangeStartMondayKey((prev) =>
      clampMondayKey(addDaysToMondayKey(prev, CALENDAR_DAYS_IN_VIEW)),
    );
  }

  function showCurrentWeekBlock() {
    setRangeStartMondayKey(clampMondayKey(mondayKeyFromDate(new Date())));
  }

  const rangeTitle = getCalendarRangeTitle(gridDays);
  const atMinMonday = rangeStartMondayKey === CALENDAR_MIN_MONDAY_KEY;
  const atMaxMonday = rangeStartMondayKey === CALENDAR_MAX_MONDAY_KEY;

  return (
    <section id="calendrier" className="calendar-panel calendar-panel--gcal">
      <header className="calendar-gcal-header">
        <div className="calendar-gcal-title-block">
          <h2 className="calendar-gcal-h2">Calendrier</h2>
          <p className="calendar-gcal-desc">
            Periode autorisee : 1er fevrier 2006 — 30 avril 2026. Echeances sur
            leur jour ; taches sans date reparties sur les jours ouvres
            (lun-ven) de la fenetre (indicatif).
          </p>
        </div>
        <div
          className="calendar-gcal-toolbar"
          role="toolbar"
          aria-label="Navigation du calendrier"
        >
          <button
            type="button"
            className="calendar-gcal-btn-today"
            onClick={showCurrentWeekBlock}
          >
            Aujourd&apos;hui
          </button>
          <div className="calendar-gcal-nav-cluster">
            <button
              type="button"
              className="calendar-gcal-btn-icon"
              onClick={showPreviousPeriod}
              aria-label="Periode precedente"
              disabled={atMinMonday}
            >
              <span aria-hidden="true">‹</span>
            </button>
            <h3 className="calendar-gcal-range-title">{rangeTitle}</h3>
            <button
              type="button"
              className="calendar-gcal-btn-icon"
              onClick={showNextPeriod}
              aria-label="Periode suivante"
              disabled={atMaxMonday}
            >
              <span aria-hidden="true">›</span>
            </button>
          </div>
        </div>
      </header>

      {tasks.length === 0 ? (
        <p className="empty-column">
          Aucune tache pour ce projet avec les filtres actuels.
        </p>
      ) : (
        <>
          {tasksOutsideWindow > 0 ? (
            <p className="info-banner calendar-outside-hint" role="status">
              {tasksOutsideWindow} tache
              {tasksOutsideWindow > 1 ? "s ont" : " a"} une echeance hors de
              cette fenetre ou hors de la plage fev. 2006 — avr. 2026 — deplace
              la vue ou corrige l&apos;echeance.
            </p>
          ) : null}
          <div className="calendar-scroll calendar-scroll--gcal">
            <div
              className="calendar-weekdays calendar-weekdays--gcal"
              aria-hidden="true"
            >
              {WEEKDAY_LABELS.map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>
            <div className="calendar-grid calendar-grid--5-weeks calendar-grid--gcal">
              {gridDays.map((day) => {
                const dateKey = formatDateKey(day);
                const dayEntries = tasksByDate[dateKey] || [];
                const isToday = dateKey === todayKey;
                const dow = day.getDay();
                const isWeekend = dow === 0 || dow === 6;

                return (
                  <article
                    key={dateKey}
                    className={`calendar-day calendar-day--gcal${
                      isToday ? " is-today" : ""
                    }${isWeekend ? " is-weekend" : ""}`}
                  >
                    <div className="calendar-day-head calendar-day-head--gcal">
                      <span className="calendar-day-number calendar-day-number--gcal">
                        {day.getDate()}
                      </span>
                      {dayEntries.length > 0 ? (
                        <span className="calendar-day-count calendar-day-count--gcal">
                          {dayEntries.length}
                        </span>
                      ) : null}
                    </div>
                    <div className="calendar-day-body calendar-day-body--gcal">
                      {dayEntries.slice(0, 3).map(({ task, placement }) => (
                        <Link
                          key={`${task.id}-${placement}`}
                          href={`/detail?tache=${task.id}&projectId=${activeProjectId}`}
                          className={`calendar-task calendar-task--gcal status-${getStatusClass(
                            task.etat,
                          )}${
                            placement === "planned"
                              ? " calendar-task--planned"
                              : ""
                          }`}
                          title={
                            placement === "planned"
                              ? "Sans date echeance — position indicative sur la periode"
                              : undefined
                          }
                        >
                          <span className="calendar-task-title calendar-task-title--gcal">
                            {task.titre}
                          </span>
                          <span className="calendar-task-category calendar-task-category--gcal">
                            {task.section || "autre"}
                            {placement === "planned" ? " · sans date" : ""}
                          </span>
                        </Link>
                      ))}
                      {dayEntries.length > 3 ? (
                        <p className="calendar-more calendar-more--gcal">
                          + {dayEntries.length - 3} autres
                        </p>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
