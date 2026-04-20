"use client";

import { TaskCategoryKanbanColumn } from "./task-category-kanban-column";
import { TaskCategoryListTable } from "./task-category-list-table";

/**
 * Section regroupant les tâches d’une catégorie : mode Kanban ou tableau liste.
 */
export default function TaskCategorySection({
  categoryKey,
  categoryLabel,
  activeProjectId,
  categoryLabels = {},
  updateCategoryLabel = () => {},
  tasks,
  allTasks = tasks,
  onDeleteTask,
  isKanbanColumn = false,
  sortBy = "default",
  onMoveTask,
  movingTaskIds = [],
}) {
  if (isKanbanColumn) {
    return (
      <TaskCategoryKanbanColumn
        categoryKey={categoryKey}
        categoryLabel={categoryLabel}
        activeProjectId={activeProjectId}
        tasks={tasks}
        allTasks={allTasks}
        onDeleteTask={onDeleteTask}
        sortBy={sortBy}
        onMoveTask={onMoveTask}
        movingTaskIds={movingTaskIds}
      />
    );
  }

  return (
    <TaskCategoryListTable
      categoryKey={categoryKey}
      categoryLabel={categoryLabel}
      activeProjectId={activeProjectId}
      categoryLabels={categoryLabels}
      updateCategoryLabel={updateCategoryLabel}
      tasks={tasks}
      onDeleteTask={onDeleteTask}
    />
  );
}
