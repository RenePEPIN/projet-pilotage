"use client";

import ProjectCalendar from "./project-calendar";

export default function ProjectCalendarSection({
  isLoadingCalendar,
  calendarTasks,
  calendarFilteredTasks,
  activeProjectId,
}) {
  if (isLoadingCalendar && calendarTasks.length === 0) {
    return (
      <p className="info-banner" role="status" aria-live="polite">
        Chargement du calendrier...
      </p>
    );
  }

  return (
    <ProjectCalendar
      tasks={calendarFilteredTasks}
      activeProjectId={activeProjectId}
    />
  );
}
