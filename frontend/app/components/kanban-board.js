"use client";

import Link from "next/link";
import TaskCategorySection from "./task-category-section";

export default function KanbanBoard({
  activeProjectId,
  groupedTasksByStatus,
  tasks,
  sortBy,
  onDeleteTask,
  onMoveTask,
  movingTaskIds,
}) {
  return (
    <section id="taches" className="kanban-panel">
      <div className="panel-head">
        <h2>Kanban — vue par statut</h2>
        <Link
          href={`/detail?projectId=${activeProjectId}`}
          className="panel-link primary-cta"
        >
          + Ajouter une tache
        </Link>
      </div>

      <div className="kanban-columns">
        <TaskCategorySection
          key="aFaire"
          categoryKey="aFaire"
          categoryLabel="A faire"
          isKanbanColumn={true}
          activeProjectId={activeProjectId}
          tasks={groupedTasksByStatus["aFaire"] ?? []}
          allTasks={tasks}
          onDeleteTask={onDeleteTask}
          sortBy={sortBy}
          onMoveTask={onMoveTask}
          movingTaskIds={movingTaskIds}
        />
        <TaskCategorySection
          key="enCours"
          categoryKey="enCours"
          categoryLabel="En cours"
          isKanbanColumn={true}
          activeProjectId={activeProjectId}
          tasks={groupedTasksByStatus["enCours"] ?? []}
          allTasks={tasks}
          onDeleteTask={onDeleteTask}
          sortBy={sortBy}
          onMoveTask={onMoveTask}
          movingTaskIds={movingTaskIds}
        />
        <TaskCategorySection
          key="terminee"
          categoryKey="terminee"
          categoryLabel="Terminees"
          isKanbanColumn={true}
          activeProjectId={activeProjectId}
          tasks={groupedTasksByStatus["terminee"] ?? []}
          allTasks={tasks}
          onDeleteTask={onDeleteTask}
          sortBy={sortBy}
          onMoveTask={onMoveTask}
          movingTaskIds={movingTaskIds}
        />
      </div>
    </section>
  );
}
