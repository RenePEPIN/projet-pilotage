"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { getStatusClass } from "../lib/status-utils";

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

const WEEKDAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function formatMonthTitle(date) {
  return `${MONTH_LABELS[date.getMonth()]} ${date.getFullYear()}`;
}

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildCalendarDays(monthDate) {
  const firstDayOfMonth = new Date(
    monthDate.getFullYear(),
    monthDate.getMonth(),
    1,
  );
  const monthStartsOn = (firstDayOfMonth.getDay() + 6) % 7;
  const firstGridDay = new Date(firstDayOfMonth);
  firstGridDay.setDate(firstDayOfMonth.getDate() - monthStartsOn);

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(firstGridDay);
    day.setDate(firstGridDay.getDate() + index);
    return day;
  });
}

export default function ProjectCalendar({ tasks, activeProjectId }) {
  const today = useMemo(() => new Date(), []);
  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );

  const datedTasks = useMemo(
    () => tasks.filter((task) => Boolean(task.dueDate)),
    [tasks],
  );

  const tasksByDate = useMemo(() => {
    return datedTasks.reduce((accumulator, task) => {
      const dateKey = task.dueDate;
      if (!accumulator[dateKey]) {
        accumulator[dateKey] = [];
      }
      accumulator[dateKey].push(task);
      return accumulator;
    }, {});
  }, [datedTasks]);

  const calendarDays = useMemo(
    () => buildCalendarDays(visibleMonth),
    [visibleMonth],
  );

  function showPreviousMonth() {
    setVisibleMonth(
      (current) => new Date(current.getFullYear(), current.getMonth() - 1, 1),
    );
  }

  function showNextMonth() {
    setVisibleMonth(
      (current) => new Date(current.getFullYear(), current.getMonth() + 1, 1),
    );
  }

  return (
    <section id="calendrier" className="calendar-panel">
      <div className="panel-head calendar-head">
        <div>
          <h2>Calendrier projet</h2>
          <p className="calendar-subtitle">
            Visualise les echeances du projet sur un mois glissant.
          </p>
        </div>
        <div className="calendar-controls">
          <button type="button" className="chip" onClick={showPreviousMonth}>
            Mois precedent
          </button>
          <strong className="calendar-title">
            {formatMonthTitle(visibleMonth)}
          </strong>
          <button type="button" className="chip" onClick={showNextMonth}>
            Mois suivant
          </button>
        </div>
      </div>

      {datedTasks.length === 0 ? (
        <p className="empty-column">
          Aucune echeance n&apos;est renseignee. Ajoute une date sur tes taches
          pour alimenter le calendrier.
        </p>
      ) : (
        <div className="calendar-scroll">
          <div className="calendar-weekdays" aria-hidden="true">
            {WEEKDAY_LABELS.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
          <div className="calendar-grid">
            {calendarDays.map((day) => {
              const dateKey = formatDateKey(day);
              const dayTasks = tasksByDate[dateKey] || [];
              const isCurrentMonth = day.getMonth() === visibleMonth.getMonth();
              const isToday = dateKey === formatDateKey(today);

              return (
                <article
                  key={dateKey}
                  className={`calendar-day${isCurrentMonth ? "" : " is-outside"}${isToday ? " is-today" : ""}`}
                >
                  <div className="calendar-day-head">
                    <span className="calendar-day-number">{day.getDate()}</span>
                    {dayTasks.length > 0 ? (
                      <span className="calendar-day-count">
                        {dayTasks.length}
                      </span>
                    ) : null}
                  </div>
                  <div className="calendar-day-body">
                    {dayTasks.slice(0, 3).map((task) => (
                      <Link
                        key={task.id}
                        href={`/detail?tache=${task.id}&projectId=${activeProjectId}`}
                        className={`calendar-task status-${getStatusClass(task.etat)}`}
                      >
                        <span className="calendar-task-title">
                          {task.titre}
                        </span>
                        <span className="calendar-task-category">
                          {task.section || "autre"}
                        </span>
                      </Link>
                    ))}
                    {dayTasks.length > 3 ? (
                      <p className="calendar-more">
                        + {dayTasks.length - 3} autres
                      </p>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
