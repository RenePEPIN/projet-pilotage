"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { isTaskBlocked } from "../lib/task-dependency-ui";
import { toUiStatus } from "../lib/status-utils";
import { slugify } from "./category-constants";
import { getShortDescription, getStatusLabel } from "./task-category-display";
import { sortKanbanTasksForColumn } from "./task-category-kanban-sort";

/**
 * Colonne Kanban : drag-and-drop, cartes tâche, actions.
 */
export function TaskCategoryKanbanColumn({
  categoryKey,
  categoryLabel,
  activeProjectId,
  tasks,
  allTasks = tasks,
  onDeleteTask,
  sortBy = "default",
  onMoveTask,
  movingTaskIds = [],
}) {
  const [dragOver, setDragOver] = useState(false);
  /** Après un drag HTML5, le navigateur peut émettre un clic fantôme sur les liens — on le bloque. */
  const lastDraggedTaskIdRef = useRef(null);

  const sortedTasks = sortKanbanTasksForColumn(tasks, allTasks, sortBy);
  const headingId = `kanban-col-${categoryKey}`;

  const movingSet = new Set(
    (Array.isArray(movingTaskIds) ? movingTaskIds : []).map((id) => String(id)),
  );

  function handleColumnDragOver(e) {
    if (!onMoveTask) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function handleColumnDragEnter(e) {
    if (!onMoveTask) return;
    e.preventDefault();
    if (e.dataTransfer.types?.includes("application/json")) {
      setDragOver(true);
    }
  }

  function handleColumnDragLeave(e) {
    const next = e.relatedTarget;
    if (next && e.currentTarget.contains(next)) return;
    setDragOver(false);
  }

  function handleColumnDrop(e) {
    if (!onMoveTask) return;
    e.preventDefault();
    setDragOver(false);
    const raw = e.dataTransfer.getData("application/json");
    if (!raw) return;
    let payload;
    try {
      payload = JSON.parse(raw);
    } catch {
      return;
    }
    const taskId = payload.taskId;
    const sourceColumn = payload.sourceColumn;
    if (!taskId || sourceColumn === categoryKey) return;
    void onMoveTask(String(taskId), categoryKey);
  }

  function handleDragStart(e, tache) {
    const payload = JSON.stringify({
      taskId: tache.id,
      sourceColumn: categoryKey,
    });
    e.dataTransfer.setData("application/json", payload);
    e.dataTransfer.setData("text/plain", String(tache.id));
    e.dataTransfer.effectAllowed = "move";
    e.currentTarget.classList.add("task-card--dragging");
  }

  function handleDragEnd(e) {
    e.currentTarget.classList.remove("task-card--dragging");
    const id = e.currentTarget.getAttribute("data-task-id");
    if (id) {
      lastDraggedTaskIdRef.current = id;
      window.setTimeout(() => {
        if (lastDraggedTaskIdRef.current === id) {
          lastDraggedTaskIdRef.current = null;
        }
      }, 400);
    }
  }

  function handleCardClickCapture(e, taskId) {
    if (lastDraggedTaskIdRef.current !== String(taskId)) {
      return;
    }
    const node = e.target;
    if (!(node instanceof Element) || !node.closest("a, button")) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    lastDraggedTaskIdRef.current = null;
  }

  return (
    <section
      className={`kanban-column${
        dragOver && onMoveTask ? " kanban-column--drop-target" : ""
      }`}
      aria-labelledby={headingId}
      onDragOver={onMoveTask ? handleColumnDragOver : undefined}
      onDragEnter={onMoveTask ? handleColumnDragEnter : undefined}
      onDragLeave={onMoveTask ? handleColumnDragLeave : undefined}
      onDrop={onMoveTask ? handleColumnDrop : undefined}
    >
      <div className="kanban-column-head">
        <h3 id={headingId}>{categoryLabel}</h3>
        <span className="kanban-count" aria-label={`${tasks.length} taches`}>
          {tasks.length}
        </span>
      </div>

      <div className="kanban-column-content" role="list">
        {tasks.length === 0 ? (
          <p className="empty-column">
            {onMoveTask
              ? "Aucune tache — deposez une carte ici."
              : "Aucune tache"}
          </p>
        ) : (
          <div className="task-cards">
            {sortedTasks.map((tache) => {
              const blocked = isTaskBlocked(tache, allTasks);
              const isMoving = movingSet.has(String(tache.id));
              const canDrag = Boolean(onMoveTask) && !blocked && !isMoving;

              return (
                <article
                  key={tache.id}
                  role="listitem"
                  aria-label={`Tache ${tache.titre}`}
                  data-task-id={tache.id}
                  onClickCapture={(e) => handleCardClickCapture(e, tache.id)}
                  draggable={canDrag}
                  onDragStart={
                    canDrag ? (e) => handleDragStart(e, tache) : undefined
                  }
                  onDragEnd={canDrag ? handleDragEnd : undefined}
                  title={
                    blocked
                      ? "Dependance non terminee — deplacement desactive"
                      : canDrag
                        ? "Glisser vers une autre colonne"
                        : undefined
                  }
                  className={`task-card ${blocked ? "task-blocked" : ""}${
                    isMoving ? " task-card--moving" : ""
                  }${canDrag ? " task-card--draggable" : ""}`}
                >
                  <div className="task-card-head">
                    <h4 className="task-title">{tache.titre}</h4>
                    <span className={`status-badge ${toUiStatus(tache.etat)}`}>
                      {getStatusLabel(tache.etat)}
                    </span>
                  </div>

                  {isTaskBlocked(tache, allTasks) && (
                    <div className="task-blocked-indicator">
                      <span className="blocked-badge">Dependance</span>
                    </div>
                  )}

                  <div className="task-card-meta">
                    <span
                      className={`category-badge category-badge--${
                        slugify(tache.section || "autre") || "autre"
                      }`}
                    >
                      {tache.section || "autre"}
                    </span>
                  </div>

                  <p className="task-description">
                    {getShortDescription(tache.description)}
                  </p>

                  <div className="task-card-actions">
                    <Link
                      href={`?guide=${tache.id}&projectId=${activeProjectId}#guide-modal`}
                      className="action-link guide ui-btn ui-btn-guide"
                    >
                      Guide
                    </Link>
                    <Link
                      href={`/detail?tache=${tache.id}&projectId=${activeProjectId}`}
                      className="action-link modify ui-btn ui-btn-secondary"
                    >
                      Modifier
                    </Link>
                    <button
                      type="button"
                      className="action-link delete ui-btn ui-btn-danger"
                      onClick={() => onDeleteTask(tache.id)}
                    >
                      Supprimer
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
