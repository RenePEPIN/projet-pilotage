"use client";

import { STATUS_FILTER_LABELS } from "../hooks/use-project-board-state";
import CategoryManager from "./category-manager";
import GuideModal from "./guide-modal";
import KanbanBoard from "./kanban-board";
import { ProjectDashboardView } from "./project-dashboard-view";
import ProjectCalendarSection from "./project-calendar-section";
import TasksListView from "./tasks-list-view";
import TasksTableView from "./tasks-table-view";

/**
 * Vues Kanban / tableau / calendrier / liste + catégories et aide contextuelle.
 */
export function HomeContentBoardViews({
  activeView,
  activeProjectId,
  groupedTasksByStatus,
  tasks,
  sortBy,
  handleDeleteTask,
  handleMoveTask,
  movingTaskIds,
  sortedVisibleTasks,
  visibleTasks,
  isLoadingCalendar,
  calendarTasks,
  calendarFilteredTasks,
  groupedForListView,
  categoryOrder,
  categoryLabels,
  updateCategoryLabel,
  resetCategoryLabels,
  newCategoryLabel,
  setNewCategoryLabel,
  addCategory,
  tacheGuide,
}) {
  return (
    <>
      {activeView === "dashboard" ? (
        <ProjectDashboardView
          activeProjectId={activeProjectId}
          visibleTasks={visibleTasks}
          categoryOrder={categoryOrder}
          categoryLabels={categoryLabels}
        />
      ) : null}

      {activeView === "kanban" ? (
        <KanbanBoard
          activeProjectId={activeProjectId}
          groupedTasksByStatus={groupedTasksByStatus}
          tasks={tasks}
          sortBy={sortBy}
          onDeleteTask={handleDeleteTask}
          onMoveTask={handleMoveTask}
          movingTaskIds={movingTaskIds}
        />
      ) : null}

      {activeView === "table" ? (
        <TasksTableView
          activeProjectId={activeProjectId}
          sortedVisibleTasks={sortedVisibleTasks}
          statusFilterLabels={STATUS_FILTER_LABELS}
        />
      ) : null}

      {activeView === "calendar" ? (
        <ProjectCalendarSection
          isLoadingCalendar={isLoadingCalendar}
          calendarTasks={calendarTasks}
          calendarFilteredTasks={calendarFilteredTasks}
          activeProjectId={activeProjectId}
        />
      ) : null}

      {activeView === "list" ? (
        <TasksListView
          activeProjectId={activeProjectId}
          groupedForListView={groupedForListView}
          statusFilterLabels={STATUS_FILTER_LABELS}
        />
      ) : null}

      {activeView !== "calendar" && activeView !== "dashboard" ? (
        <CategoryManager
          categoryOrder={categoryOrder}
          categoryLabels={categoryLabels}
          updateCategoryLabel={updateCategoryLabel}
          resetCategoryLabels={resetCategoryLabels}
          newCategoryLabel={newCategoryLabel}
          setNewCategoryLabel={setNewCategoryLabel}
          addCategory={addCategory}
        />
      ) : null}

      {tacheGuide ? <GuideModal tacheGuide={tacheGuide} /> : null}
    </>
  );
}
